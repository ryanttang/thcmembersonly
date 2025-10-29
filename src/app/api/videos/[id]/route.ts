import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { z } from "zod";

const updateVideoSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  caption: z.string().optional(),
  videoUrl: z.string().url("Valid video URL is required").optional(),
  videoType: z.enum(["UPLOADED", "EXTERNAL"]).optional(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().positive().optional(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const video = await prisma.recentEventVideo.findUnique({
      where: { id: params.id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerAuthSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validatedData = updateVideoSchema.parse(body);

    const video = await prisma.recentEventVideo.update({
      where: { id: params.id },
      data: validatedData,
    });

    try {
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ video });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    console.error("Error updating video:", error);
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerAuthSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.recentEventVideo.delete({
      where: { id: params.id },
    });

    try {
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
