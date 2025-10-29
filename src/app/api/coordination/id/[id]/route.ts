import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateCoordinationSchema = z.object({
  eventId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  specialMessage: z.string().optional(),
  pointOfContacts: z.array(z.object({
    name: z.string().optional().or(z.literal("")),
    number: z.string().optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
  })).optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  slug: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('[PUT /id/:id] Request START', {
      coordinationId: id,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const updateData = updateCoordinationSchema.parse(body);

    const canManageAllEvents = user.role === "ADMIN" || user.role === "ORGANIZER";

    console.log('[PUT /id/:id] User check', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      canManageAllEvents,
      coordinationId: id,
    });

    const existingCoordination = canManageAllEvents
      ? await prisma.coordination.findUnique({
          where: { id },
          include: { event: true },
        })
      : await prisma.coordination.findFirst({
          where: { id, event: { ownerId: user.id } },
          include: { event: true },
        });

    console.log('[PUT /id/:id] Coordination lookup', {
      found: !!existingCoordination,
      coordinationId: id,
      hasEvent: !!existingCoordination?.event,
      eventOwnerId: existingCoordination?.event?.ownerId,
    });

    if (!existingCoordination) {
      const directCheck = await prisma.coordination.findUnique({
        where: { id },
        select: { id: true, event: { select: { ownerId: true } } },
      });
      
      console.log('[PUT /id/:id] Direct check', {
        exists: !!directCheck,
        coordinationId: id,
        eventOwnerId: directCheck?.event?.ownerId,
        userId: user.id,
      });
      
      if (directCheck) {
        return NextResponse.json(
          {
            error: "Forbidden",
            reason: "ownership_denied",
            details: {
              coordinationId: id,
              userId: user.id,
              userRole: user.role,
              eventOwnerId: directCheck.event?.ownerId ?? null,
            },
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: "Coordination not found" }, { status: 404 });
    }

    let newEvent: { id: string } | null = null;
    if (updateData.eventId && updateData.eventId !== existingCoordination.eventId) {
      newEvent = await prisma.event.findFirst({
        where: { id: updateData.eventId, ...(canManageAllEvents ? {} : { ownerId: user.id }) },
      });
      if (!newEvent) {
        return NextResponse.json({ error: "Event not found or permission denied" }, { status: 404 });
      }
    }

    if (updateData.title || updateData.eventId) {
      const createSlug = (text: string) =>
        text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

      const eventForSlug = newEvent || existingCoordination.event;
      if (!eventForSlug) return NextResponse.json({ error: "Event not found" }, { status: 404 });
      const coordinationTitle = updateData.title || existingCoordination.title;
      const baseSlug = createSlug(`${eventForSlug.title} ${coordinationTitle}`);
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await prisma.coordination.findFirst({
          where: { slug, id: { not: id } },
        });
        if (!existing) break;
        slug = `${baseSlug}-${counter++}`;
      }
      updateData.slug = slug;
    }

    const coordination = await prisma.coordination.update({
      where: { id },
      data: updateData,
      include: {
        event: { select: { id: true, title: true, slug: true } },
        documents: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(coordination);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


