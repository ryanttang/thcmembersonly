import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Gallery, GalleryImage, Image, Event } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admins and Organizers can see all galleries, others only see their own + standalone
    const canManageAllEvents = user.role === "ADMIN" || user.role === "ORGANIZER";

    // Get all galleries the user can access
    const galleries = await prisma.gallery.findMany({
      where: {
        OR: [
          ...(canManageAllEvents ? [] : [{ event: { ownerId: user.id } }]), // Galleries from user's events (or all for admins)
          { eventId: null }, // Standalone galleries (accessible to all users)
          ...(canManageAllEvents ? [{ id: { not: undefined } }] : []) // All galleries for admins
        ].filter(Boolean)
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        },
        images: {
          include: {
            image: true
          },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform galleries to match the expected interface
    const transformedGalleries = galleries.map((gallery: Gallery & { 
      event: Pick<Event, 'id' | 'title' | 'slug'> | null; 
      images: (GalleryImage & { image: Image })[] 
    }) => ({
      ...gallery,
      description: gallery.description || undefined,
      createdAt: gallery.createdAt.toISOString(),
      images: gallery.images.map((img: GalleryImage & { image: Image }) => ({
        ...img,
        createdAt: img.createdAt.toISOString()
      }))
    }));

    return NextResponse.json({ galleries: transformedGalleries });
  } catch (error) {
    console.error("Error fetching galleries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, eventId, tags, isPublic, images } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: "Gallery name is required" }, { status: 400 });
    }

    // Admins and Organizers can create galleries for any event
    const canManageAllEvents = user.role === "ADMIN" || user.role === "ORGANIZER";

    // Check if event exists and user has permission to access it (if eventId is provided)
    if (eventId) {
      const event = await prisma.event.findFirst({
        where: { 
          id: eventId, 
          ...(canManageAllEvents ? {} : { ownerId: user.id })
        }
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
      }
    }

    // Create gallery and optional images atomically
    const [gallery] = await prisma.$transaction([
      prisma.gallery.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          eventId: eventId || null,
          tags: tags || [],
          isPublic: isPublic !== false,
        }
      }),
    ]);

    if (images && images.length > 0) {
      const galleryImages = images.map((img: any, index: number) => ({
        galleryId: gallery.id,
        imageId: img.id,
        title: img.title || null,
        caption: img.caption || null,
        tags: img.tags || [],
        sortOrder: index,
      }));

      await prisma.galleryImage.createMany({ data: galleryImages });
    }

    // Revalidate public pages that surface galleries
    try {
      revalidatePath("/");
      revalidatePath("/gallery");
    } catch {}

    return NextResponse.json({ success: true, gallery });
  } catch (error) {
    console.error("Error creating gallery:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, description, eventId, tags, isPublic, images } = body;

    // Validate required fields
    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "Gallery ID and name are required" }, { status: 400 });
    }

    // Check if gallery exists and user has access to it
    const existingGallery = await prisma.gallery.findFirst({
      where: { 
        id,
        OR: [
          { event: { ownerId: user.id } }, // User owns the associated event
          { eventId: null } // Or it's a standalone gallery (anyone can edit)
        ]
      },
      include: { event: true }
    });

    if (!existingGallery) {
      return NextResponse.json({ error: "Gallery not found or access denied" }, { status: 404 });
    }

    // Check if event exists and user owns it (if eventId is provided)
    if (eventId) {
      const event = await prisma.event.findFirst({
        where: { id: eventId, ownerId: user.id }
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
      }
    }

    // Update gallery and sync images atomically
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.gallery.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          eventId: eventId || null,
          tags: tags || [],
          isPublic: isPublic !== false,
        }
      });

      if (images && images.length > 0) {
        await tx.galleryImage.deleteMany({ where: { galleryId: id } });
        const galleryImages = images.map((img: any, index: number) => ({
          galleryId: id,
          imageId: img.id,
          title: img.title || null,
          caption: img.caption || null,
          tags: img.tags || [],
          sortOrder: index,
        }));
        await tx.galleryImage.createMany({ data: galleryImages });
      }

      return updated;
    });

    try {
      revalidatePath("/");
      revalidatePath("/gallery");
    } catch {}

    return NextResponse.json({ success: true, gallery: result });
  } catch (error) {
    console.error("Error updating gallery:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
