import { useEffect, useState } from 'react';
import api from '../services/api.js';
import BookCard from '../components/BookCard.jsx';
import Loader from '../components/Loader.jsx';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await api.get('/books');
        setBooks(res.data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les livres 😢. Vérifier si le backend est lancé et/ou la database est bien en ligne.");
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1 className="page-title">Catalogue</h1>
      {books.length === 0 ? (
        <p>Aucun livre pour le moment.</p>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
