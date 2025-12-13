// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookRoutes from './routes/bookRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// route de test
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

//Recommendation routes API
app.use('/api/recommendations',recommendationRoutes);

// routes API
app.use('/api/books', bookRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
