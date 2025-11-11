import multer from 'multer'

// Use memory storage (files are buffered in memory)
const storage = multer.memoryStorage()

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept PDFs only
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed'))
  }
}

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
})

