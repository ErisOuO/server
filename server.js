import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./database.js";
import authRoutes from "./routes/auth.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.listen(process.env.PORT, () =>
  console.log(`🚀 Servidor listo en puerto ${process.env.PORT}`)
);
