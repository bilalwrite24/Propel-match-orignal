import React from 'react';
import { Target, Search, Plus, Sparkles, Upload, FileDown } from 'lucide-react';
import { IcpCampaign } from '../types';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  campaigns: IcpCampaign[];
  activeCampaign: IcpCampaign;
  onSelectCampaign: (id: string) => void;
  onNavigate: (tab: NavTab) => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  campaigns,
  activeCampaign,
  onSelectCampaign,
  onNavigate,
  onExportCsv,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Lead Pipeline',
      subtitle: 'Real-time overview of discovered, qualified, and prioritized B2B leads.',
    },
    discovery: {
      title: 'AI Web Lead Discovery',
      subtitle: 'Google Search grounded agent for discovering real enterprise accounts & decision makers.',
    },
    csv_import: {
      title: 'High-Volume CSV Import',
      subtitle: 'Batch import, deduplicate, and qualify thousands of contacts with deterministic ICP scoring.',
    },
    leads: {
      title: 'Verified Leads Database',
      subtitle: 'Search, filter, view explainable scoring breakdowns, and inspect grounding evidence.',
    },
    campaigns: {
      title: 'ICP Campaign Builder',
      subtitle: 'Define qualification criteria, mandatory exclusion rules, and custom scoring weights.',
    },
    outreach: {
      title: 'Personalized Outreach Generator',
      subtitle: 'Create evidence-backed LinkedIn connection notes, follow-ups, and cold email sequences.',
    },
    marketing: {
      title: 'Exact ICP Marketing Studio',
      subtitle: 'Positioning copy, value propositions, LinkedIn ads, cold hooks, and objection handlers tailored to your ICP.',
    },
    copilot: {
      title: 'AI Lead & ICP Copilot',
      subtitle: 'Live strategic assistant grounded in your active pipeline, qualification metrics, and target accounts.',
    },
    activity: {
      title: 'Activity & Audit Log',
      subtitle: 'Complete history of search discoveries, CSV imports, scoring runs, and exports.',
    },
    settings: {
      title: 'System Settings & Status',
      subtitle: 'API integration health, persistence management, and system architecture details.',
    },
  };

  const currentMeta = titles[currentTab] || {
    title: 'PropelMatch AI Lead Finder',
    subtitle: 'B2B lead intelligence and qualification agent',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg font-bold text-slate-900 leading-tight">{currentMeta.title}</h2>
        <p className="text-xs text-slate-500">{currentMeta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Campaign Switcher Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
          <Target className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-medium text-slate-500">Campaign:</span>
          <select
            value={activeCampaign.id}
            onChange={(e) => onSelectCampaign(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer pr-1"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Actions */}
        <button
          onClick={() => onNavigate('discovery')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New AI Search</span>
        </button>

        <button
          onClick={() => onNavigate('csv_import')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import CSV</span>
        </button>

        <button
          onClick={onExportCsv}
          title="Export Qualified Leads to CSV"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          aria-label="Export Leads CSV"
        >
          <FileDown className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
