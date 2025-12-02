'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StoreBook extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      StoreBook.belongsTo(models.Store, { foreignKey: 'storeId' });
      StoreBook.belongsTo(models.Book, { foreignKey: 'bookId' });
    }

  }
  StoreBook.init({
    storeId: DataTypes.INTEGER,
    bookId: DataTypes.INTEGER,
    price: DataTypes.DECIMAL,
    copies: DataTypes.INTEGER,
    soldOut: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'StoreBook',
  });
  return StoreBook;
};