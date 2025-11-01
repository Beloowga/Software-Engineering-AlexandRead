import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
  // tu peux ajouter des headers ici si plus tard tu as du JWT
});

export default api;
