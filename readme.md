## Profolio Bookstore API

Express + Sequelize service for uploading bookstore inventory via CSV and generating store-level PDF reports.

### Endpoints
- `POST /api/inventory/upload` — multipart/form-data, field name `file`, CSV columns: `store_name,store_address,book_name,pages,author_name,price`. Creates authors/stores/books as needed and increments copies per store/book; returns a processing summary.
- `GET /api/store/:id/download-report` — returns a PDF named `[Store Name]-Report-YYYY-MM-DD.pdf` with the top 5 priciest books and top 5 prolific authors (by available books) for the store.

### Local setup
1) From repo root, install root CLI deps and app deps:
```
npm install
cd profolio-bookstore && npm install
```
2) Configure env in `profolio-bookstore/.env` (DB creds, `DEBUG` optional).
3) Run migrations against your DB:
```
npx sequelize-cli db:migrate
```
4) Start the app:
```
npm start
```
The server listens on `PORT` (default 3000).

### Docker
Build and run with Postgres:
```
docker-compose up --build
```
`docker-compose.yml` mounts the repo for live reloads, exposes app on 3000, and DB on 5432. Env is read from `profolio-bookstore/.env`.

### Notes and future optimizations
- Current upload processes rows sequentially with per-row queries; for large CSVs, batch fetch/cache entities and use `bulkCreate` with `updateOnDuplicate` on `StoreBooks` (requires unique index on `(storeId, bookId)`).
- Ensure indexes: `Books(authorId)`, `StoreBooks(storeId, bookId)` (unique), optional `StoreBooks(storeId, price)` for price ordering.
- PDF generation uses `html-pdf`/PhantomJS; for faster reports, switch to a warm `puppeteer`/`playwright` renderer and precompile the Handlebars template once at module load.
- For very large uploads, stream-parse CSV instead of loading into memory, and consider chunked transactions.
