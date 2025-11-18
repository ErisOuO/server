import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  usuario: { type: String, unique: true, required: true },
  contrasena: { type: String, required: true },
  email: { type: String, required: true },
  verified: { type: Boolean, default: false },

  code: { type: String, default: null },

  expiracion: { type: Date, default: null },

  allowReset: { type: Boolean, default: false }
});

export default mongoose.model("User", UserSchema);
