import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, X, HelpCircle } from 'lucide-react';

export default function ColumnMapperModal({ isOpen, onClose, previewData, onConfirmMapping }) {
  const [mappings, setMappings] = useState({});

  useEffect(() => {
    setMappings(previewData?.suggested_mappings || {});
  }, [previewData, isOpen]);

  if (!isOpen || !previewData) return null;

  const department = previewData.department || 'Environmental';
  const columns = previewData.columns || [];

  const handleMappingChange = (originalCol, targetField) => {
    setMappings((prev) => ({
      ...prev,
      [originalCol]: targetField,
    }));
  };

  const handleConfirm = () => {
    onConfirmMapping(mappings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Standardize ESG Column Mapping</h3>
            <p className="text-xs text-slate-500">
              Department: <span className="font-semibold text-emerald-800">{department}</span> | Verify header bindings
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mappings Table */}
        <div className="p-6 max-h-96 overflow-y-auto space-y-3">
          <div className="grid grid-cols-12 gap-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <span className="col-span-5">Uploaded Column Header</span>
            <span className="col-span-2 text-center">Binding</span>
            <span className="col-span-5">Target ESG Standard Field</span>
          </div>

          {columns.map((col) => {
            const currentTarget = mappings[col] || col;
            return (
              <div
                key={col}
                className="grid grid-cols-12 gap-3 items-center p-2 rounded-lg bg-slate-50/60 border border-slate-100 hover:border-slate-200"
              >
                <div className="col-span-5 font-mono text-xs text-slate-800 truncate" title={col}>
                  {col}
                </div>

                <div className="col-span-2 flex justify-center text-slate-400">
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="col-span-5">
                  <input
                    type="text"
                    value={currentTarget}
                    onChange={(e) => handleMappingChange(col, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Standard Field Name"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Mappings are remembered for future department uploads.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Mappings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

