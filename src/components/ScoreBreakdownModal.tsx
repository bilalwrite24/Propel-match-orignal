import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import { Lead, IcpCampaign } from '../types';

interface ScoreBreakdownModalProps {
  lead: Lead | null;
  campaign: IcpCampaign;
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  lead,
  campaign,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !lead) return null;

  const breakdown = lead.scoreBreakdown;
  const isExcluded = breakdown?.isExcluded;

  const tierColors = {
    'Qualified for Review': 'bg-emerald-50 text-emerald-700 border-emerald-300',
    'Review Required': 'bg-amber-50 text-amber-700 border-amber-300',
    'Low Priority': 'bg-slate-100 text-slate-700 border-slate-300',
    'Excluded by Rule': 'bg-rose-50 text-rose-700 border-rose-300',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Explainable ICP Scoring Engine
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  tierColors[breakdown?.tier || 'Low Priority']
                }`}
              >
                {breakdown?.tier || 'Unscored'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{lead.fullName}</h3>
            <p className="text-xs text-slate-500">
              {lead.jobTitle} • <strong className="text-slate-800">{lead.companyName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Score & Confidence Header */}
        <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-around text-center">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fit Score</span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className={`text-3xl font-extrabold ${isExcluded ? 'text-rose-600' : 'text-slate-900'}`}>
                {lead.qualificationScore}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/100</span>
            </div>
            <span className="text-[10px] text-slate-500">Based on active weights</span>
          </div>

          <div className="h-10 w-px bg-slate-200" />

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data Confidence</span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="text-3xl font-extrabold text-indigo-600">{breakdown?.confidence || 50}</span>
              <span className="text-xs text-indigo-400 font-semibold">%</span>
            </div>
            <span className="text-[10px] text-slate-500">Separate from numeric fit</span>
          </div>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Exclusion Warning if triggered */}
          {breakdown?.exclusionWarnings && breakdown.exclusionWarnings.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Mandatory Exclusion Overrides:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-rose-700">
                {breakdown.exclusionWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 5-Category Weighted Score Breakdown */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
              Weighted Criteria Breakdown (Total: 100)
            </h4>

            <div className="space-y-3">
              {/* Company Fit */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700">Company Size & Tech Fit</span>
                  <span className="font-bold text-slate-900">
                    {breakdown?.companyFit ?? 0} / {campaign.weights.companyFit} pts
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, ((breakdown?.companyFit || 0) / (campaign.weights.companyFit || 25)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Title & Seniority */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700">Job Title & Decision-Maker Seniority</span>
                  <span className="font-bold text-slate-900">
                    {breakdown?.titleSeniorityFit ?? 0} / {campaign.weights.titleSeniority} pts
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, ((breakdown?.titleSeniorityFit || 0) / (campaign.weights.titleSeniority || 30)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Industry Fit */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700">Target Industry Vertical</span>
                  <span className="font-bold text-slate-900">
                    {breakdown?.industryFit ?? 0} / {campaign.weights.industryFit} pts
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, ((breakdown?.industryFit || 0) / (campaign.weights.industryFit || 20)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Evidence Quality */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700">Evidence & Citations Quality</span>
                  <span className="font-bold text-slate-900">
                    {breakdown?.evidenceQuality ?? 0} / {campaign.weights.evidenceQuality} pts
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, ((breakdown?.evidenceQuality || 0) / (campaign.weights.evidenceQuality || 15)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Geography Fit */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700">Geography & Market Aligned</span>
                  <span className="font-bold text-slate-900">
                    {breakdown?.geographyFit ?? 0} / {campaign.weights.geographyFit} pts
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, ((breakdown?.geographyFit || 0) / (campaign.weights.geographyFit || 10)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reasons for Matching */}
          {breakdown?.reasons && breakdown.reasons.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>ICP Matching Reasons</span>
              </h4>
              <ul className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {breakdown.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Information Alerts */}
          {breakdown?.missingInformation && breakdown.missingInformation.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Missing / Incomplete Data</span>
              </h4>
              <ul className="space-y-1 bg-amber-50/50 p-3 rounded-lg border border-amber-200 text-amber-900">
                {breakdown.missingInformation.map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence Citations */}
          {lead.sourceUrls && lead.sourceUrls.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                Grounding Citations & Sources
              </h4>
              <div className="space-y-1.5">
                {lead.sourceUrls.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 hover:underline text-xs"
                  >
                    <span className="truncate pr-2 font-medium">{s.title || s.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
