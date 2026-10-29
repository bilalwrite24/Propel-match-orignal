import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  FileDown,
  AlertTriangle,
  User,
  Building2,
  Mail,
  Linkedin,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Lead, IcpCampaign, OutreachDrafts } from '../types';

interface OutreachViewProps {
  leads: Lead[];
  selectedLead: Lead | null;
  activeCampaign: IcpCampaign;
  onSelectLead: (lead: Lead) => void;
}

export const OutreachView: React.FC<OutreachViewProps> = ({
  leads,
  selectedLead,
  activeCampaign,
  onSelectLead,
}) => {
  const [currentLead, setCurrentLead] = useState<Lead | null>(selectedLead || leads[0] || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<OutreachDrafts | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!currentLead) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: currentLead,
          campaign: activeCampaign,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate outreach drafts');
      }

      setDrafts(data.drafts);
    } catch (err: any) {
      console.error('Outreach generation error:', err);
      setErrorMsg(err.message || 'Error occurred while contacting the outreach generator service.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportText = () => {
    if (!drafts || !currentLead) return;
    const content = `PROPELMATCH OUTREACH PACK
Lead: ${currentLead.fullName} (${currentLead.jobTitle})
Company: ${currentLead.companyName}
Generated At: ${drafts.generatedAt}

=========================================
1. LINKEDIN CONNECTION NOTE (<= 300 CHARS)
=========================================
${drafts.linkedinConnectionNote}

=========================================
2. LINKEDIN FOLLOW-UP MESSAGE
=========================================
${drafts.linkedinFollowUp}

=========================================
3. COLD EMAIL SUBJECT
=========================================
${drafts.coldEmailSubject}

=========================================
4. COLD EMAIL BODY
=========================================
${drafts.coldEmailBody}

=========================================
5. VALUE PROPOSITION HOOK
=========================================
${drafts.valueProposition}

=========================================
6. RECOMMENDED CALL TO ACTION (CTA)
=========================================
${drafts.callToAction}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outreach_${currentLead.companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Send className="w-3.5 h-3.5" />
            <span>AI Multi-Channel Outreach Engine</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Personalized B2B Outreach Generator
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Generates tailored LinkedIn connection notes, follow-ups, and cold email sequences grounded in verified firmographic citations and the active ICP value proposition.
          </p>
        </div>

        {/* Human-in-the-Loop Safe Guard Notice */}
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs max-w-md shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Manual Approval Required:</strong> PropelMatch never sends messages automatically. All drafts are for human review before sending.
          </span>
        </div>
      </div>

      {/* Lead Selector & Generate Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Target Lead to Personalize
            </label>
            <select
              value={currentLead?.id || ''}
              onChange={(e) => {
                const found = leads.find((l) => l.id === e.target.value);
                if (found) {
                  setCurrentLead(found);
                  setDrafts(null);
                }
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName} — {l.jobTitle} @ {l.companyName} (Score: {l.qualificationScore}/100)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!currentLead || isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Crafting Evidence-Backed Outreach...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Outreach Sequences</span>
              </>
            )}
          </button>
        </div>

        {/* Selected Lead Summary Pill */}
        {currentLead && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600">
            <div>
              <strong className="text-slate-900">{currentLead.fullName}</strong> • {currentLead.jobTitle} at{' '}
              <strong className="text-slate-900">{currentLead.companyName}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
                Fit Score: {currentLead.qualificationScore}/100
              </span>
              <span className="text-slate-400">
                {currentLead.technologies?.length ? `Tech: ${currentLead.technologies.slice(0, 3).join(', ')}` : 'Tech stack verified'}
              </span>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Generated Drafts Cards */}
      {drafts && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">Generated Outreach Sequences</h4>
            <button
              onClick={handleExportText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export All Drafts (.txt)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. LinkedIn Connection Note */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs">LinkedIn Connection Note</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`text-[11px] font-semibold ${
                      drafts.linkedinConnectionNote.length <= 300 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {drafts.linkedinConnectionNote.length}/300 chars
                  </span>
                  <button
                    onClick={() => handleCopy(drafts.linkedinConnectionNote, 'linkedin_note')}
                    className="p-1 rounded hover:bg-slate-100 text-slate-600"
                    title="Copy note"
                  >
                    {copiedKey === 'linkedin_note' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={drafts.linkedinConnectionNote}
                onChange={(e) =>
                  setDrafts((prev) => prev ? { ...prev, linkedinConnectionNote: e.target.value } : null)
                }
                className="w-full text-xs p-3 border border-slate-200 rounded-lg bg-slate-50/50 font-mono text-slate-800 leading-relaxed outline-none focus:bg-white"
              />
            </div>

            {/* 2. LinkedIn Follow-Up */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs">LinkedIn Follow-Up Message</span>
                </div>
                <button
                  onClick={() => handleCopy(drafts.linkedinFollowUp, 'linkedin_followup')}
                  className="p-1 rounded hover:bg-slate-100 text-slate-600 text-xs flex items-center gap-1"
                >
                  {copiedKey === 'linkedin_followup' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy</span>
                </button>
              </div>

              <textarea
                rows={4}
                value={drafts.linkedinFollowUp}
                onChange={(e) =>
                  setDrafts((prev) => prev ? { ...prev, linkedinFollowUp: e.target.value } : null)
                }
                className="w-full text-xs p-3 border border-slate-200 rounded-lg bg-slate-50/50 font-mono text-slate-800 leading-relaxed outline-none focus:bg-white"
              />
            </div>

            {/* 3. Cold Email Subject & Body */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 md:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-xs">3-Paragraph Cold Email</span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      `Subject: ${drafts.coldEmailSubject}\n\n${drafts.coldEmailBody}`,
                      'cold_email'
                    )
                  }
                  className="p-1 rounded hover:bg-slate-100 text-slate-600 text-xs flex items-center gap-1"
                >
                  {copiedKey === 'cold_email' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy Full Email</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={drafts.coldEmailSubject}
                  onChange={(e) =>
                    setDrafts((prev) => prev ? { ...prev, coldEmailSubject: e.target.value } : null)
                  }
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 font-medium text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Email Body
                </label>
                <textarea
                  rows={8}
                  value={drafts.coldEmailBody}
                  onChange={(e) =>
                    setDrafts((prev) => prev ? { ...prev, coldEmailBody: e.target.value } : null)
                  }
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg bg-slate-50/50 font-mono text-slate-800 leading-relaxed outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* 4. Value Proposition & Call to Action summary */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 md:col-span-2 text-xs">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Strategic Hook & Call To Action
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">Core Value Proposition:</span>
                  <p className="text-slate-600">{drafts.valueProposition}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">Recommended Next Step (CTA):</span>
                  <p className="text-slate-600">{drafts.callToAction}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
