import api from './api';

export const metricsService = {
  async getDashboardSummary(reportingYear = 2024) {
    const res = await api.get('/metrics', { params: { reporting_year: reportingYear } });
    return res.data;
  },

  async getEnvironmental(reportingYear = 2024) {
    const res = await api.get('/metrics/environmental', { params: { reporting_year: reportingYear } });
    return res.data;
  },

  async getSocial(reportingYear = 2024) {
    const res = await api.get('/metrics/social', { params: { reporting_year: reportingYear } });
    return res.data;
  },

  async getGovernance(reportingYear = 2024) {
    const res = await api.get('/metrics/governance', { params: { reporting_year: reportingYear } });
    return res.data;
  },

  async getYoY(reportingYear = 2024) {
    const res = await api.get('/metrics/yoy', { params: { reporting_year: reportingYear } });
    return res.data;
  },
};
