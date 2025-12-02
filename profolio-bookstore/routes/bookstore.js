var express = require('express');
var multer = require('multer');
var inventoryController = require('../controllers/inventoryController');

var router = express.Router();
var upload = multer({ storage: multer.memoryStorage() });

// POST /api/inventory/upload - accepts multipart/form-data with a CSV file
router.post('/upload', upload.single('file'), inventoryController.uploadInventory);

module.exports = router;

