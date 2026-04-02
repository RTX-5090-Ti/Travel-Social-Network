import fs from "fs";
import path from "path";
import multer from "multer";

export const MAX_TRIP_MEDIA_FILES = 6;
export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;

const TMP_UPLOAD_DIR = path.join(process.cwd(), "tmp", "uploads");
fs.mkdirSync(TMP_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, TMP_UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`,
    );
  },
});

const allowedImageMime = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const allowedMediaMime = new Set([
  ...allowedImageMime,
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
]);

function createMimeFilter(allowedMime, message = "Unsupported file type") {
  return function fileFilter(req, file, cb) {
    if (!allowedMime.has(file.mimetype)) {
      return cb(new Error(message), false);
    }
    cb(null, true);
  };
}

export const uploadTripMedia = multer({
  storage,
  fileFilter: createMimeFilter(allowedMediaMime),
  limits: {
    files: MAX_TRIP_MEDIA_FILES,
    fileSize: 25 * 1024 * 1024,
  },
});

export const uploadAvatar = multer({
  storage,
  fileFilter: createMimeFilter(
    allowedImageMime,
    "Avatar must be an image file",
  ),
  limits: {
    files: 1,
    fileSize: MAX_AVATAR_FILE_SIZE,
  },
});
