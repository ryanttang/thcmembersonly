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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const coordination = await prisma.coordination.findFirst({
      where: {
        id: id,
        event: {
          ownerId: user.id,
        },
      },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const coordination = await prisma.coordination.findFirst({
      where: {
        id: id,
        event: {
          ownerId: user.id,
        },
      },
    });

    if (!coordination) {
      return NextResponse.json({ error: "Coordination not found" }, { status: 404 });
    }

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
