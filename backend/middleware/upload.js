import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

const UPLOAD_DIR = process.env.VIDEO_UPLOAD_DIR || 'uploads/videos';
const MAX_SIZE_MB = Number(process.env.MAX_VIDEO_SIZE_MB || 250);
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Ensure the upload directory exists at startup
const absoluteUploadDir = path.resolve(UPLOAD_DIR);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set(['video/mp4', 'video/quicktime']);
const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, absoluteUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Only MP4 or MOV video files are allowed'));
  }

  cb(null, true);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

// Single video file field named "video"
export const handleVideoUpload = (req, res, next) => {
  const single = uploader.single('video');

  single(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: `Video exceeds the maximum allowed size of ${MAX_SIZE_MB}MB`,
        });
      }
      return res.status(400).json({ message: err.message });
    }

    if (err) {
      return res.status(400).json({ message: err.message });
    }

    next();
  });
};
