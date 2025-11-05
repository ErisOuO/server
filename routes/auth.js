// server/routes/auth.js
import express from 'express';
import sql from '../db.js';
import bcrypt from 'bcryptjs';
import { sendVerificationCode } from '../mail.js';

const router = express.Router();

// 🧩 Registro de usuario
router.post('/register', async (req, res) => {
  const { usuario, contrasena, email } = req.body;

  try {
    const existing = await sql`SELECT * FROM tblusuarios WHERE usuario = ${usuario}`;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hashear la contraseña antes de guardarla
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    await sql`
      INSERT INTO tblusuarios (usuario, contrasena, email, verified)
      VALUES (${usuario}, ${hashedPassword}, ${email}, false)
    `;

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🧩 Inicio de sesión — genera código y lo envía al correo
router.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;

  try {
    const users = await sql`SELECT * FROM tblusuarios WHERE usuario = ${usuario}`;
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = users[0];
    const match = await bcrypt.compare(contrasena, user.contrasena);

    if (!match) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 3 * 60 * 1000); // +3 min

    await sql`
      UPDATE tblusuarios 
      SET code = ${code}, expiracion = ${expiracion}
      WHERE id = ${user.id}
    `;

    await sendVerificationCode(user.email, code);
    res.json({ success: true, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// 🧩 Verificación del código
router.post('/verify', async (req, res) => {
  const { usuario, code } = req.body;

  try {
    const rows = await sql`SELECT * FROM tblusuarios WHERE usuario = ${usuario} AND code = ${code}`;
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    const user = rows[0];
    if (new Date(user.expiracion) < new Date()) {
      return res.status(400).json({ error: 'El código ha expirado' });
    }

    await sql`
      UPDATE tblusuarios 
      SET verified = true, code = NULL, expiracion = NULL
      WHERE id = ${user.id}
    `;

    res.json({ success: true, message: 'Verificación exitosa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar el código' });
  }
});

export default router;
