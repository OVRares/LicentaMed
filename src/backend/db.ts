import mysql from "mysql2/promise";
import dotenv from "dotenv";


dotenv.config({ path: "./src/backend/.env" });


const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "website",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  });

console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
  
  export default pool;