var express = require('express');
var multer = require('multer');
var inventoryController = require('../controllers/inventoryController');
var uploadValidation = require('../middlewares/uploadValidation');

var router = express.Router();
var upload = multer({ storage: multer.memoryStorage() });
var uploadFields = upload.fields([{ name: 'file', maxCount: 1 }]);

// POST /api/inventory/upload - accepts multipart/form-data with a CSV file
router.post(
  '/upload',
  uploadFields,
  uploadValidation.enforceFileField,
  uploadValidation.ensureCsvFile,
  inventoryController.uploadInventory
);

// GET /api/store/:id/download-report - returns a PDF summary for the store
router.get('/store/:id/download-report', inventoryController.downloadStoreReport);

module.exports = router;

