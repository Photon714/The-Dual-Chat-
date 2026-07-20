import { Pool } from "pg";
//immediately when the app starts this pool will make several connection hence hence whenever a query is made new connection wont be required rather the existing one will be used
//onces the query is over it returns the connection back to pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, //connecting with db
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  //ssl secure socket layer, if the app is in production then it will use ssl and reject unauthorized connections else it will not use ssl
  //ssl basically encrypts the connection ie over the internet it cannot be access by unauth ppl also making ssl certification for the connection is hectic hence while in localhost or dev phase ssl is usually not used
});

export async function initDb() {
  const client = await pool.connect();
  //To execute all the table query in one go , holding onto a single client till all the queries are made
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room_code TEXT NOT NULL,
        username TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_code, created_at);
    `);
    console.log("Database tables initialized");
  } finally {
    client.release(); //releasing after the queries are done 
  }
}

export default pool;
