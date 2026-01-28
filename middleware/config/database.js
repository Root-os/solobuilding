const { Sequelize } = require('sequelize');
const { DB_CONFIG } = require('./config');

// Create a Sequelize instance
const sequelize = new Sequelize(DB_CONFIG.database, DB_CONFIG.user, DB_CONFIG.password, {
  host: DB_CONFIG.host,
  dialect: DB_CONFIG.dialect,
  logging: false, // Disable logging; default: console.log
});
// console.log('DB User:', DB_CONFIG.user); // Should print 'root'
// console.log('DB Password:', DB_CONFIG.password); 
module.exports = sequelize;
