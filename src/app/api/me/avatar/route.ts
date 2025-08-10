import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { v2 as cloudinary } from "cloudinary";
import { ENV } from "@/lib/env";

export const runtime = "nodejs";

// Configure Cloudinary lazily inside the handler to avoid build-time env requirements

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();

  try {
    cloudinary.config({
      cloud_name: ENV.CLOUDINARY_CLOUD_NAME(),
      api_key: ENV.CLOUDINARY_API_KEY(),
      api_secret: ENV.CLOUDINARY_API_SECRET(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Cloudinary environment variables are not configured" },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  // Convert to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Cloudinary using upload_stream
  const uploadResult: { secure_url: string } = await new Promise(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "avatars", resource_type: "image" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({ secure_url: result.secure_url });
        }
      );
      stream.end(buffer);
    }
  );

  await User.findByIdAndUpdate(auth.userId, {
    $set: { avatarUrl: uploadResult.secure_url },
  });

  return NextResponse.json({ avatarUrl: uploadResult.secure_url });
}
