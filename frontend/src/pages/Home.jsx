import { useEffect, useState } from 'react';
import api from '../services/api.js';
import BookCard from '../components/BookCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Loader from '../components/Loader.jsx';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await api.get('/books');
        setBooks(res.data);
        setFilteredBooks(res.data);
      } catch (err) {
        console.error(err);
        setError('Unable to load books. Check that the backend and database are running.');
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  const applyFilters = (allBooks, filters) => {
    return allBooks.filter((book) => {
      if (filters.title && !book.title.toLowerCase().includes(filters.title.toLowerCase())) {
        return false;
      }
      if (filters.author && !book.author.toLowerCase().includes(filters.author.toLowerCase())) {
        return false;
      }
      if (filters.genre && book.genre !== filters.genre) {
        return false;
      }
      if (filters.startYear && Number(book.year) < Number(filters.startYear)) {
        return false;
      }
      if (filters.endYear && Number(book.year) > Number(filters.endYear)) {
        return false;
      }
      if (filters.premium === 'true' && !book.premium) {
        return false;
      }
      if (filters.premium === 'false' && book.premium) {
        return false;
      }
      return true;
    });
  };

  const handleSearch = (filters) => {
    setFilteredBooks(applyFilters(books, filters));
  };

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1 className="page-title">Catalog search</h1>
      <SearchBar onSearch={handleSearch} />
      {filteredBooks.length === 0 ? (
        <p className="empty-state">No books match your search.</p>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
