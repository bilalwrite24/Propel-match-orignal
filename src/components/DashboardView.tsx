import React from 'react';
import {
  Users,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Building2,
  Sparkles,
  Upload,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Lead, IcpCampaign, CompanyProfile } from '../types';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  leads: Lead[];
  companies: CompanyProfile[];
  activeCampaign: IcpCampaign;
  onNavigate: (tab: NavTab) => void;
  onSelectLeadForOutreach: (lead: Lead) => void;
  onViewCompanyProfile: (companyName: string) => void;
  onViewScoreBreakdown: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  companies,
  activeCampaign,
  onNavigate,
  onSelectLeadForOutreach,
  onViewCompanyProfile,
  onViewScoreBreakdown,
}) => {
  const totalCount = leads.length;
  const qualifiedCount = leads.filter((l) => l.scoreBreakdown?.tier === 'Qualified for Review').length;
  const reviewRequiredCount = leads.filter((l) => l.scoreBreakdown?.tier === 'Review Required').length;
  const lowPriorityCount = leads.filter((l) => l.scoreBreakdown?.tier === 'Low Priority').length;
  const excludedCount = leads.filter((l) => l.scoreBreakdown?.tier === 'Excluded by Rule').length;

  const qualifiedPercentage = totalCount > 0 ? Math.round((qualifiedCount / totalCount) * 100) : 0;
  const reviewPercentage = totalCount > 0 ? Math.round((reviewRequiredCount / totalCount) * 100) : 0;
  const lowPriorityPercentage = totalCount > 0 ? Math.round((lowPriorityCount / totalCount) * 100) : 0;
  const excludedPercentage = totalCount > 0 ? Math.round((excludedCount / totalCount) * 100) : 0;

  const topQualifiedLeads = leads
    .filter((l) => !l.scoreBreakdown?.isExcluded)
    .sort((a, b) => (b.qualificationScore || 0) - (a.qualificationScore || 0))
    .slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic AI Qualification Engine</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Targeting: {activeCampaign.name}
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {activeCampaign.description} Minimum employee threshold: <span className="font-semibold text-white">{activeCampaign.minEmployees}+ staff</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('discovery')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover Accounts</span>
          </button>
          <button
            onClick={() => onNavigate('csv_import')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-medium text-xs hover:bg-slate-700 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Leads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          <p className="text-xs text-slate-500 mt-1">Across all campaigns</p>
        </div>

        {/* Qualified for Review (80-100) */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Qualified (80-100)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{qualifiedCount}</div>
          <p className="text-xs text-emerald-700 mt-1">{qualifiedPercentage}% of total database</p>
        </div>

        {/* Review Required (60-79) */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Review Req. (60-79)</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{reviewRequiredCount}</div>
          <p className="text-xs text-amber-700 mt-1">{reviewPercentage}% partial match</p>
        </div>

        {/* Excluded by Rule */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Excluded Rules</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{excludedCount}</div>
          <p className="text-xs text-rose-700 mt-1">Mandatory rule overrides</p>
        </div>

        {/* Companies Tracked */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Companies</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{companies.length}</div>
          <p className="text-xs text-slate-500 mt-1">Grounded firmographics</p>
        </div>
      </div>

      {/* Qualification Distribution Progress Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Lead Fit Score Distribution</h3>
            <p className="text-xs text-slate-500">
              Evaluated against active campaign weights: Company ({activeCampaign.weights.companyFit}%), Role ({activeCampaign.weights.titleSeniority}%), Industry ({activeCampaign.weights.industryFit}%), Evidence ({activeCampaign.weights.evidenceQuality}%), Geo ({activeCampaign.weights.geographyFit}%).
            </p>
          </div>
          <button
            onClick={() => onNavigate('campaigns')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
          >
            <span>Adjust Weights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${qualifiedPercentage}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Qualified: ${qualifiedCount} (${qualifiedPercentage}%)`}
          />
          <div
            style={{ width: `${reviewPercentage}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
            title={`Review Required: ${reviewRequiredCount} (${reviewPercentage}%)`}
          />
          <div
            style={{ width: `${lowPriorityPercentage}%` }}
            className="bg-slate-300 h-full transition-all duration-500"
            title={`Low Priority: ${lowPriorityCount} (${lowPriorityPercentage}%)`}
          />
          <div
            style={{ width: `${excludedPercentage}%` }}
            className="bg-rose-400 h-full transition-all duration-500"
            title={`Excluded: ${excludedCount} (${excludedPercentage}%)`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
            <span className="text-slate-700 font-medium">Qualified for Review (80-100):</span>
            <span className="text-slate-500">{qualifiedCount} ({qualifiedPercentage}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-amber-400"></span>
            <span className="text-slate-700 font-medium">Review Required (60-79):</span>
            <span className="text-slate-500">{reviewRequiredCount} ({reviewPercentage}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-slate-300"></span>
            <span className="text-slate-700 font-medium">Low Priority (&lt;60):</span>
            <span className="text-slate-500">{lowPriorityCount} ({lowPriorityPercentage}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-rose-400"></span>
            <span className="text-slate-700 font-medium">Excluded by Rule:</span>
            <span className="text-slate-500">{excludedCount} ({excludedPercentage}%)</span>
          </div>
        </div>
      </div>

      {/* Top Qualified Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Top Priority Qualified Leads</h3>
            <p className="text-xs text-slate-500">High-scoring decision makers ready for personalized outreach.</p>
          </div>
          <button
            onClick={() => onNavigate('leads')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
          >
            <span>View All ({leads.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Industry & Size</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Evidence Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topQualifiedLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No qualified leads found yet. Use AI Lead Discovery or CSV Import to populate your pipeline.
                  </td>
                </tr>
              ) : (
                topQualifiedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{lead.fullName}</div>
                      <div className="text-slate-500 text-[11px]">{lead.jobTitle}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onViewCompanyProfile(lead.companyName)}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 text-left"
                      >
                        <span>{lead.companyName}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      </button>
                      <div className="text-slate-400 text-[11px]">{lead.companyDomain || 'No domain'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-700">{lead.industry}</div>
                      <div className="text-slate-400 text-[11px]">{lead.companySize || 'Unknown size'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onViewScoreBreakdown(lead)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Click to view explainable scoring breakdown"
                      >
                        <span>{lead.qualificationScore}</span>
                        <span className="text-[10px] font-normal text-emerald-600">/100</span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      {lead.isDirectEvidence ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Direct Citations ({lead.sourceUrls?.length || 0})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <span>Corroborated ({lead.sourceUrls?.length || 0})</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectLeadForOutreach(lead)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold border border-indigo-200 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Draft Outreach</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => onNavigate('discovery')}
          className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">Web Search Grounded Discovery</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Discover real companies and current decision-makers with verifiable web evidence using Google Search grounding.
          </p>
        </div>

        <div
          onClick={() => onNavigate('csv_import')}
          className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">High-Volume CSV Qualification</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Process thousands of raw leads with chunked parsing, auto-column mapping, deduplication, and explainable scoring.
          </p>
        </div>

        <div
          onClick={() => onNavigate('campaigns')}
          className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">ICP Criteria & Scoring Weights</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Customize target job titles, employee count thresholds, excluded industries/roles, and scoring weights.
          </p>
        </div>
      </div>
    </div>
  );
};
