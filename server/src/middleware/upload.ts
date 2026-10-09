import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Allowed extensions: pdf, docx, doc, xlsx, xls, jpg, jpeg, png, zip, rar
    const allowedExts = /\.(pdf|docx|doc|xlsx|xls|jpg|jpeg|png|zip|rar)$/i;
    if (file.originalname.match(allowedExts)) {
      cb(null, true);
    } else {
      cb(new Error('ປະເພດໄຟລ໌ບໍ່ຖືກຕ້ອງ (Invalid file type. Allowed: PDF, DOCX, XLSX, JPG, PNG, ZIP)'));
    }
  },
});
