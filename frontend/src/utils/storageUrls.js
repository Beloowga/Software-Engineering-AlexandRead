const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function buildPublicUrl(rawPath) {
  if (!rawPath) return null;

  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    return rawPath;
  }

  if (!SUPABASE_URL) {
    return rawPath;
  }

  const base = SUPABASE_URL.replace(/\/+$/, '');
  return `${base}/storage/v1/object/public/${rawPath}`;
}

export function buildCoverUrl(rawPath) {
  return buildPublicUrl(rawPath);
}

export function buildBookContentUrl(rawPath) {
  return buildPublicUrl(rawPath);
}
