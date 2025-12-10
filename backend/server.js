// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookRoutes from './routes/bookRoutes.js';
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import savedBookRoutes from './routes/savedBookRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import readingRoutes from './routes/readingRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' }));

// route de test
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

// routes API
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/account/saved', savedBookRoutes);
app.use('/api/account/reading', readingRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
