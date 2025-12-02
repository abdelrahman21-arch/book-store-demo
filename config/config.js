const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../profolio-bookstore/.env') });
module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || null,
    database: process.env.DB_NAME || 'bookstore_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres'
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
    password: process.env.TEST_DB_PASS || process.env.DB_PASS || null,
    database: process.env.TEST_DB_NAME || 'bookstore_test',
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: process.env.TEST_DB_PORT || process.env.DB_PORT || 5432,
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres'
    // ssl: true, dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } // if needed
  }
};