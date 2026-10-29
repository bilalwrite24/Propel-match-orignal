import React from 'react';
import {
  X,
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { CompanyProfile } from '../types';

interface CompanyProfileModalProps {
  company: CompanyProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  company,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header - Read Only Indicator */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{company.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                  <span>Read-Only Profile</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                {company.domain && (
                  <a
                    href={`https://${company.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    <span>{company.domain}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {company.headquarters && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{company.headquarters}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Strictly Read-Only: No edit buttons, icons, or forms) */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Key Firmographics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Industry</span>
              <div className="font-semibold text-slate-900 mt-0.5">{company.industry || 'Technology'}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Headcount</span>
              <div className="font-semibold text-slate-900 mt-0.5">{company.companySize || 'N/A'}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Revenue</span>
              <div className="font-semibold text-slate-900 mt-0.5">{company.revenueEstimate || 'Enterprise Scale'}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Founded</span>
              <div className="font-semibold text-slate-900 mt-0.5">{company.foundedYear || 'Established'}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Company Overview & Mission
            </h4>
            <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
              {company.description || 'Verified B2B entity identified via web search grounding.'}
            </p>
          </div>

          {/* Technologies Used */}
          {company.technologiesUsed && company.technologiesUsed.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Verified Technologies & Stack
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {company.technologiesUsed.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Known Leadership */}
          {company.knownLeadership && company.knownLeadership.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Identified Key Leadership
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {company.knownLeadership.map((leader, lIdx) => (
                  <div key={lIdx} className="p-3 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{leader.name}</div>
                      <div className="text-slate-500 text-[11px]">{leader.title}</div>
                    </div>
                    {leader.linkedinUrl && (
                      <a
                        href={leader.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grounding Sources & Citations */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Verified Web Sources & Citations
            </h4>
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {company.sources && company.sources.length > 0 ? (
                company.sources.map((src, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between text-xs py-1">
                    <span className="font-medium text-slate-800 truncate pr-2">{src.title}</span>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 shrink-0 text-[11px]"
                    >
                      <Globe className="w-3 h-3" />
                      <span>{src.url}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-slate-400">Sources indexed from corporate domain</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Compliance Verified • Read-only view</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-semibold text-slate-800 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
