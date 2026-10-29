import React from 'react';
import {
  LayoutDashboard,
  Compass,
  FileSpreadsheet,
  Database,
  Target,
  Send,
  Megaphone,
  Bot,
  History,
  Settings,
  ShieldCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { IcpCampaign } from '../types';

export type NavTab =
  | 'dashboard'
  | 'discovery'
  | 'csv_import'
  | 'leads'
  | 'campaigns'
  | 'outreach'
  | 'marketing'
  | 'copilot'
  | 'activity'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeCampaign: IcpCampaign;
  totalLeadsCount: number;
  qualifiedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeCampaign,
  totalLeadsCount,
  qualifiedCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'discovery', label: 'AI Lead Discovery', icon: <Compass className="w-5 h-5" /> },
    { id: 'csv_import', label: 'CSV Lead Import', icon: <FileSpreadsheet className="w-5 h-5" /> },
    {
      id: 'leads',
      label: 'Leads Database',
      icon: <Database className="w-5 h-5" />,
      badge: totalLeadsCount,
    },
    { id: 'campaigns', label: 'ICP Campaigns', icon: <Target className="w-5 h-5" /> },
    { id: 'outreach', label: 'Outreach Generator', icon: <Send className="w-5 h-5" /> },
    { id: 'marketing', label: 'Marketing Studio', icon: <Megaphone className="w-5 h-5" /> },
    { id: 'copilot', label: 'AI Copilot Chat', icon: <Bot className="w-5 h-5" /> },
    { id: 'activity', label: 'Activity & History', icon: <History className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none shrink-0 text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold text-lg">
            P
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">
              PropelMatch
            </h1>
            <p className="text-xs text-indigo-400 font-medium mt-1">AI Lead Finder</p>
          </div>
        </div>

        {/* Active Campaign Indicator */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active ICP</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-xs font-medium text-white truncate" title={activeCampaign.name}>
            {activeCampaign.name}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Min {activeCampaign.minEmployees}+ staff • {activeCampaign.targetSeniorities.slice(0, 2).join(', ')}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Metrics */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400">Qualified Leads</span>
          <span className="text-emerald-400 font-semibold">{qualifiedCount} leads</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{
              width: `${totalLeadsCount > 0 ? Math.min(100, Math.round((qualifiedCount / totalLeadsCount) * 100)) : 0}%`,
            }}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Google Search Grounded</span>
        </div>
      </div>
    </aside>
  );
};
