import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const cloudinaryUrl = process.env.CLOUDINARY_URL;

export const useCloudinary = !!cloudinaryUrl;

const storage = useCloudinary
  ? (() => {
      cloudinary.config({ cloudinary_url: cloudinaryUrl });
      return new CloudinaryStorage({
        cloudinary,
        params: {
          folder: 'api-school',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        },
      });
    })()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, 'src/uploads/'),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
        const base = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9-_]/g, '');
        cb(null, `${Date.now()}-${base || 'fichier'}${ext}`);
      },
    });

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Seules les images sont autorisées'));
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
