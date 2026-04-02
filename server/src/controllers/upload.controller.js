import fs from "fs";
import { unlink } from "fs/promises";
import { cloudinary } from "../config/cloudinary.js";

function inferResourceType(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "raw";
}

function uploadFilePathToCloudinary(filePath, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );

    const readStream = fs.createReadStream(filePath);
    readStream.on("error", reject);
    readStream.pipe(uploadStream);
  });
}

function normalizeCleanupType(type) {
  return type === "video" ? "video" : "image";
}

async function destroyUploadedMedia(files = []) {
  const normalizedFiles = files.filter(
    (item) => item && typeof item.publicId === "string" && item.publicId.trim(),
  );

  if (!normalizedFiles.length) return;

  await Promise.allSettled(
    normalizedFiles.map((item) =>
      cloudinary.uploader.destroy(item.publicId, {
        resource_type: normalizeCleanupType(item.type),
      }),
    ),
  );
}

export async function uploadTripMediaController(req, res, next) {
  const uploaded = [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    for (const file of req.files) {
      const resource_type = inferResourceType(file.mimetype);

      try {
        const result = await uploadFilePathToCloudinary(file.path, {
          folder: `trips/tmp/${userId}`,
          resource_type,
        });

        uploaded.push({
          type: resource_type,
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width ?? null,
          height: result.height ?? null,
          duration: result.duration ?? null,
          bytes: result.bytes ?? null,
        });
      } finally {
        await unlink(file.path).catch(() => {});
      }
    }

    return res.status(201).json({ files: uploaded });
  } catch (err) {
    await destroyUploadedMedia(uploaded).catch(() => {});
    next(err);
  }
}

export async function cleanupTripMediaController(req, res, next) {
  try {
    const files = Array.isArray(req.body?.files) ? req.body.files : [];
    const userId = req.user?.userId;

    const safeFiles = files.filter((item) => {
      const publicId =
        typeof item?.publicId === "string" ? item.publicId.trim() : "";

      if (!publicId) return false;

      return publicId.startsWith(`trips/tmp/${userId}/`);
    });

    await destroyUploadedMedia(safeFiles);

    res.json({
      ok: true,
      deletedCount: safeFiles.length,
    });
  } catch (err) {
    next(err);
  }
}
