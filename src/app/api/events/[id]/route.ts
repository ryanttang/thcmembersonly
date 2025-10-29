import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { updateEventSchema } from "@/lib/validation";
import { canEditEvent } from "@/lib/rbac";
import { createSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string }}
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Look up by ID (for authenticated users)
    const event = await prisma.event.findUnique({
      where: { id: id },
      include: { heroImage: true, images: true, owner: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string }}) {
  try {
    const session = await getServerAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { email: session.user!.email! }});
    if (!user || !canEditEvent(event, user.id, user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    console.log("Received body:", JSON.stringify(body, null, 2));
    
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    
    console.log("Parsed data:", JSON.stringify(parsed.data, null, 2));

    // If title or locationName is being updated, regenerate the slug
    if (parsed.data.title || parsed.data.locationName) {
      // Get current title and locationName (use updated values or fall back to existing)
      const newTitle = parsed.data.title || event.title;
      const newLocationName = parsed.data.locationName || event.locationName;
      
      // Create new slug with both title and location name
      let slug = createSlug(newTitle, newLocationName);
      let counter = 1;
      
      // Ensure slug is unique by appending numbers if needed
      while (true) {
        const existing = await prisma.event.findFirst({
          where: { 
            slug: slug,
            id: { not: params.id } // Exclude current event
          }
        });
        
        if (!existing) {
          break;
        }
        
        slug = `${createSlug(newTitle, newLocationName)}-${counter}`;
        counter++;
      }
      
      // Add the new slug to updateData
      parsed.data.slug = slug;
    }

    // Convert datetime-local format to proper ISO format for Prisma
    const updateData: any = { ...parsed.data };
    if (updateData.startAt) {
      updateData.startAt = new Date(updateData.startAt);
    }
    if (updateData.endAt) {
      updateData.endAt = new Date(updateData.endAt);
    }

    await prisma.$transaction(async (tx) => {
      await tx.event.update({ where: { id: params.id }, data: updateData });

      // Handle hero image assignment/removal within the transaction
      if (parsed.data.heroImageId !== undefined) {
        if (parsed.data.heroImageId) {
          await tx.image.update({ where: { id: parsed.data.heroImageId }, data: { eventId: params.id } });
        } else {
          await tx.event.update({ where: { id: params.id }, data: { heroImageId: null } });
        }
      }
    });
    
    // Return the updated event with hero image included
    const eventWithHero = await prisma.event.findUnique({
      where: { id: params.id },
      include: { heroImage: true }
    });
    
    try {
      revalidatePath("/");
      revalidatePath("/events");
    } catch {}

    return NextResponse.json(eventWithHero);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ 
      error: "Failed to update event", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string }}) {
  const session = await getServerAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! }});
  if (!user || !canEditEvent(event, user.id, user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id: params.id } });

  try {
    revalidatePath("/");
    revalidatePath("/events");
  } catch {}

  return NextResponse.json({ ok: true });
}
