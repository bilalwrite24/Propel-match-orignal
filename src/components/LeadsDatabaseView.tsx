import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Send,
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  XCircle,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { Lead, IcpCampaign, QualificationTier } from '../types';
import { exportLeadsToCsv } from '../utils/csvParser';
import { evaluateLeadScore } from '../utils/scoring';
import { NavTab } from './Sidebar';

interface LeadsDatabaseViewProps {
  leads: Lead[];
  activeCampaign: IcpCampaign;
  onUpdateLeads: (updatedLeads: Lead[]) => void;
  onSelectLeadForOutreach: (lead: Lead) => void;
  onViewCompanyProfile: (companyName: string) => void;
  onViewScoreBreakdown: (lead: Lead) => void;
  onNavigate: (tab: NavTab) => void;
}

export const LeadsDatabaseView: React.FC<LeadsDatabaseViewProps> = ({
  leads,
  activeCampaign,
  onUpdateLeads,
  onSelectLeadForOutreach,
  onViewCompanyProfile,
  onViewScoreBreakdown,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'company' | 'date'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Distinct industries for filter dropdown
  const uniqueIndustries = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.industry) set.add(l.industry);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Filtering
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.fullName?.toLowerCase().includes(q);
        const matchTitle = lead.jobTitle?.toLowerCase().includes(q);
        const matchCompany = lead.companyName?.toLowerCase().includes(q);
        const matchTech = (lead.technologies || []).some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchTitle && !matchCompany && !matchTech) {
          return false;
        }
      }

      // Tier
      if (tierFilter !== 'all') {
        if (lead.scoreBreakdown?.tier !== tierFilter) return false;
      }

      // Industry
      if (industryFilter !== 'all') {
        if (lead.industry !== industryFilter) return false;
      }

      // Source
      if (sourceFilter !== 'all') {
        if (lead.source !== sourceFilter) return false;
      }

      return true;
    });
  }, [leads, searchQuery, tierFilter, industryFilter, sourceFilter]);

  // Sorting
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'score') {
        comp = (a.qualificationScore || 0) - (b.qualificationScore || 0);
      } else if (sortBy === 'name') {
        comp = (a.fullName || '').localeCompare(b.fullName || '');
      } else if (sortBy === 'company') {
        comp = (a.companyName || '').localeCompare(b.companyName || '');
      } else if (sortBy === 'date') {
        comp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return sortOrder === 'desc' ? -comp : comp;
    });
  }, [filteredLeads, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  // Bulk selection helpers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedLeads.length && paginatedLeads.length > 0) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(selectedIds);
      paginatedLeads.forEach((l) => newSet.add(l.id));
      setSelectedIds(newSet);
    }
  };

  const handleToggleSelectLead = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAllQualified = () => {
    const qualifiedIds = new Set(
      leads.filter((l) => l.scoreBreakdown?.tier === 'Qualified for Review').map((l) => l.id)
    );
    setSelectedIds(qualifiedIds);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const remaining = leads.filter((l) => !selectedIds.has(l.id));
    onUpdateLeads(remaining);
    setSelectedIds(new Set());
  };

  const handleRecalculateScores = () => {
    const rescored = leads.map((lead) => {
      const breakdown = evaluateLeadScore(lead, activeCampaign);
      return {
        ...lead,
        qualificationScore: breakdown.totalScore,
        scoreBreakdown: breakdown,
      };
    });
    onUpdateLeads(rescored);
  };

  const handleExportSelected = () => {
    const toExport = leads.filter((l) => selectedIds.has(l.id));
    if (toExport.length === 0) {
      exportLeadsToCsv(filteredLeads, 'propelmatch_leads_export.csv');
    } else {
      exportLeadsToCsv(toExport, `propelmatch_selected_${toExport.length}_leads.csv`);
    }
  };

  const getTierBadge = (tier?: QualificationTier) => {
    switch (tier) {
      case 'Qualified for Review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Qualified</span>
          </span>
        );
      case 'Review Required':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Review Req.</span>
          </span>
        );
      case 'Excluded by Rule':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Excluded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            <span>Low Priority</span>
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Controls & Filtering Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search leads by name, role, company, or tech stack..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRecalculateScores}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              title="Rescore all leads against the active campaign criteria"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Rescore against Active ICP</span>
            </button>

            <button
              onClick={handleExportSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : 'Export Filtered CSV'}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Quick Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              <option value="all">All Qualification Tiers</option>
              <option value="Qualified for Review">Qualified for Review (80-100)</option>
              <option value="Review Required">Review Required (60-79)</option>
              <option value="Low Priority">Low Priority (&lt;60)</option>
              <option value="Excluded by Rule">Excluded by Rule</option>
            </select>

            {/* Industry Filter */}
            <select
              value={industryFilter}
              onChange={(e) => {
                setIndustryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none max-w-xs"
            >
              <option value="all">All Industries ({uniqueIndustries.length})</option>
              {uniqueIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              <option value="all">All Sources</option>
              <option value="web_discovery">Web Discovery (Google Grounded)</option>
              <option value="csv_import">CSV Import</option>
            </select>
          </div>

          {/* Quick Selection Helpers */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllQualified}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Select All Qualified
            </button>
            {selectedIds.size > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleDeleteSelected}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete ({selectedIds.size})</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedLeads.length > 0 &&
                      paginatedLeads.every((l) => selectedIds.has(l.id))
                    }
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Industry & Size</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Evidence Citations</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 space-y-3">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-medium text-slate-700">No leads match the selected criteria.</p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => onNavigate('discovery')}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
                      >
                        Run Web Discovery
                      </button>
                      <button
                        onClick={() => onNavigate('csv_import')}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                      >
                        Upload CSV File
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);
                  const isExcluded = lead.scoreBreakdown?.isExcluded;

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectLead(lead.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{lead.fullName}</div>
                        <div className="text-slate-500 text-[11px]">{lead.jobTitle}</div>
                        {lead.email ? (
                          <div className="text-slate-400 text-[10px] mt-0.5 truncate max-w-[180px]">
                            {lead.email}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[10px] italic">Email unavailable</div>
                        )}
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onViewCompanyProfile(lead.companyName)}
                          className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 text-left"
                          title="View Read-Only Company Firmographics"
                        >
                          <span>{lead.companyName}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        </button>
                        <div className="text-slate-400 text-[11px] truncate max-w-[160px]">
                          {lead.companyDomain || lead.location || 'Location verified'}
                        </div>
                      </td>

                      {/* Industry & Size */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{lead.industry}</div>
                        <div className="text-slate-400 text-[11px]">
                          {lead.companySize || (lead.employeeCount ? `${lead.employeeCount} staff` : 'Unspecified')}
                        </div>
                      </td>

                      {/* Score Badge (Click to open Explainable Breakdown) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onViewScoreBreakdown(lead)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                            isExcluded
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : lead.qualificationScore >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : lead.qualificationScore >= 60
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title="View explainable weighted criteria breakdown"
                        >
                          <span>{lead.qualificationScore}</span>
                          <span className="text-[10px] font-normal opacity-70">/100</span>
                        </button>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-4">{getTierBadge(lead.scoreBreakdown?.tier)}</td>

                      {/* Evidence Sources */}
                      <td className="py-3.5 px-4">
                        {lead.sourceUrls && lead.sourceUrls.length > 0 ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-700">
                              <ShieldCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                              <strong className="text-indigo-600 font-semibold">{lead.sourceUrls.length} sources</strong>
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {lead.sourceUrls[0]?.title || 'Grounded citation'}
                            </div>
                          </div>
                        ) : lead.source === 'csv_import' ? (
                          <span className="text-[11px] text-slate-500">CSV Import record</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No web links</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectLeadForOutreach(lead)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs border border-indigo-200 transition-colors"
                            title="Generate personalized LinkedIn & Email outreach"
                          >
                            <Send className="w-3 h-3" />
                            <span>Outreach</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Counts */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-900">{paginatedLeads.length}</strong> of{' '}
            <strong className="text-slate-900">{filteredLeads.length}</strong> filtered leads (Total database: {leads.length})
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
