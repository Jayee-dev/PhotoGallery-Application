const mysql = require("mysql2/promise");
require("dotenv").config();

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME"
];

const missingVariables = requiredVariables.filter(
  (key) => process.env[key] === undefined
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing database environment variables: ${missingVariables.join(", ")}`
  );
}

const port = Number(process.env.DB_PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Invalid DB_PORT configuration.");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});

module.exports = pool;