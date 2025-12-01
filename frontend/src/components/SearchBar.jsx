import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import '../styles/SearchBar.css';

export default function SearchBar() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    title: '',
    author: '',
    genre: '',
    year: '',
  });
  const [genres, setGenres] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch available genres from books
  useEffect(() => {
    async function fetchGenres() {
      try {
        const res = await api.get('/books');
        const uniqueGenres = [...new Set(res.data.map(book => book.genre))].filter(Boolean).sort();
        setGenres(uniqueGenres);
      } catch (err) {
        console.error('Error fetching genres:', err);
      }
    }
    fetchGenres();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    // Build query string with filters
    const params = new URLSearchParams();
    if (filters.title) params.append('title', filters.title);
    if (filters.author) params.append('author', filters.author);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.year) params.append('year', filters.year);

    // Navigate to search results page
    navigate(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    setFilters({
      title: '',
      author: '',
      genre: '',
      year: '',
    });
  };

  return (
    <div className="search-bar-container">
      <form className="search-bar" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Rechercher un titre..."
            name="title"
            value={filters.title}
            onChange={handleInputChange}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            🔍
          </button>
        </div>

        <button
          type="button"
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filtres {showFilters ? '▲' : '▼'}
        </button>
      </form>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="author">Auteur</label>
            <input
              type="text"
              id="author"
              name="author"
              placeholder="Ex: Stephen King"
              value={filters.author}
              onChange={handleInputChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="genre">Genre</label>
            <select
              id="genre"
              name="genre"
              value={filters.genre}
              onChange={handleInputChange}
              className="filter-input"
            >
              <option value="">Tous les genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="year">Année</label>
            <input
              type="number"
              id="year"
              name="year"
              placeholder="Ex: 2024"
              value={filters.year}
              onChange={handleInputChange}
              className="filter-input"
              min="1000"
              max={new Date().getFullYear()}
            />
          </div>

          <div className="filter-actions">
            <button
              type="submit"
              className="btn-search"
              onClick={handleSearch}
            >
              Rechercher
            </button>
            <button
              type="button"
              className="btn-reset"
              onClick={handleReset}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
