import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

// Usa la variable del .env que apunta a Neon
const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require", // Neon exige SSL
});

export default sql;
