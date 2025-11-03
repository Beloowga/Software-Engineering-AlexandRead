import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import Loader from '../components/Loader.jsx';
import { buildCoverUrl, buildBookContentUrl } from '../utils/storageUrls.js';

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await api.get(`/books/${id}`);
        setBook(res.data);
      } catch (err) {
        console.error(err);
        setError("Livre introuvable !");
      } finally {
        setLoading(false);
      }
    }
    fetchBook();
  }, [id]);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!book) return null;

  const coverUrl = buildCoverUrl(book.cover_image);
  const contentUrl = buildBookContentUrl(book.content); // <- ICI le bucket "books/..."

  return (
    <div className="book-detail">
      <Link to="/" className="back-link">← Retour au catalogue</Link>

      <div className="book-detail__head">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="book-detail__cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML =
                '<div class="book-detail__cover placeholder">No cover</div>';
            }}
          />
        ) : (
          <div className="book-detail__cover placeholder">No cover</div>
        )}

        <div>
          <h1>{book.title}</h1>
          <p className="book-detail__author">{book.author}</p>
          <p className="book-detail__meta">
            {book.genre} {book.year ? `• ${book.year}` : ''}
          </p>

          {/* si le contenu existe on affiche un bouton */}
          {contentUrl && (
            <a
              href={contentUrl}
              target="_blank"
              rel="noreferrer"
              className="primary-btn"
              style={{ display: 'inline-block', marginTop: '1rem' }}
            >
              📖 Lire / Télécharger
            </a>
          )}
        </div>
      </div>

      {book.summary && (
        <section className="book-detail__section">
          <h2>Résumé</h2>
          <p>{book.summary}</p>
        </section>
      )}

      {/* si on veut afficher un aperçu inline pour les PDF */}
      {contentUrl && contentUrl.endsWith('.pdf') && (
        <section className="book-detail__section" style={{ marginTop: '1.5rem' }}>
          <h2>Aperçu</h2>
          <iframe
            src={contentUrl}
            title={`Aperçu de ${book.title}`}
            style={{ width: '100%', height: '500px', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '0.5rem' }}
          />
        </section>
      )}
    </div>
  );
}
