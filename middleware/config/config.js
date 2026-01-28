// config/config.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3002,
  DB_CONFIG: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD??'',
    database: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT?? "mysql",
    
  },
  
  CORS_ORIGIN: process.env.CORS_ORIGIN?? "http://localhost:3000",

  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: `"${process.env.EMAIL_SENDER_NAME?? "Apartment Manager"}" <${process.env.EMAIL_USER}>`,

  NODE_ENV: process.env.NODE_ENV ?? "development",
  BASE_URL: process.env.BASE_URL?? "http://localhost:3000",

};