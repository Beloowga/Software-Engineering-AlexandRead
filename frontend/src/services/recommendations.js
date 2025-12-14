import api from './api.js';

export async function fetchRecommendations() {
  const { data } = await api.get('/recommendations');
  return data || [];
}
