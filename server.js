import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Servidor escuchando en puerto ${PORT}`));
