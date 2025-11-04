import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Force rebuild for Vercel deployment

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateCoordinationSchema = z.object({
  eventId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  specialMessage: z.string().optional(),
  location: z.string().optional(),
  pointOfContacts: z.array(z.object({
    name: z.string().optional().or(z.literal("")),
    number: z.string().optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
  })).optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  slug: z.string().optional(),
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

    // Admins, Organizers, and Staff can access all coordinations, others only their own
    const canManageAllEvents = ["ADMIN", "ORGANIZER", "STAFF"].includes(user.role as any);

    const coordination = canManageAllEvents
      ? await prisma.coordination.findUnique({
          where: { id: id },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            documents: {
              orderBy: { sortOrder: "asc" },
            },
          },
        })
      : await prisma.coordination.findFirst({
          where: {
            id: id,
            event: {
              ownerId: user.id,
            },
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            documents: {
              orderBy: { sortOrder: "asc" },
            },
          },
        });

    if (!coordination) {
      return NextResponse.json({ error: "Coordination not found" }, { status: 404 });
    }

    return NextResponse.json(coordination);
  } catch (error) {
    console.error("Error fetching coordination:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('[PUT] Coordination update request START', {
      id,
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

    console.log('[PUT] User lookup', { 
      found: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    
    const updateData = updateCoordinationSchema.parse(body);

    console.log('[PUT] Request body parsed', { updateData });

    // Admins, Organizers, and Staff can access all coordinations, others only their own
    const canManageAllEvents = ["ADMIN", "ORGANIZER", "STAFF"].includes(user.role as any);

    console.log('[PUT] Permission check', {
      canManageAllEvents,
      userRole: user.role,
      coordinationId: id,
    });

    // Try to find the coordination with appropriate permissions
    let existingCoordination = null;
    
    if (canManageAllEvents) {
      // For admins/organizers/staff, look up without ownership check
      console.log('[PUT] Attempting admin lookup', { coordinationId: id, userRole: user.role });
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
      
      console.log('[PUT] Admin lookup result', {
        found: !!existingCoordination,
        coordinationId: id,
        coordinationTitle: existingCoordination?.title,
        eventId: existingCoordination?.eventId,
        hasEvent: !!existingCoordination?.event,
        eventOwnerId: existingCoordination?.event?.ownerId,
      });
    } else {
      // For regular users, must be owner of the event OR coordination has no event
      console.log('[PUT] Attempting owner lookup', { 
        coordinationId: id,
        userId: user.id,
        userRole: user.role,
      });
      existingCoordination = await prisma.coordination.findFirst({
        where: {
          id: id,
          OR: [
            { eventId: null }, // Coordinations without events can be edited by anyone
            { event: { ownerId: user.id } }, // Or user owns the event
          ],
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
      
      console.log('[PUT] Owner lookup result', {
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
      console.error('[PUT] Coordination exists but include failed', { 
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
      console.error('[PUT] Coordination not editable under current permissions', {
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
    
    console.log('[PUT] Coordination found, proceeding with update', {
      coordinationId: id,
      title: existingCoordination.title,
      eventId: existingCoordination.eventId,
    });

    let newEvent = null;
    
    // If eventId is being updated, verify the new event exists and user has permission
    if (updateData.eventId && updateData.eventId !== existingCoordination.eventId) {
      newEvent = await prisma.event.findFirst({
        where: {
          id: updateData.eventId,
          ...(canManageAllEvents ? {} : { ownerId: user.id }),
        },
      });

      if (!newEvent) {
        return NextResponse.json({ error: "Event not found or permission denied" }, { status: 404 });
      }
    }

    // If title or event is being updated, regenerate the slug
    if (updateData.title || updateData.eventId) {
      // Create slug from event title and coordination title
      const createSlug = (text: string) => {
        return text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      };

      // Get the event (either updated or existing)
      const eventForSlug = newEvent || existingCoordination.event;
      
      if (!eventForSlug) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // Use updated title or existing title
      const coordinationTitle = updateData.title || existingCoordination.title;
      
      // Combine event title and coordination title for the slug
      const combinedTitle = `${eventForSlug.title} ${coordinationTitle}`;
      const baseSlug = createSlug(combinedTitle);
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug is unique by appending numbers if needed
      while (true) {
        const existing = await prisma.coordination.findFirst({
          where: { 
            slug: slug,
            id: { not: id } // Exclude current coordination
          }
        });
        
        if (!existing) {
          break;
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Add the new slug to updateData
      updateData.slug = slug;
    }

    const startTime = Date.now();
    const coordination = await prisma.coordination.update({
      where: { id: id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        documents: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    const duration = Date.now() - startTime;

    // Log successful coordination update
    console.log('[PUT] Coordination updated successfully', {
      coordinationId: id,
      eventId: coordination.eventId,
      title: coordination.title,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      duration: `${duration}ms`,
      changes: Object.keys(updateData),
    });

    try {
      revalidatePath("/dashboard/coordination");
    } catch {}

    return NextResponse.json(coordination);
  } catch (error) {
    console.error('[PUT] Error updating coordination - DETAILED', {
      error,
      errorName: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
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

export async function DELETE(
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

    // Admins, Organizers, and Staff can access all coordinations, others only their own
    const canManageAllEvents = ["ADMIN", "ORGANIZER", "STAFF"].includes(user.role as any);

    // Verify the coordination belongs to the user (or user has admin/organizer/staff privileges)
    const existingCoordination = canManageAllEvents
      ? await prisma.coordination.findUnique({
          where: { id: id },
        })
      : await prisma.coordination.findFirst({
          where: {
            id: id,
            event: {
              ownerId: user.id,
            },
          },
        });

    if (!existingCoordination) {
      console.error('[DELETE] Coordination not found', {
        coordinationId: id,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      });
      return NextResponse.json({ error: "Coordination not found" }, { status: 404 });
    }

    // Log before deletion
    console.log('[DELETE] Coordination deleted', {
      coordinationId: id,
      eventId: existingCoordination.eventId,
      title: existingCoordination.title,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
    });

    await prisma.coordination.delete({
      where: { id: id },
    });

    try {
      revalidatePath("/dashboard/coordination");
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coordination:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
