import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { z } from "zod";

const createVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  caption: z.string().optional(),
  videoUrl: z.string().url("Valid video URL is required"),
  videoType: z.enum(["UPLOADED", "EXTERNAL"]).default("UPLOADED"),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().positive().optional(),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
  autoplay: z.boolean().default(true),
  loop: z.boolean().default(true),
  muted: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isPublished = searchParams.get("published") !== "false";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  try {
    const videos = await prisma.recentEventVideo.findMany({
      where: isPublished ? { isPublished: true } : {},
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" }
      ],
      take: limit,
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    console.log("Received video data:", body);
    
    const validatedData = createVideoSchema.parse(body);
    console.log("Validated data:", validatedData);

    const video = await prisma.recentEventVideo.create({
      data: validatedData,
    });

    try {
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation error:", error.errors);
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
