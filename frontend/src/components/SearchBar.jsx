import { useState } from 'react';
import { GENRE_OPTIONS } from '../constants/genres.js';
import '../styles/SearchBar.css';

export default function SearchBar({ onSearch = () => {} }) {
  const [filters, setFilters] = useState({
    title: '',
    author: '',
    genre: '',
    startYear: '',
    endYear: '',
    premium: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    const cleared = {
      title: '',
      author: '',
      genre: '',
      startYear: '',
      endYear: '',
      premium: '',
    };
    setFilters(cleared);
    onSearch(cleared);
  };

  return (
    <div className="search-bar-container">
      <form className="search-bar" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search by title..."
            name="title"
            value={filters.title}
            onChange={handleInputChange}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </div>

        <button
          type="button"
          className="filter-toggle-btn"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          Filters {showFilters ? '▲' : '▼'}
        </button>
      </form>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="author">Author</label>
            <input
              type="text"
              id="author"
              name="author"
              placeholder="e.g. Stephen King"
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
              <option value="">All genres</option>
              {GENRE_OPTIONS.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Year range</label>
            <div className="year-range">
              <input
                type="number"
                name="startYear"
                placeholder="From"
                value={filters.startYear}
                onChange={handleInputChange}
                className="filter-input"
                min="1000"
                max={new Date().getFullYear()}
              />
              <input
                type="number"
                name="endYear"
                placeholder="To"
                value={filters.endYear}
                onChange={handleInputChange}
                className="filter-input"
                min="1000"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="premium">Premium</label>
            <select
              id="premium"
              name="premium"
              value={filters.premium}
              onChange={handleInputChange}
              className="filter-input"
            >
              <option value="">All</option>
              <option value="true">Premium only</option>
              <option value="false">Free only</option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              type="submit"
              className="btn-search"
              onClick={handleSearch}
            >
              Search
            </button>
            <button
              type="button"
              className="btn-reset"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
