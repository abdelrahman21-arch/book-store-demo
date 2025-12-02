'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex('Books', ['authorId']);

    await queryInterface.addIndex(
      'StoreBooks',
      ['storeId', 'bookId'],
      { unique: true, name: 'storebooks_store_book_uq' }
    );
    await queryInterface.addIndex('StoreBooks', ['storeId']);
    await queryInterface.addIndex('StoreBooks', ['bookId']);
    await queryInterface.addIndex(
      'StoreBooks',
      ['storeId', 'soldOut'],
      { name: 'storebooks_store_soldout_idx' }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('StoreBooks', 'storebooks_store_soldout_idx');
    await queryInterface.removeIndex('StoreBooks', 'storebooks_store_book_uq');
    await queryInterface.removeIndex('StoreBooks', ['bookId']);
    await queryInterface.removeIndex('StoreBooks', ['storeId']);
    await queryInterface.removeIndex('Books', ['authorId']);
  }
};
