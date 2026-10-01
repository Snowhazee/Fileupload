const fs = require('fs/promises');
const path = require('path');
const FileType = require('file-type'); // v16
const { ALLOWED } = require('./upload');

module.exports = async function verifyFileType(req, res, next) {
  const files = req.file ? [req.file] : req.files || [];

  try {
    for (const file of files) {
      const detected = await FileType.fromFile(file.path);
      const extension = path.extname(file.originalname).toLowerCase();

      if (
        !detected ||
        detected.mime !== file.mimetype ||
        !ALLOWED[detected.mime]?.includes(extension)
      ) {
        await Promise.all(
          files.map((uploadedFile) =>
            fs.unlink(uploadedFile.path).catch(() => {})
          )
        );
        return res.status(415).json({
          error: `File content type is not allowed: ${file.originalname}`,
        });
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
};