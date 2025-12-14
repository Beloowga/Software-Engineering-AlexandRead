import { useEffect, useMemo, useRef, useState } from 'react';
import { GENRE_OPTIONS } from '../constants/genres.js';

const MAX_GENRES = 5;

export default function GenreMultiSelect({ id, value = [], onChange, placeholder = 'Select genres' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (genre) => {
    if (value.includes(genre)) {
      onChange?.(value.filter((item) => item !== genre));
      return;
    }
    if (value.length >= MAX_GENRES) {
      return;
    }
    onChange?.([...value, genre]);
  };

  const summary = useMemo(() => {
    if (!value || value.length === 0) return placeholder;
    const display = value.slice(0, 3).join(', ');
    if (value.length <= 3) return display;
    return `${display} (+${value.length - 3})`;
  }, [value, placeholder]);

  return (
    <div className="genre-select" ref={containerRef}>
      <button
        type="button"
        className="genre-select__control"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        id={id}
      >
        <span className={`genre-select__placeholder ${value.length ? 'has-value' : ''}`}>
          {summary}
        </span>
        <span className={`genre-select__chevron ${open ? 'open' : ''}`} aria-hidden="true">v</span>
      </button>
      {open && (
        <div className="genre-select__dropdown" role="listbox" aria-multiselectable="true">
          {GENRE_OPTIONS.map((genre) => {
            const selected = value.includes(genre);
            const disableNewSelection = !selected && value.length >= MAX_GENRES;
            return (
              <label key={genre} className={`genre-select__option ${disableNewSelection ? 'is-disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => handleToggle(genre)}
                  disabled={disableNewSelection}
                />
                <span>{genre}</span>
              </label>
            );
          })}
        </div>
      )}
      {value?.length > 0 && (
        <div className="genre-select__badges">
          {value.map((genre) => (
            <span key={genre} className="genre-select__badge">
              {genre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
