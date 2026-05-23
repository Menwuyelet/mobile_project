import apiClient from './apiClient';

export const authService = {
  async register(payload) {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },

  async login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data;
  },

  async me() {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  async updateProfile(payload) {
    const { data } = await apiClient.put('/auth/profile', payload);
    return data;
  },

  async updatePassword(payload) {
    const { data } = await apiClient.put('/auth/password', payload);
    return data;
  },

  async getAdminUsers(params = {}) {
    const { data } = await apiClient.get('/auth/admin/users', { params });
    return data;
  },

  async setUserSuspension(id, suspend, reason = '') {
    const { data } = await apiClient.patch(`/auth/admin/users/${id}/suspension`, { suspend, reason });
    return data;
  },
};
