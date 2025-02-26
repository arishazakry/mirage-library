import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pgPool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "radio_db",
  password: process.env.PG_PASSWORD || "password",
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  max: 20, // Tối đa 20 kết nối
  idleTimeoutMillis: 30000, // Timeout sau 30s
  connectionTimeoutMillis: 2000, // Chờ kết nối tối đa 2s
});
export default pgPool;
