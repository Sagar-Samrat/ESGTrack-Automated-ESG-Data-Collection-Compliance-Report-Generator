import api from './api';

export const uploadService = {
  async uploadFile(file, department, reportingYear, autoProcess = true) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', department);
    formData.append('reporting_year', String(reportingYear));
    formData.append('auto_process', autoProcess ? 'true' : 'false');

    const res = await api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async uploadFilesBatch(filesWithMeta, autoProcess = true) {
    const formData = new FormData();
    filesWithMeta.forEach((item) => {
      formData.append('files', item.file);
      formData.append('departments', item.department);
      formData.append('reporting_years', String(item.reportingYear));
    });
    formData.append('auto_process', autoProcess ? 'true' : 'false');

    const res = await api.post('/uploads/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getUploads(department = null, reportingYear = null) {
    const params = {};
    if (department && department !== 'All') params.department = department;
    if (reportingYear) params.reporting_year = reportingYear;
    const res = await api.get('/uploads', { params });
    return res.data;
  },

  async getUploadById(uploadId) {
    const res = await api.get(`/uploads/${uploadId}`);
    return res.data;
  },

  async getPreview(uploadId) {
    const res = await api.post(`/uploads/${uploadId}/preview`);
    return res.data;
  },

  async validateUpload(uploadId) {
    const res = await api.post(`/cleaning/validate/${uploadId}`);
    return res.data;
  },

  async applyFixes(uploadId, fixes) {
    const res = await api.post(`/cleaning/apply-fixes/${uploadId}`, fixes);
    return res.data;
  },

  async deleteUpload(uploadId) {
    const res = await api.delete(`/uploads/${uploadId}`);
    return res.data;
  },
};
