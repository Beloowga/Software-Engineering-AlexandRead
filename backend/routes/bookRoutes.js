import express from 'express';
import { getBooks, getBookById, searchBooks } from '../controllers/bookController.js';
const router = express.Router();

router.get('/search', searchBooks);
router.get('/', getBooks);
router.get('/:id', getBookById);

export default router;
