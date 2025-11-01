// src/utils/storageUrls.js
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// fabrique une URL publique Supabase à partir d'un chemin "bucket/file.ext"
function buildPublicUrl(rawPath) {
  if (!rawPath) return null;

  // si c'est déjà une URL complète
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    return rawPath;
  }

  if (!SUPABASE_URL) {
    // on renvoie tel quel, au moins ça ne plante pas
    return rawPath;
  }

  const base = SUPABASE_URL.replace(/\/+$/, '');
  // rawPath = "covers/the-martian.jpg" ou "books/the-martian.pdf"
  return `${base}/storage/v1/object/public/${rawPath}`;
}

// image dans le bucket "covers"
export function buildCoverUrl(rawPath) {
  return buildPublicUrl(rawPath);
}

// contenu dans le bucket "books"
export function buildBookContentUrl(rawPath) {
  return buildPublicUrl(rawPath);
}
