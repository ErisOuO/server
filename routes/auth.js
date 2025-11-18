import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendVerificationCode } from "../mail.js";

const router = express.Router();

/* ---------------------------- REGISTRO ---------------------------- */
router.post("/register", async (req, res) => {
  const { usuario, contrasena, email } = req.body;

  try {
    const existing = await User.findOne({ usuario });
    if (existing) return res.status(400).json({ error: "El usuario ya existe" });

    const hashed = await bcrypt.hash(contrasena, 10);

    await User.create({
      usuario,
      contrasena: hashed,
      email,
      verified: false
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/* ------------------------------ LOGIN ----------------------------- */
router.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;

  try {
    const user = await User.findOne({ usuario });
    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });

    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) return res.status(401).json({ error: "Credenciales incorrectas" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 3 * 60 * 1000);

    user.code = code;
    user.expiracion = expiracion;
    await user.save();

    await sendVerificationCode(user.email, code);

    res.json({ success: true, email: user.email });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

/* -------------------------- VERIFICACIÓN -------------------------- */
router.post("/verify", async (req, res) => {
  const { usuario, code } = req.body;

  try {
    const user = await User.findOne({ usuario, code });
    if (!user) return res.status(400).json({ error: "Código incorrecto" });

    if (user.expiracion < new Date())
      return res.status(400).json({ error: "Código expirado" });

    user.verified = true;
    user.code = null;
    user.expiracion = null;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error al verificar" });
  }
});

/* ===================== RECUPERAR CONTRASEÑA ===================== */

/* ------------ 1) Solicitar código para recuperar contraseña ------------ */
router.post("/recovery-request", async (req, res) => {
  const { usuario } = req.body;

  try {
    const user = await User.findOne({ usuario });
    if (!user) return res.status(400).json({ error: "El usuario no existe" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 3 * 60 * 1000);

    user.code = code;
    user.expiracion = expiracion;
    await user.save();

    await sendVerificationCode(user.email, code);

    res.json({ success: true, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Error al solicitar recuperación" });
  }
});

/* ---------------- 2) Validar el PIN para continuar ---------------- */
router.post("/recovery-verify", async (req, res) => {
  const { usuario, code } = req.body;

  try {
    const user = await User.findOne({ usuario, code });
    if (!user) return res.status(400).json({ error: "Código incorrecto" });

    if (user.expiracion < new Date())
      return res.status(400).json({ error: "Código expirado" });

    // Marcamos que el usuario puede restablecer la contraseña
    user.allowReset = true;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error al validar el código" });
  }
});

/* ------------------ 3) Restablecer la contraseña ------------------ */
router.post("/reset-password", async (req, res) => {
  const { usuario, nuevaContrasena } = req.body;

  try {
    const user = await User.findOne({ usuario });
    if (!user || !user.allowReset)
      return res.status(400).json({ error: "No autorizado para cambiar contraseña" });

    const hashed = await bcrypt.hash(nuevaContrasena, 10);

    user.contrasena = hashed;
    user.allowReset = false;
    user.code = null;
    user.expiracion = null;

    await user.save();

    res.json({ success: true, message: "Contraseña actualizada" });
  } catch (err) {
    res.status(500).json({ error: "Error al restablecer contraseña" });
  }
});

export default router;
