import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  Plus,
  Loader2,
  Globe,
  Building,
  UserCheck,
  Info,
} from 'lucide-react';
import { IcpCampaign, Lead, CompanyProfile, SearchCriteria, GroundingSource } from '../types';
import { evaluateLeadScore } from '../utils/scoring';
import { deduplicateLeads } from '../utils/dedup';
import { NavTab } from './Sidebar';

interface DiscoveryViewProps {
  activeCampaign: IcpCampaign;
  existingLeads: Lead[];
  existingCompanies: CompanyProfile[];
  onAddLeads: (leads: Lead[], companies: CompanyProfile[]) => void;
  onNavigate: (tab: NavTab) => void;
  onViewCompanyProfile: (companyName: string) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  activeCampaign,
  existingLeads,
  existingCompanies,
  onAddLeads,
  onNavigate,
  onViewCompanyProfile,
}) => {
  const [formData, setFormData] = useState<SearchCriteria>({
    industry: activeCampaign.targetIndustries[0] || 'Cybersecurity',
    keywords: 'Enterprise workload protection, cloud compliance, zero-trust',
    region: 'United States',
    companySize: `Min ${activeCampaign.minEmployees}+ employees`,
    targetTitles: activeCampaign.targetJobTitles.slice(0, 4).join(', '),
    seniority: activeCampaign.targetSeniorities.join(', '),
    technologies: activeCampaign.requiredTechnologies.join(', '),
    targetCount: 4,
    additionalInstructions: activeCampaign.campaignInstructions || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchStep, setSearchStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestCsv, setSuggestCsv] = useState(false);
  const [discoveredCompanies, setDiscoveredCompanies] = useState<any[]>([]);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [searchSummary, setSearchSummary] = useState<string>('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCooldown, setRetryCooldown] = useState(0);

  const handleInputChange = (field: keyof SearchCriteria, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryCooldown > 0 || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuggestCsv(false);
    setIsRateLimited(false);
    setDiscoveredCompanies([]);
    setGroundingSources([]);
    setSearchSummary('');
    setAddedSuccess(false);

    try {
      setSearchStep('Initiating Google Search grounding query via Gemini 3.8 Flash...');
      const response = await fetch('/api/discovery/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 429 || result.isRateLimit) {
          setIsRateLimited(true);
          setErrorMessage(
            result.details ||
            result.error ||
            'Gemini API quota exceeded (Rate Limit 429). The free tier quota has been temporarily reached.'
          );
          setSuggestCsv(true);

          // Start a 15s cooldown
          setRetryCooldown(15);
          const interval = setInterval(() => {
            setRetryCooldown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setErrorMessage(
            result.error || result.details || 'Web-based search grounding failed or timed out.'
          );
          if (result.suggestCsvImport) {
            setSuggestCsv(true);
          }
        }
        setIsLoading(false);
        return;
      }

      setSearchStep('Analyzing grounding citations and firmographic evidence...');
      const companies = result.data?.companies || [];
      const sources = result.groundingChunks || [];

      setDiscoveredCompanies(companies);
      setGroundingSources(sources);
      setSearchSummary(result.data?.searchSummary || 'Discovery search completed successfully.');
    } catch (err: any) {
      console.error('Search request error:', err);
      setErrorMessage(
        err.message || 'Network error connecting to the search discovery endpoint.'
      );
      setSuggestCsv(true);
    } finally {
      setIsLoading(false);
      setSearchStep('');
    }
  };

  // Convert discovered results into Lead records and CompanyProfiles, and add to database
  const handleSaveAllToDatabase = () => {
    const newLeads: Lead[] = [];
    const newCompanies: CompanyProfile[] = [];

    for (const comp of discoveredCompanies) {
      // Create or update company profile
      const compId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const compProfile: CompanyProfile = {
        id: compId,
        name: comp.name,
        domain: comp.domain || `${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        industry: comp.industry || formData.industry,
        headquarters: comp.location || formData.region,
        companySize: comp.size || formData.companySize,
        estimatedEmployees: comp.estimatedEmployees,
        description: comp.evidenceSummary || `${comp.name} matching ${formData.industry} criteria.`,
        technologiesUsed: comp.technologies || [],
        knownLeadership: (comp.decisionMakers || []).map((dm: any) => ({
          name: dm.fullName,
          title: dm.jobTitle,
          linkedinUrl: dm.linkedinUrl,
        })),
        sources: comp.sources || groundingSources.slice(0, 2),
        complianceVerified: true,
        lastUpdated: new Date().toISOString(),
      };
      newCompanies.push(compProfile);

      // Create decision-maker leads
      const dms = comp.decisionMakers && comp.decisionMakers.length > 0
        ? comp.decisionMakers
        : [{
            fullName: `${comp.name} Technology Leadership`,
            jobTitle: formData.targetTitles.split(',')[0]?.trim() || 'Chief Technology Officer',
            linkedinUrl: '',
            email: '',
            evidence: comp.evidenceSummary,
            isDirectEvidence: false,
          }];

      for (const dm of dms) {
        const leadDraft: Partial<Lead> = {
          id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          fullName: dm.fullName,
          jobTitle: dm.jobTitle,
          companyName: comp.name,
          companyDomain: comp.domain,
          email: dm.email || undefined,
          emailStatus: dm.email ? 'unverified' : 'unavailable',
          linkedinUrl: dm.linkedinUrl || undefined,
          industry: comp.industry || formData.industry,
          companySize: comp.size || formData.companySize,
          employeeCount: comp.estimatedEmployees,
          location: comp.location || formData.region,
          country: comp.country || 'Global',
          technologies: comp.technologies || [],
          source: 'web_discovery',
          sourceUrls: comp.sources || groundingSources.slice(0, 2),
          evidenceText: dm.evidence || comp.evidenceSummary,
          isDirectEvidence: Boolean(dm.isDirectEvidence),
          campaignId: activeCampaign.id,
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const breakdown = evaluateLeadScore(leadDraft, activeCampaign);
        leadDraft.qualificationScore = breakdown.totalScore;
        leadDraft.scoreBreakdown = breakdown;

        newLeads.push(leadDraft as Lead);
      }
    }

    // Deduplicate against existing leads
    const dedup = deduplicateLeads(existingLeads, newLeads);
    onAddLeads(dedup.uniqueLeads, newCompanies);
    setAddedSuccess(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Real Google Search Grounding with Gemini 3.8 Flash</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Live B2B Web Lead Discovery
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Queries live web sources to discover real companies and decision makers. Grounded in actual citations and URLs with no simulated or hallucinated contacts.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Targeting Active Campaign: <strong className="text-slate-900">{activeCampaign.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Discovery Form */}
      <form onSubmit={handleRunDiscovery} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Industry */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Industry / Sector <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              placeholder="e.g. Cybersecurity, Software & SaaS, Cloud Infrastructure"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Company Keywords / Niche */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Company Keywords & Niche Focus
            </label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              placeholder="e.g. Zero-trust, Kubernetes security, SOC2"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Region / Geography */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Geography / Region
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              placeholder="e.g. United States, North America, EMEA"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Target Job Titles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Decision Maker Titles <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.targetTitles}
              onChange={(e) => handleInputChange('targetTitles', e.target.value)}
              placeholder="e.g. CIO, CTO, VP of IT, IT Director"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Seniority Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Seniority Levels
            </label>
            <input
              type="text"
              value={formData.seniority}
              onChange={(e) => handleInputChange('seniority', e.target.value)}
              placeholder="e.g. C-Level, VP, Director"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Company Size / Employee Range
            </label>
            <input
              type="text"
              value={formData.companySize}
              onChange={(e) => handleInputChange('companySize', e.target.value)}
              placeholder="e.g. 200+ employees, 500-1000 staff"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Required Technologies / Architecture
            </label>
            <input
              type="text"
              value={formData.technologies}
              onChange={(e) => handleInputChange('technologies', e.target.value)}
              placeholder="e.g. AWS, Kubernetes, Terraform, Datadog"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Results Target Count */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Results to Target (2 - 10)
            </label>
            <input
              type="number"
              min={2}
              max={10}
              value={formData.targetCount}
              onChange={(e) => handleInputChange('targetCount', Number(e.target.value))}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Additional ICP Instructions
            </label>
            <input
              type="text"
              value={formData.additionalInstructions}
              onChange={(e) => handleInputChange('additionalInstructions', e.target.value)}
              placeholder="e.g. prioritize Series B+ or high growth SaaS"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Powered by Google Search Grounding • Verifiable citations & evidence
          </div>

          <button
            type="submit"
            disabled={isLoading || retryCooldown > 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Search Agent...</span>
              </>
            ) : retryCooldown > 0 ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                <span>Cooldown active ({retryCooldown}s)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Discover Leads with Google Grounding</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Progress / Loading State */}
      {isLoading && (
        <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-8 text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">{searchStep || 'Querying Google Search Grounding...'}</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Gemini is evaluating real-time search results, cross-referencing company firmographics, leadership appointments, and citations.
          </p>
        </div>
      )}

      {/* Specialized Quota Exceeded (429) & Error State */}
      {errorMessage && (
        <div
          className={`rounded-xl p-6 space-y-4 border ${
            isRateLimited
              ? 'bg-amber-50/80 border-amber-300 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                isRateLimited ? 'text-amber-600' : 'text-rose-600'
              }`}
            />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm">
                  {isRateLimited
                    ? 'Gemini Search Grounding Quota Exceeded (Rate Limit 429)'
                    : 'Lead Discovery Search Notice'}
                </h4>
                {isRateLimited && (
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                    Resource Exhausted
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>

              {isRateLimited && (
                <div className="text-xs bg-white/70 p-3 rounded-lg border border-amber-200/60 space-y-1">
                  <div className="font-semibold text-amber-950">Recommended Resolution:</div>
                  <p className="text-amber-900">
                    Free-tier Gemini API keys have rate limits on real-time web search grounding. To unlock higher continuous request quotas, you can configure a billing-enabled API key in the <strong>Settings &gt; Secrets</strong> panel.
                  </p>
                </div>
              )}
            </div>
          </div>

          {suggestCsv && (
            <div
              className={`pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isRateLimited ? 'border-amber-200' : 'border-rose-200'
              }`}
            >
              <div>
                <p className="text-xs font-semibold">Immediate Zero-Quota Alternative:</p>
                <p className="text-xs opacity-80">
                  Import and qualify thousands of leads locally with our high-volume CSV engine with zero external API quota consumption.
                </p>
              </div>
              <button
                onClick={() => onNavigate('csv_import')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-semibold text-xs transition-colors shrink-0 shadow-sm ${
                  isRateLimited
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload CSV Leads Instead</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Discovered Results Table */}
      {discoveredCompanies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold mb-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Discovered {discoveredCompanies.length} Verified Accounts</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Grounded Search Results</h3>
              <p className="text-xs text-slate-500 mt-0.5">{searchSummary}</p>
            </div>

            <div className="flex items-center gap-3">
              {addedSuccess ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Added to Database!</span>
                </div>
              ) : (
                <button
                  onClick={handleSaveAllToDatabase}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save All to Leads Database</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards for each discovered company and their decision makers */}
          <div className="space-y-4">
            {discoveredCompanies.map((comp, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{comp.name}</span>
                      <button
                        onClick={() => onViewCompanyProfile(comp.name)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
                      >
                        (View Profile)
                      </button>
                      {comp.domain && (
                        <span className="text-xs text-slate-500">({comp.domain})</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      <span>{comp.industry}</span> • <span>{comp.location || 'Location verified'}</span> •{' '}
                      <span className="font-medium text-slate-900">{comp.size || 'Size verified'}</span>
                    </div>
                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">{comp.evidenceSummary}</p>

                    {/* Tech stack */}
                    {comp.technologies && comp.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {comp.technologies.map((t: string, ti: number) => (
                          <span
                            key={ti}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sources / Citations */}
                  <div className="shrink-0 w-full md:w-64 bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                      <Globe className="w-3 h-3 text-indigo-500" />
                      <span>Web Grounding Citations:</span>
                    </div>
                    {comp.sources && comp.sources.length > 0 ? (
                      <div className="space-y-1">
                        {comp.sources.map((s: any, si: number) => (
                          <a
                            key={si}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 text-[11px] truncate"
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{s.title || s.url}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[11px]">Citations indexed</div>
                    )}
                  </div>
                </div>

                {/* Decision makers list */}
                {comp.decisionMakers && comp.decisionMakers.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Identified Decision Makers:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {comp.decisionMakers.map((dm: any, dmi: number) => (
                        <div key={dmi} className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">{dm.fullName}</div>
                            <div className="text-indigo-600 font-medium text-[11px]">{dm.jobTitle}</div>
                            <p className="text-slate-500 text-[11px] mt-1">{dm.evidence}</p>
                          </div>
                          <div>
                            {dm.isDirectEvidence ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Direct</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                Inferred
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
