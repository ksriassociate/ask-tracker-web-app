import React, { useState } from 'react';

export default function TemplateSettings({ globalVault, setGlobalVault }) {
  const [selectedForm, setSelectedForm] = useState("ADT-1");
  const [successMessage, setSuccessMessage] = useState("");

  const handleUpdateTemplate = (docKey, value) => {
    setGlobalVault(prev => ({
      ...prev,
      [selectedForm]: {
        ...prev[selectedForm],
        [docKey]: value
      }
    }));
  };

  const saveVaultToSystem = () => {
    setSuccessMessage("Global Firm Templates Saved Successfully!");
    setTimeout(() => setSuccessMessage(""), 2500);
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-900/60">
            ⚙️ Template Management Vault
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-tight">Configure Global Legal Blueprints</h1>
        </div>
        <button 
          onClick={saveVaultToSystem}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md"
        >
          Save Changes
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-400 text-xs rounded-lg font-bold uppercase tracking-wider">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Form Types</h3>
          <div className="space-y-1">
            {Object.keys(globalVault).map((formCode) => (
              <button
                key={formCode}
                onClick={() => setSelectedForm(formCode)}
                className={`w-full text-left p-3 rounded-lg text-xs font-bold transition-all uppercase flex justify-between items-center ${selectedForm === formCode ? "bg-blue-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-850"}`}
              >
                <span>📂 {formCode} Folder</span>
                <span className="text-[10px] bg-slate-900/50 px-2 py-0.5 rounded text-slate-300">
                  {Object.keys(globalVault[formCode]).length} templates
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-200 uppercase">Editing Blueprints for: {selectedForm}</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Active system tags allowed: {"{{companyName}}"}, {"{{auditorName}}"}, {"{{effectiveDate}}"}, {"{{auditorFirmPAN}}"}, {"{{tenureYears}}"}, {"{{financialYear}}"}
            </p>
          </div>

          <div className="space-y-4">
            {Object.keys(globalVault[selectedForm]).map((docKey) => (
              <div key={docKey} className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  📜 {docKey.replace(/([A-Z])/g, ' $1')} Wording Blueprint
                </label>
                <textarea
                  value={globalVault[selectedForm][docKey]}
                  onChange={(e) => handleUpdateTemplate(docKey, e.target.value)}
                  className="w-full h-32 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-600 leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}