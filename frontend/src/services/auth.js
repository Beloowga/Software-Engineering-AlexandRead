import api from './api.js';
import {
  clearStoredAuth,
  getStoredProfile,
  getStoredToken,
  persistSession,
  updateStoredProfile,
} from './authStorage.js';

export function getCurrentUser() {
  return getStoredProfile();
}

export function getCurrentToken() {
  return getStoredToken();
}

function storeAuthResponse(data) {
  if (!data) return null;
  persistSession(data.token, data.profile);
  return data.profile;
}

export async function registerUser(form) {
  const { data } = await api.post('/auth/register', form);
  return storeAuthResponse(data);
}

export async function loginUser(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return storeAuthResponse(data);
}

export async function fetchProfile() {
  const { data } = await api.get('/account/me');
  updateStoredProfile(data.profile);
  return data.profile;
}

export async function updateProfile(updates) {
  const { data } = await api.put('/account/me', updates);
  updateStoredProfile(data.profile);
  return data.profile;
}

export async function uploadAvatar(imageDataUrl) {
  const { data } = await api.post('/account/me/avatar', { image: imageDataUrl });
  updateStoredProfile(data.profile);
  return data.profile;
}

export async function deleteAccount() {
  await api.delete('/account/me');
  clearStoredAuth();
}

export function logoutUser() {
  clearStoredAuth();
}
