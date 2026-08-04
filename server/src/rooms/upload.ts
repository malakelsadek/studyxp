import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const UPLOAD_DIR = path.resolve("uploads", "rooms");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

export const uploadRoomBackground = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

export function deleteUploadedFile(backgroundUrl: string | null) {
  if (!backgroundUrl || !backgroundUrl.startsWith("/uploads/rooms/")) return;
  const filePath = path.resolve(".", backgroundUrl.replace(/^\//, ""));
  fs.unlink(filePath, () => {
    // best-effort cleanup; a leftover file isn't worth failing the request over
  });
}
