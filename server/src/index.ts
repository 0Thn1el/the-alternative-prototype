import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';

import wardrobeRoutes from './routes/wardrobe';
import itemRoutes from './routes/items';
import usersRoutes from './routes/users';
import cloudinary from './config/cloudinary';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alternative-prototype')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', usersRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.get('/test-cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Cloudinary connection failed', details: String(error) });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});