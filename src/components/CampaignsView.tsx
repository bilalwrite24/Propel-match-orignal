import React, { useState } from 'react';
import {
  Target,
  Plus,
  Check,
  ShieldCheck,
  XCircle,
  Sliders,
  Sparkles,
  RefreshCw,
  Edit2,
  Trash2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { IcpCampaign, IcpScoringWeights, Lead } from '../types';
import { DEFAULT_PROPELMATCH_CAMPAIGN } from '../utils/storage';
import { evaluateLeadScore, normalizeWeights } from '../utils/scoring';

interface CampaignsViewProps {
  campaigns: IcpCampaign[];
  activeCampaign: IcpCampaign;
  leads: Lead[];
  onSaveCampaigns: (campaigns: IcpCampaign[]) => void;
  onSetActiveCampaign: (id: string) => void;
  onUpdateLeads: (leads: Lead[]) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  activeCampaign,
  leads,
  onSaveCampaigns,
  onSetActiveCampaign,
  onUpdateLeads,
}) => {
  const [editingCampaign, setEditingCampaign] = useState<IcpCampaign>(activeCampaign);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tagInputs, setTagInputs] = useState({
    industry: '',
    title: '',
    tech: '',
    excludedIndustry: '',
    excludedRole: '',
  });

  const weightsSum =
    Number(editingCampaign.weights.companyFit) +
    Number(editingCampaign.weights.titleSeniority) +
    Number(editingCampaign.weights.industryFit) +
    Number(editingCampaign.weights.evidenceQuality) +
    Number(editingCampaign.weights.geographyFit);

  const handleWeightChange = (key: keyof IcpScoringWeights, value: number) => {
    setEditingCampaign((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: Math.max(0, Math.min(100, value)),
      },
    }));
  };

  const handleAddTag = (field: 'targetIndustries' | 'targetJobTitles' | 'requiredTechnologies' | 'excludedIndustries' | 'excludedRoles', inputKey: keyof typeof tagInputs) => {
    const val = tagInputs[inputKey].trim();
    if (!val) return;
    if (!editingCampaign[field].includes(val)) {
      setEditingCampaign((prev) => ({
        ...prev,
        [field]: [...prev[field], val],
      }));
    }
    setTagInputs((prev) => ({ ...prev, [inputKey]: '' }));
  };

  const handleRemoveTag = (field: 'targetIndustries' | 'targetJobTitles' | 'requiredTechnologies' | 'excludedIndustries' | 'excludedRoles', index: number) => {
    setEditingCampaign((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSaveCampaign = () => {
    let updatedList: IcpCampaign[];
    if (isCreatingNew) {
      const newCampaign: IcpCampaign = {
        ...editingCampaign,
        id: `campaign_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      updatedList = [...campaigns, newCampaign];
      onSaveCampaigns(updatedList);
      onSetActiveCampaign(newCampaign.id);
      setIsCreatingNew(false);
    } else {
      updatedList = campaigns.map((c) =>
        c.id === editingCampaign.id ? editingCampaign : c
      );
      onSaveCampaigns(updatedList);
      if (editingCampaign.id === activeCampaign.id) {
        // Rescore existing leads against the new campaign weights & criteria
        const rescored = leads.map((lead) => {
          const breakdown = evaluateLeadScore(lead, editingCampaign);
          return {
            ...lead,
            qualificationScore: breakdown.totalScore,
            scoreBreakdown: breakdown,
          };
        });
        onUpdateLeads(rescored);
      }
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleStartCreateNew = () => {
    setEditingCampaign({
      id: `campaign_${Date.now()}`,
      name: 'New Custom ICP Campaign',
      description: 'Custom B2B target profile and deterministic qualification rules.',
      targetIndustries: ['Software & SaaS'],
      targetJobTitles: ['VP of Technology', 'Head of IT'],
      targetSeniorities: ['VP', 'Director'],
      minEmployees: 100,
      targetGeographies: ['United States', 'Canada'],
      requiredTechnologies: ['Cloud'],
      excludedIndustries: ['Retail'],
      excludedRoles: ['Student', 'Intern'],
      requiredCompanyCharacteristics: ['B2B Business Model'],
      campaignInstructions: 'Focus on infrastructure ROI and team operational scaling.',
      weights: {
        companyFit: 25,
        titleSeniority: 30,
        industryFit: 20,
        evidenceQuality: 15,
        geographyFit: 10,
      },
      isActive: false,
      createdAt: new Date().toISOString(),
    });
    setIsCreatingNew(true);
  };

  const handleSwitchCampaign = (camp: IcpCampaign) => {
    setEditingCampaign(camp);
    setIsCreatingNew(false);
    onSetActiveCampaign(camp.id);

    // Rescore leads against the newly active campaign
    const rescored = leads.map((lead) => {
      const breakdown = evaluateLeadScore(lead, camp);
      return {
        ...lead,
        qualificationScore: breakdown.totalScore,
        scoreBreakdown: breakdown,
      };
    });
    onUpdateLeads(rescored);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Target className="w-3.5 h-3.5" />
            <span>Multi-Campaign Qualification Engine</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            ICP Campaigns & Scoring Criteria
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure target industries, roles, headcount thresholds, and mandatory exclusion rules. Leads are dynamically scored from 0–100 against active weights.
          </p>
        </div>

        <button
          onClick={handleStartCreateNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Campaign</span>
        </button>
      </div>

      {/* Campaigns Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaigns.map((camp) => {
          const isActive = camp.id === activeCampaign.id;
          return (
            <div
              key={camp.id}
              onClick={() => handleSwitchCampaign(camp)}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 truncate pr-2">{camp.name}</span>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0">
                    <Check className="w-2.5 h-2.5" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">Click to activate</span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                {camp.description}
              </p>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div>
                  <strong className="text-slate-800">Threshold:</strong> Min {camp.minEmployees}+ staff
                </div>
                <div>
                  <strong className="text-slate-800">Key Roles:</strong> {camp.targetJobTitles.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaign Form & Weight Configurator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h4 className="font-bold text-slate-900 text-base">
              {isCreatingNew ? 'Create New Campaign Profile' : `Editing: ${editingCampaign.name}`}
            </h4>
            <p className="text-xs text-slate-500">
              Changes take effect immediately and dynamically update the 0–100 lead qualification scores.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                <Check className="w-3.5 h-3.5" />
                <span>Saved & Rescored!</span>
              </span>
            )}
            <button
              onClick={handleSaveCampaign}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Save Campaign Rules
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Name</label>
            <input
              type="text"
              value={editingCampaign.name}
              onChange={(e) => setEditingCampaign((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Company Size (Headcount)</label>
            <input
              type="number"
              min={1}
              value={editingCampaign.minEmployees}
              onChange={(e) =>
                setEditingCampaign((prev) => ({ ...prev, minEmployees: Number(e.target.value) || 1 }))
              }
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Goal / Description</label>
            <input
              type="text"
              value={editingCampaign.description}
              onChange={(e) =>
                setEditingCampaign((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Target Industries */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Target Industries & Verticals
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {editingCampaign.targetIndustries.map((ind, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-indigo-50 text-indigo-700 border border-indigo-200"
              >
                <span>{ind}</span>
                <button
                  onClick={() => handleRemoveTag('targetIndustries', i)}
                  className="text-indigo-400 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={tagInputs.industry}
              onChange={(e) => setTagInputs((prev) => ({ ...prev, industry: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('targetIndustries', 'industry'))}
              placeholder="Add industry (e.g. Fintech, MedTech)..."
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg flex-1 outline-none"
            />
            <button
              onClick={() => handleAddTag('targetIndustries', 'industry')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Target Roles */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Target Job Titles (Decision Makers)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {editingCampaign.targetJobTitles.map((title, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <span>{title}</span>
                <button
                  onClick={() => handleRemoveTag('targetJobTitles', i)}
                  className="text-emerald-400 hover:text-emerald-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={tagInputs.title}
              onChange={(e) => setTagInputs((prev) => ({ ...prev, title: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('targetJobTitles', 'title'))}
              placeholder="Add title (e.g. Chief Information Officer, CTO)..."
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg flex-1 outline-none"
            />
            <button
              onClick={() => handleAddTag('targetJobTitles', 'title')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Mandatory Exclusions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-rose-50/40 border border-rose-200">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <label className="text-xs font-bold text-rose-900">
                Excluded Industries (Mandatory Override)
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editingCampaign.excludedIndustries.map((ind, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-800"
                >
                  <span>{ind}</span>
                  <button onClick={() => handleRemoveTag('excludedIndustries', i)}>×</button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInputs.excludedIndustry}
                onChange={(e) => setTagInputs((prev) => ({ ...prev, excludedIndustry: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('excludedIndustries', 'excludedIndustry'))}
                placeholder="e.g. Retail, Hospitality..."
                className="text-xs px-3 py-1.5 bg-white border border-rose-300 rounded-lg flex-1 outline-none"
              />
              <button
                onClick={() => handleAddTag('excludedIndustries', 'excludedIndustry')}
                className="px-3 py-1.5 bg-rose-200 text-rose-900 text-xs font-semibold rounded-lg"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <label className="text-xs font-bold text-rose-900">
                Excluded Roles / Keywords (Mandatory Override)
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editingCampaign.excludedRoles.map((role, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-800"
                >
                  <span>{role}</span>
                  <button onClick={() => handleRemoveTag('excludedRoles', i)}>×</button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInputs.excludedRole}
                onChange={(e) => setTagInputs((prev) => ({ ...prev, excludedRole: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('excludedRoles', 'excludedRole'))}
                placeholder="e.g. Consultant, Intern, Freelancer..."
                className="text-xs px-3 py-1.5 bg-white border border-rose-300 rounded-lg flex-1 outline-none"
              />
              <button
                onClick={() => handleAddTag('excludedRoles', 'excludedRole')}
                className="px-3 py-1.5 bg-rose-200 text-rose-900 text-xs font-semibold rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Scoring Weights Configurator */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h5 className="font-bold text-slate-900 text-sm">Configurable Scoring Weights (Total: 100)</h5>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                weightsSum === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              Current Sum: {weightsSum} / 100 pts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company Fit ({editingCampaign.weights.companyFit} pts)</label>
              <input
                type="range"
                min={0}
                max={50}
                value={editingCampaign.weights.companyFit}
                onChange={(e) => handleWeightChange('companyFit', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Role & Seniority ({editingCampaign.weights.titleSeniority} pts)</label>
              <input
                type="range"
                min={0}
                max={50}
                value={editingCampaign.weights.titleSeniority}
                onChange={(e) => handleWeightChange('titleSeniority', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Industry Fit ({editingCampaign.weights.industryFit} pts)</label>
              <input
                type="range"
                min={0}
                max={50}
                value={editingCampaign.weights.industryFit}
                onChange={(e) => handleWeightChange('industryFit', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Evidence Citations ({editingCampaign.weights.evidenceQuality} pts)</label>
              <input
                type="range"
                min={0}
                max={50}
                value={editingCampaign.weights.evidenceQuality}
                onChange={(e) => handleWeightChange('evidenceQuality', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Geography Fit ({editingCampaign.weights.geographyFit} pts)</label>
              <input
                type="range"
                min={0}
                max={50}
                value={editingCampaign.weights.geographyFit}
                onChange={(e) => handleWeightChange('geographyFit', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
