const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Testing connection to:', process.env.DB_HOST);
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    });
    console.log('Successfully connected to the database!');
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error.message);
    if (error.code === 'ETIMEDOUT') {
      console.log('Suggestion: Check if the Railway database is active and if the external port has changed.');
    }
  }
}

testConnection();
