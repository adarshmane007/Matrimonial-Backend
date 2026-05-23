import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { parseBiodata } from '../utils/biodataParser.js';
import { validate } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok =
      file.mimetype === 'application/pdf' ||
      file.originalname?.toLowerCase().endsWith('.pdf');
    cb(ok ? null : new Error('Only PDF files are allowed'), ok);
  },
});

async function extractPdfText(buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);
  return result.text?.trim() || '';
}

router.post(
  '/parse',
  [body('biodata').trim().isLength({ min: 20, max: 8000 })],
  validate,
  asyncHandler(async (req, res) => {
    const { parsed, warnings } = parseBiodata(req.body.biodata);

    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: warnings[0] || 'Could not parse biodata',
        warnings,
      });
    }

    res.json({
      success: true,
      message: 'Biodata parsed — review fields before saving profile',
      data: { parsed, warnings },
    });
  })
);

router.post(
  '/parse-pdf',
  (req, res, next) => {
    upload.single('biodataPdf')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid file upload',
        });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a biodata PDF file',
      });
    }

    let text;
    try {
      text = await extractPdfText(req.file.buffer);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Could not read PDF. Try a text-based PDF or paste biodata instead.',
      });
    }

    if (text.length < 20) {
      return res.status(400).json({
        success: false,
        message:
          'Could not extract enough text from PDF. Use a searchable PDF or paste biodata text.',
      });
    }

    const { parsed, warnings } = parseBiodata(text);

    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: warnings[0] || 'Could not parse biodata from PDF',
        warnings,
      });
    }

    res.json({
      success: true,
      message: 'PDF scanned — review and save your profile',
      data: { parsed, warnings, extractedLength: text.length },
    });
  })
);

export default router;
