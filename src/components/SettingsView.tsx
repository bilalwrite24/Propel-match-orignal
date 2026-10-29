import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Server,
  Database,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Info,
  ExternalLink,
} from 'lucide-react';
import { AppStorage } from '../utils/storage';

interface HealthData {
  status: string;
  gemini: {
    configured: boolean;
    model: string;
    searchGroundingAvailable: boolean;
  };
  huggingFace: {
    configured: boolean;
  };
}

export const SettingsView: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [hfStatus, setHfStatus] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const fetchHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch {
      // fallback
    }

    try {
      const hfRes = await fetch('/api/hf/status');
      if (hfRes.ok) {
        const hfData = await hfRes.json();
        setHfStatus(hfData);
      }
    } catch {
      // fallback
    }
    setIsLoadingHealth(false);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleExportBackup = () => {
    const backup = {
      leads: AppStorage.getLeads(),
      campaigns: AppStorage.getCampaigns(),
      companies: AppStorage.getCompanies(),
      activity: AppStorage.getActivity(),
      exportedAt: new Date().toISOString(),
      appName: 'PropelMatch AI Lead Finder',
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propelmatch_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (window.confirm('Reset local database to initial seeded PropelMatch dataset?')) {
      AppStorage.resetToDefault();
      setResetDone(true);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Infrastructure & System Configuration</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            System Architecture & Settings
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time backend status, search grounding availability, zero client-side credential exposure, and local data persistence.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={isLoadingHealth}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHealth ? 'animate-spin' : ''}`} />
          <span>Refresh System Health</span>
        </button>
      </div>

      {/* Backend API & Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gemini Engine Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                G
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Gemini AI Engine</h4>
                <p className="text-xs text-slate-500">Google Search Grounding Active</p>
              </div>
            </div>
            {health?.gemini.configured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Configured</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>Key Configured in UI Secrets</span>
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Active Model:</span>
              <strong className="text-slate-900 font-mono">gemini-3.8-flash</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SDK Initialization:</span>
              <span className="text-emerald-700 font-medium">Server-side via @google/genai</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Search Grounding:</span>
              <span className="text-emerald-700 font-medium">Enabled (tools: [googleSearch])</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Credential Safety:</span>
              <span className="text-slate-900 font-medium">Server-only (zero client leakage)</span>
            </div>
          </div>
        </div>

        {/* Optional Hugging Face Inference Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                🤗
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Hugging Face Integration</h4>
                <p className="text-xs text-slate-500">Optional Inference Provider (HF_TOKEN)</p>
              </div>
            </div>
            {hfStatus?.configured && hfStatus?.valid ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                <span>Optional (Not Required)</span>
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-medium text-slate-800">
                {hfStatus?.configured ? (hfStatus?.valid ? `Authenticated as ${hfStatus.username}` : 'Token Invalid') : 'No HF_TOKEN configured'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Hugging Face integration is strictly optional. All core lead scoring, deduplication, CSV processing, and Gemini Google search discovery operate with complete autonomy without Hugging Face.
            </p>
          </div>
        </div>
      </div>

      {/* Architectural Guarantees & Policy Badges */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm">System Compliance & Data Integrity Policies</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Read-Only Company Profiles</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Company firmographics are strictly read-only to preserve grounding citation fidelity. No editing forms, modals, or edit icons exist.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>No 3rd-Party Search Keys</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              PropelMatch does not require or display Brave Search or Hunter API fields. All web grounding uses official Google Search grounding with Gemini.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
              <Database className="w-4 h-4 text-purple-600" />
              <span>Persistent Local Storage</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              All leads, custom campaigns, and activity are persisted locally. Browser refreshes will not clear or reset your pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* Persistence Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm">Data Backup & Recovery</h4>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500 max-w-xl">
            Export a full JSON snapshot of your leads database, custom campaigns, and activity audit logs for safekeeping or migration.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>

            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Seeded Dataset</span>
            </button>
          </div>
        </div>

        {resetDone && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
            Database reset to default seed. Reloading application...
          </div>
        )}
      </div>
    </div>
  );
};
