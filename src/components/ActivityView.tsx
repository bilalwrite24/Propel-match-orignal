import React, { useState } from 'react';
import {
  History,
  Search,
  FileSpreadsheet,
  Target,
  Send,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityViewProps {
  activities: ActivityLog[];
  onClearActivity: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  onClearActivity,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = activities.filter((act) => {
    if (filterType === 'all') return true;
    return act.type === filterType;
  });

  const getIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'search_discovery':
        return <Search className="w-4 h-4 text-indigo-600" />;
      case 'csv_import':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'qualification':
        return <Target className="w-4 h-4 text-purple-600" />;
      case 'outreach_generated':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'csv_export':
        return <Download className="w-4 h-4 text-slate-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail & Operations Log</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Activity and Search History
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Immutable log of web discoveries, CSV qualification batches, campaign modifications, and outreach draft generations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="search_discovery">AI Search Discoveries</option>
            <option value="csv_import">CSV Imports</option>
            <option value="qualification">Scoring Runs</option>
            <option value="outreach_generated">Outreach Generations</option>
            <option value="csv_export">CSV Exports</option>
          </select>

          <button
            onClick={onClearActivity}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:text-rose-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No activity logs recorded yet.
            </div>
          ) : (
            filtered.map((act) => (
              <div key={act.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-3.5 text-xs">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(act.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{act.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
