/*
    * inventoryController.js
    * Author: Abdulrahman sweilam 
*/

const { parse } = require('csv-parse/sync');

/**
 * Handles CSV inventory upload.
 * Expects multipart/form-data with field name "file".
 * Responds with a basic summary and a small sample of parsed rows.
 */
async function uploadInventory(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required (field name: file)' });
    }

    const csvText = req.file.buffer.toString('utf-8');
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });


    return res.status(201).json({
      message: 'Inventory file processed',
      rows: records.length,
      sample: records.slice(0, 5)
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  uploadInventory
};
