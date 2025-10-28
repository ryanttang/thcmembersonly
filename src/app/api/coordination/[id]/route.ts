import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const coordination = await prisma.coordination.findFirst({
      where: {
        id: params.id,
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

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    
    const updateData = updateCoordinationSchema.parse(body);

    // Verify the coordination belongs to the user
    const existingCoordination = await prisma.coordination.findFirst({
      where: {
        id: params.id,
        event: {
          ownerId: user.id,
        },
      },
    });

    if (!existingCoordination) {
      return NextResponse.json({ error: "Coordination not found" }, { status: 404 });
    }

    let newEvent = null;
    
    // If eventId is being updated, verify the new event exists and user has permission
    if (updateData.eventId && updateData.eventId !== existingCoordination.eventId) {
      const canManageAllEvents = user.role === "ADMIN" || user.role === "ORGANIZER";
      
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
      const eventForSlug = newEvent || await prisma.event.findUnique({
        where: { id: newEvent?.id || existingCoordination.eventId }
      });
      
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
            id: { not: params.id } // Exclude current coordination
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
      where: { id: params.id },
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
    logger.info('Coordination updated', {
      coordinationId: params.id,
      eventId: coordination.eventId,
      title: coordination.title,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      duration: `${duration}ms`,
      changes: Object.keys(updateData),
    });

    return NextResponse.json(coordination);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating coordination:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Verify the coordination belongs to the user
    const existingCoordination = await prisma.coordination.findFirst({
      where: {
        id: params.id,
        event: {
          ownerId: user.id,
        },
      },
    });

    if (!existingCoordination) {
      return NextResponse.json({ error: "Coordination not found" }, { status: 404 });
    }

    // Log before deletion
    logger.info('Coordination deleted', {
      coordinationId: params.id,
      eventId: existingCoordination.eventId,
      title: existingCoordination.title,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
    });

    await prisma.coordination.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coordination:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
