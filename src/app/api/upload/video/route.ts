import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadBufferToS3 } from "@/lib/s3";
// Rate limiting will be imported dynamically to use user-based keys
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large video uploads

// Video upload configuration
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB - reasonable for video files
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10MB for thumbnails

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // MOV files
  "video/x-msvideo", // AVI files
  "video/x-matroska", // MKV files
];

// Allowed image MIME types for thumbnails
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(req: NextRequest) {
  try {
    // Authentication check (before rate limiting to get user info)
    const session = await getServerAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Rate limiting - user-based for authenticated users
    const { rateLimit } = await import("@/lib/rate-limit");
    const videoUploadRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 video uploads per 15 minutes (more restrictive than general uploads)
      keyGenerator: () => `video_upload:${user.id}`, // User-based key
    });

    const rateLimitResult = await videoUploadRateLimit(req);
    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset);
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: "Upload rate limit exceeded",
          message: `Too many video uploads. Please try again after ${new Date(rateLimitResult.reset).toLocaleTimeString()}`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": resetDate.toISOString(),
          },
        }
      );
    }

    // Parse form data
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const fileType = form.get("fileType") as string | null; // "video" or "thumbnail"

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    if (!fileType || !["video", "thumbnail"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid fileType. Must be 'video' or 'thumbnail'" },
        { status: 400 }
      );
    }

    // File size validation
    const maxSize = fileType === "video" ? MAX_VIDEO_SIZE : MAX_THUMBNAIL_SIZE;
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
      return NextResponse.json(
        {
          error: `File too large: ${fileSizeMB}MB`,
          message: `Maximum allowed size: ${maxSizeMB}MB for ${fileType} files`,
        },
        { status: 413 }
      );
    }

    // MIME type validation
    const allowedTypes =
      fileType === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Unsupported file type",
          message: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
          allowedTypes,
        },
        { status: 400 }
      );
    }

    // Check AWS configuration
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.S3_BUCKET
    ) {
      console.error("AWS configuration missing:", {
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        hasBucket: !!process.env.S3_BUCKET,
      });
      return NextResponse.json(
        { error: "AWS configuration missing" },
        { status: 500 }
      );
    }

    // Convert file to buffer
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // Generate unique key
    const fileExtension = file.name.split(".").pop() || "bin";
    const keyPrefix = fileType === "video" ? "videos/" : "videos/thumbnails/";
    const key = `${keyPrefix}${randomUUID()}-${Date.now()}.${fileExtension}`;

    // Upload to S3
    const fileUrl = await uploadBufferToS3(
      key,
      buffer,
      file.type,
      "public, max-age=31536000, immutable"
    );

    return NextResponse.json(
      {
        url: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        key,
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

