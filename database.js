import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "INVERNATECH"
    });
    console.log("✅ MongoDB conectado");
  } catch (err) {
    console.error("❌ Error al conectar MongoDB:", err);
  }
}