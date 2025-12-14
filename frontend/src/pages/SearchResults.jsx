import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import BookCard from '../components/BookCard.jsx';
import Loader from '../components/Loader.jsx';
import '../styles/SearchResults.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const title = searchParams.get('title') || '';
  const author = searchParams.get('author') || '';
  const genre = searchParams.get('genre') || '';
  const year = searchParams.get('year') || '';

  useEffect(() => {
    async function fetchSearchResults() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (title) params.append('title', title);
        if (author) params.append('author', author);
        if (genre) params.append('genre', genre);
        if (year) params.append('year', year);

        const res = await api.get(`/books/search?${params.toString()}`);
        setBooks(res.data);
        setError('');
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les résultats. Vérifier si le backend est lancé.");
      } finally {
        setLoading(false);
      }
    }

    fetchSearchResults();
  }, [title, author, genre, year]);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="search-results-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Retour
        </button>
        <h1 className="page-title">Résultats de recherche</h1>
        <div className="search-filters-display">
          {title && <span className="filter-tag">Titre: {title}</span>}
          {author && <span className="filter-tag">Auteur: {author}</span>}
          {genre && <span className="filter-tag">Genre: {genre}</span>}
          {year && <span className="filter-tag">Année: {year}</span>}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {books.length === 0 ? (
        <div className="no-results">
          <p>Aucun livre ne correspond à votre recherche.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Retourner au catalogue
          </button>
        </div>
      ) : (
        <div>
          <p className="results-count">{books.length} résultat(s) trouvé(s)</p>
          <div className="books-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
