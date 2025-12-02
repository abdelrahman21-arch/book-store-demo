/*
    * inventoryController.js
    * Author: Abdulrahman sweilam 
*/

const { parse } = require('csv-parse/sync');
const { Store, Book, Author, StoreBook, sequelize } = require('../../models');

/**
 * Handles CSV inventory upload.
 * Expects multipart/form-data with field name "file".
 * Responds with a basic summary and a small sample of parsed records.
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
    const results = { processed: 0, createdAuthors: 0, createdStores: 0, createdBooks: 0, createdStoreBooks: 0, updatedStoreBooks: 0, errors: [] }; // define a results object to collect status here.

    await sequelize.transaction(async (t) => {                   //  begin transaction
      for (const record of records){
         const storeName = record.store_name?.trim();
        const storeAddress = record.store_address?.trim();
        const bookName = record.book_name?.trim();
        const pages = record.pages ? parseInt(record.pages, 10) :  null;
        const authorName = record.author_name?.trim();
        const price = record.price ? parseFloat(record.price) : null;

        if (!storeName || !bookName || !authorName) {
          results.errors.push({ record, error: 'Missing store_name/book_name/author_name' });
          continue;
        }
         const [author, authorCreated] = await Author.findOrCreate({
          where: { name: authorName },
          defaults: { name: authorName },
          transaction: t
        });
        if (authorCreated) results.createdAuthors++;

        const [store, storeCreated] = await Store.findOrCreate({
          where: { name: storeName, address: storeAddress || null },
          defaults: { name: storeName, address: storeAddress || null },
          transaction: t
        });
        if (storeCreated) results.createdStores++;

        const [book, bookCreated] = await Book.findOrCreate({
          where: { name: bookName, authorId: author.id },
          defaults: { name: bookName, pages: pages || null, authorId: author.id },
          transaction: t
        });
        if (bookCreated) results.createdBooks++;

      const existingStoreBook = await StoreBook.findOne({
          where: { storeId: store.id, bookId: book.id },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        const copiesInc = 1;


        if (existingStoreBook) {
          
          await existingStoreBook.update(
            {
              copies: (existingStoreBook.copies || 0) + copiesInc,
              price: price ?? existingStoreBook.price
            },
            { transaction: t }
          );
          results.updatedStoreBooks++;
        } else {
          await StoreBook.create(
            { storeId: store.id, bookId: book.id, price: price ?? 0, copies: copiesInc, soldOut: false },
            { transaction: t }
          );
          results.createdStoreBooks++;
        }
         results.processed++;

      }
    })  //  end transaction

    return res.status(201).json({
      message: 'Inventory file processed',
      summary: results,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  uploadInventory
};
