

/*
 * uploadValidation.js
 * Author: Abdulrahman sweilam
 */

/**
 * Ensures the multipart request contains a file under the "file" field.
 * Normalizes the file onto req.file for downstream handlers.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {import('express').Response|void}
 */
function enforceFileField(req, res, next) {
  if (!req.files || !req.files.file || !req.files.file[0]) {
    return res.status(400).json({ error: 'CSV file is required in field "file"' });
  }
  req.file = req.files.file[0];
  return next();
}

/**
 * Validates that the uploaded file is a CSV (MIME or .csv extension).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {import('express').Response|void}
 */
function ensureCsvFile(req, res, next) {
  var file = req.file;
  var isCsv = file && (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv'));
  if (!isCsv) {
    return res.status(400).json({ error: 'File must be a .csv' });
  }
  return next();
}

module.exports = {
  enforceFileField,
  ensureCsvFile
};
