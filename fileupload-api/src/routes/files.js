const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const { upload, UPLOAD_DIR } = require('../middleware/upload');
const verifyFileType = require('../middleware/verifyFileType');

const router = express.Router();
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const toDto = (req, f) => ({
  filename: f.filename,
  originalName: f.originalname,
  mimetype: f.mimetype,
  size: f.size,
  url: `${req.protocol}://${req.get('host')}/api/files/${f.filename}`,
});
const safePath = (name) => path.join(UPLOAD_DIR, path.basename(name));

// อัปโหลดไฟล์เดียดี ว
router.post('/', upload.single('file'), verifyFileType, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'กรุณาแนบไฟล์ในฟิลด์ file',
    });
  }
  res.status(201).json(toDto(req, req.file));
});

// อัปโหลดหลายไฟล์
router.post('/multiple', upload.array('files', 5), verifyFileType, (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({
      error: 'กรุณาแนบไฟล์ในฟิลด์ files',
    });
  }
  res.status(201).json({
    count: req.files.length,
    files: req.files.map((f) => toDto(req, f)),
  });
});

// รายการไฟล์รูปภาพ
router.get('/multiple', async (req, res, next) => {
  try {
    const names = await fs.readdir(UPLOAD_DIR);
    const imageNames = names.filter((name) =>
      IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase())
    );
    const files = await Promise.all(
      imageNames.map(async (name) => {
        const stat = await fs.stat(safePath(name));
        return {
          filename: name,
          size: stat.size,
          uploadedAt: stat.birthtime,
        };
      })
    );
    res.json({ count: files.length, files });
  } catch (err) {
    next(err);
  }
});

// รายการไฟล์
router.get('/', async (req, res, next) => {
  try {
    const names = await fs.readdir(UPLOAD_DIR);
    const files = await Promise.all(
      names.map(async (name) => {
        const stat = await fs.stat(safePath(name));
        return {
          filename: name,
          size: stat.size,
          uploadedAt: stat.birthtime,
        };
      })
    );
    res.json(files);
  } catch (err) {
    next(err);
  }
});

// ดาวน์โหลด
router.get('/:filename', (req, res, next) => {
  res.download(safePath(req.params.filename), (err) => {
    if (err && !res.headersSent) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'ไม่พบไฟล์' });
      }
      next(err);
    }
  });
});

// ลบ
router.delete('/:filename', async (req, res, next) => {
  try {
    await fs.unlink(safePath(req.params.filename));
    res.status(204).end();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'ไม่พบไฟล์' });
    }
    next(err);
  }
});

module.exports = router;
