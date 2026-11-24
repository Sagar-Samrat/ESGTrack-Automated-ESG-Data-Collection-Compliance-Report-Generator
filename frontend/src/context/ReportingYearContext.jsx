import React, { createContext, useContext, useState } from 'react';

const ReportingYearContext = createContext(null);

export const AVAILABLE_YEARS = [2026, 2025, 2024, 2023, 2022];

export const ReportingYearProvider = ({ children }) => {
  const [reportingYear, setReportingYear] = useState(2024);

  return (
    <ReportingYearContext.Provider value={{ reportingYear, setReportingYear, availableYears: AVAILABLE_YEARS }}>
      {children}
    </ReportingYearContext.Provider>
  );
};

export const useReportingYear = () => {
  const context = useContext(ReportingYearContext);
  if (!context) {
    throw new Error('useReportingYear must be used within a ReportingYearProvider');
  }
  return context;
};

