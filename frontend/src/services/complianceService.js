import api from './api';

export const complianceService = {
  async getChecklists(framework = null) {
    const params = {};
    if (framework && framework !== 'All') params.framework = framework;
    const res = await api.get('/compliance/checklists', { params });
    return res.data;
  },

  async getGapReport(framework = 'GRI Standards') {
    const res = await api.get('/compliance/gap-report', { params: { framework } });
    return res.data;
  },

  async updateDisclosureStatus(disclosureId, updateData) {
    const res = await api.put(`/compliance/disclosures/${disclosureId}/status`, updateData);
    return res.data;
  },

  async attachEvidence(disclosureId, documentName, documentType = 'Policy/Audit Report', notes = '') {
    const res = await api.post(`/compliance/evidence?disclosure_id=${disclosureId}`, {
      document_name: documentName,
      document_type: documentType,
      notes,
    });
    return res.data;
  },
};
