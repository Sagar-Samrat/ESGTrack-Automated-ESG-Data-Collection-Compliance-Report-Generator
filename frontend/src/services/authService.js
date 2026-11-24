import api from './api';

export const authService = {
  async register(name, email, password, companyName) {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      company_name: companyName,
    });
    return res.data;
  },

  async login(email, password) {
    const res = await api.post('/auth/login', {
      email,
      password,
    });
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

