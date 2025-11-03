import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { CoordinationDocumentType } from "@prisma/client";

const createDocumentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(CoordinationDocumentType),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().min(0),
  mimeType: z.string().min(1),
  sortOrder: z.number().optional().default(0),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admins, Organizers, and Staff can access all coordinations
    const canManageAllEvents = ["ADMIN", "ORGANIZER", "STAFF"].includes(user.role as any);
    const coordination = canManageAllEvents
      ? await prisma.coordination.findUnique({ where: { id } })
      : await prisma.coordination.findFirst({
          where: { id, event: { ownerId: user.id } },
        });

    if (!coordination) {
      return NextResponse.json({ error: "Coordination not found" }, { status: 404 });
    }

    const documents = await prisma.coordinationDocument.findMany({
      where: { coordinationId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    
    console.log('[POST] Document upload request START', {
      coordinationId: id,
      params,
      requestUrl: request.url,
      method: request.method,
    });

    const session = await getServerAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    console.log('[POST] User lookup', { 
      found: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admins, Organizers, and Staff can access all coordinations, others only their own
    const canManageAllEvents = ["ADMIN", "ORGANIZER", "STAFF"].includes(user.role as any);

    console.log('[POST] Permission check', {
      canManageAllEvents,
      userRole: user.role,
      coordinationId: id,
    });

    // Try to find the coordination with appropriate permissions
    let existingCoordination = null;
    
    if (canManageAllEvents) {
      // For admins/organizers/staff, look up without ownership check
      console.log('[POST] Attempting admin lookup', { coordinationId: id, userRole: user.role });
      existingCoordination = await prisma.coordination.findUnique({
        where: { id: id },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              ownerId: true,
            },
          },
        },
      });
      
      console.log('[POST] Admin lookup result', {
        found: !!existingCoordination,
        coordinationId: id,
        coordinationTitle: existingCoordination?.title,
        eventId: existingCoordination?.eventId,
        hasEvent: !!existingCoordination?.event,
        eventOwnerId: existingCoordination?.event?.ownerId,
      });
    } else {
      // For regular users, must be owner of the event
      console.log('[POST] Attempting owner lookup', { 
        coordinationId: id,
        userId: user.id,
        userRole: user.role,
      });
      existingCoordination = await prisma.coordination.findFirst({
        where: {
          id: id,
          event: { ownerId: user.id },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              ownerId: true,
            },
          },
        },
      });
      
      console.log('[POST] Owner lookup result', {
        found: !!existingCoordination,
        coordinationId: id,
        userId: user.id,
        coordinationTitle: existingCoordination?.title,
        eventId: existingCoordination?.eventId,
        hasEvent: !!existingCoordination?.event,
      });
    }
    
    // If lookup failed but user has permission, do a direct check
    if (!existingCoordination && canManageAllEvents) {
      const directCheck = await prisma.coordination.findUnique({
        where: { id: id },
        select: { id: true, title: true, eventId: true },
      });
      console.error('[POST] Coordination exists but include failed', { 
        exists: !!directCheck,
        coordinationId: id,
        title: directCheck?.title,
        eventId: directCheck?.eventId,
      });
      // If it exists, do a simpler query without include
      if (directCheck) {
        existingCoordination = await prisma.coordination.findUnique({
          where: { id: id },
        }) as any;
        if (existingCoordination && directCheck.eventId) {
          existingCoordination.event = await prisma.event.findUnique({
            where: { id: directCheck.eventId },
            select: { id: true, title: true, ownerId: true },
          });
        }
      }
    }

    if (!existingCoordination) {
      console.error('[POST] Coordination not editable under current permissions', {
        coordinationId: id,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        canManageAllEvents,
        requestUrl: request.url,
        timestamp: new Date().toISOString(),
      });

      // Direct database check to distinguish between not found vs ownership denial
      const directCheck = await prisma.coordination.findUnique({
        where: { id: id },
        select: { 
          id: true, 
          title: true, 
          eventId: true,
          event: {
            select: { id: true, title: true, ownerId: true }
          }
        }
      });

      if (directCheck) {
        // Exists but not visible under current permission rules → explicit 403
        return NextResponse.json({ 
          error: "Forbidden",
          reason: "ownership_denied",
          details: {
            coordinationId: id,
            userId: user.id,
            userRole: user.role,
            eventOwnerId: directCheck.event?.ownerId ?? null,
          }
        }, { status: 403 });
      }

      // Truly not found
      return NextResponse.json({ 
        error: "Coordination not found",
        details: {
          coordinationId: id,
          userRole: user.role,
          coordinationExists: false,
        }
      }, { status: 404 });
    }

    console.log('[POST] Coordination found, proceeding with document upload', {
      coordinationId: id,
      title: existingCoordination.title,
      eventId: existingCoordination.eventId,
    });

    const body = await request.json();
    const documentData = createDocumentSchema.parse(body);

    const startTime = Date.now();
    const document = await prisma.coordinationDocument.create({
      data: {
        coordinationId: id,
        ...documentData,
      },
    });
    const duration = Date.now() - startTime;

    // Log successful document creation
    logger.info('Coordination document created', {
      documentId: document.id,
      coordinationId: id,
      title: documentData.title,
      type: documentData.type,
      fileName: documentData.fileName,
      fileSize: documentData.fileSize,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      duration: `${duration}ms`,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const coordinationId = id; // Capture for error logging
    console.error('[POST] Error creating document - DETAILED', {
      error,
      errorName: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      coordinationId,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
