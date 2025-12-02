/*
    * inventoryController.js
    * Author: Abdulrahman sweilam 
*/

const { parse } = require('csv-parse/sync');
const { Store, Book, Author, StoreBook, sequelize } = require('../../models');
const { Op } = require('sequelize');
const handlebars = require('handlebars');
const pdf = require('html-pdf');

function formatDate(date) {
  var d = date instanceof Date ? date : new Date(date);
  var year = d.getFullYear();
  var month = (d.getMonth() + 1).toString().padStart(2, '0');
  var day = d.getDate().toString().padStart(2, '0');
  return year + '-' + month + '-' + day;
}

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

/**
 * GET /api/store/:id/download-report
 * Generates a PDF report with top 5 priciest books and top 5 prolific authors for a store.
 */
async function downloadStoreReport(req, res, next) {
  try {
    var storeId = req.params.id;
    var store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

   const topPriciest = await StoreBook.findAll({
  attributes: ['id', 'price', 'copies', 'soldOut'],
  where: { storeId: store.id },
  include: [
    {
      model: Book,
      attributes: ['id', 'name'],
      include: [{ model: Author, attributes: ['id', 'name'] }]
    }
  ],
  order: [['price', 'DESC']],
  limit: 5
});

const priciest = topPriciest.map((sb) => {
  const p = sb.get('price');
  return {
    bookName: sb.Book ? sb.Book.name : 'Unknown',
    authorName: sb.Book && sb.Book.Author ? sb.Book.Author.name : 'Unknown',
    price: p !== undefined && p !== null && p !== '' ? Number(p).toFixed(2) : '0.00'
  };
});

    var topAuthors = await StoreBook.findAll({
      attributes: [
        [sequelize.col('Book->Author.id'), 'authorId'],
        [sequelize.col('Book->Author.name'), 'authorName'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('Book.id'))), 'bookCount']
      ],
      where: { storeId: store.id, copies: { [Op.gt]: 0 } },
      include: [
        {
          model: Book,
          attributes: [],
          include: [{ model: Author, attributes: [] }]
        }
      ],
      group: ['Book->Author.id', 'Book->Author.name'],
      order: [[sequelize.literal('"bookCount"'), 'DESC']],
      limit: 5,
      raw: true
    });

    var templateSource = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>{{storeName}} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          h1 { margin-bottom: 4px; }
          h2 { margin-top: 24px; }
          .meta { color: #555; margin-bottom: 16px; }
          ol { padding-left: 18px; }
          .item { margin-bottom: 8px; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>{{storeName}} - Inventory Report</h1>
        <div class="meta">Generated: {{date}}</div>

        <h2>Top 5 Priciest Books</h2>
        <ol>
          {{#if priciest.length}}
            {{#each priciest}}
              <li class="item">
                <span class="label">{{bookName}}</span> — $ {{price}} (Author: {{authorName}})
              </li>
            {{/each}}
          {{else}}
            <li>No books found.</li>
          {{/if}}
        </ol>

        <h2>Top 5 Prolific Authors</h2>
        <ol>
          {{#if prolific.length}}
            {{#each prolific}}
              <li class="item">
                <span class="label">{{authorName}}</span> — {{bookCount}} books available
              </li>
            {{/each}}
          {{else}}
            <li>No authors found.</li>
          {{/if}}
        </ol>
      </body>
      </html>
    `;

    var template = handlebars.compile(templateSource);
    console.log(topPriciest[0].toJSON());
    var html = template({
      storeName: store.name,
      date: formatDate(new Date()),
      priciest,
      prolific: topAuthors.map(function (row) {
        return {
          authorName: row.authorName,
          bookCount: row.bookCount
        };
      })
    });

    var filename = store.name + '-Report-' + formatDate(new Date()) + '.pdf';
    pdf.create(html, { format: 'A4' }).toBuffer(function (err, buffer) {
      if (err) return next(err);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
      return res.send(buffer);
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  uploadInventory,
  downloadStoreReport
};

