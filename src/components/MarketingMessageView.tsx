import React, { useState } from 'react';
import {
  Megaphone,
  Sparkles,
  Copy,
  Check,
  FileDown,
  Layers,
  Target,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Globe,
  Linkedin,
  Mail,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { IcpCampaign, MarketingMessagePack, MarketingTone } from '../types';

interface MarketingMessageViewProps {
  activeCampaign: IcpCampaign;
  campaigns: IcpCampaign[];
  onSelectCampaign: (id: string) => void;
}

export const MarketingMessageView: React.FC<MarketingMessageViewProps> = ({
  activeCampaign,
  campaigns,
  onSelectCampaign,
}) => {
  const [tone, setTone] = useState<MarketingTone>('Executive & ROI');
  const [customProductOffer, setCustomProductOffer] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('High-conversion B2B pipeline generation');
  const [isGenerating, setIsGenerating] = useState(false);
  const [marketingPack, setMarketingPack] = useState<MarketingMessagePack | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tones: MarketingTone[] = [
    'Executive & ROI',
    'Direct & Technical',
    'Consultative',
    'Challenger',
    'High-Urgency',
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign: activeCampaign,
          tone,
          customProductOffer,
          primaryGoal,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate marketing messages.');
      }

      setMarketingPack(data.marketingPack);
    } catch (err: any) {
      console.error('Marketing message generation failed:', err);
      setErrorMsg(err.message || 'Error communicating with marketing generation service.');
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
    if (!marketingPack) return;
    const content = `PROPELMATCH EXACT ICP MARKETING MESSAGE PACK
Target ICP Campaign: ${marketingPack.campaignName}
Tone of Voice: ${marketingPack.tone}
Generated At: ${marketingPack.createdAt}

=========================================
1. HERO POSITIONING & ELEVATOR PITCH
=========================================
Primary Headline: ${marketingPack.heroHeadline}
Subheadline: ${marketingPack.heroSubheadline}

Elevator Pitch:
${marketingPack.elevatorPitch}

=========================================
2. CORE AUDIENCE PAIN POINTS
=========================================
${marketingPack.corePainPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

=========================================
3. TARGETED VALUE PROPOSITIONS MATRIX
=========================================
${marketingPack.targetedValueProps
  .map((v) => `• Capability: ${v.featureOrCapability}\n  Outcome: ${v.businessOutcome}`)
  .join('\n\n')}

=========================================
4. LINKEDIN AD & SPONSORED COPY
=========================================
Headline: ${marketingPack.linkedInAdCopy.headline}
Body Copy: ${marketingPack.linkedInAdCopy.body}
Call To Action: ${marketingPack.linkedInAdCopy.ctaButton}

=========================================
5. COLD OUTBOUND HOOK & ANGLE
=========================================
Subject Line: ${marketingPack.coldOutreachAngle.subjectHook}
Opening Line: ${marketingPack.coldOutreachAngle.openingLine}
Social Proof: ${marketingPack.coldOutreachAngle.socialProofSnippet}
Soft CTA: ${marketingPack.coldOutreachAngle.callToAction}

=========================================
6. OBJECTION HANDLERS & REBUTTALS
=========================================
${marketingPack.objectionHandlers
  .map((o) => `Q: "${o.objection}"\nA: ${o.rebuttal}`)
  .join('\n\n')}

=========================================
7. LANDING PAGE HERO COPY
=========================================
Badge: ${marketingPack.websiteHeroCopy.badgeText}
H1: ${marketingPack.websiteHeroCopy.h1}
Subtext: ${marketingPack.websiteHeroCopy.subtext}
Primary CTA: ${marketingPack.websiteHeroCopy.primaryCta}
Secondary CTA: ${marketingPack.websiteHeroCopy.secondaryCta}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exact_marketing_pack_${activeCampaign.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Exact ICP Marketing Message Studio</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Targeted B2B Marketing Message Generator
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Transforms your active Ideal Customer Profile into precise, high-converting marketing copy: value propositions, LinkedIn ads, outbound hooks, and objection scripts.
          </p>
        </div>

        {marketingPack && (
          <button
            onClick={handleExportText}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-xs shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Full Copy Pack (.txt)</span>
          </button>
        )}
      </div>

      {/* Generator Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Campaign Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Target ICP Campaign
            </label>
            <select
              value={activeCampaign.id}
              onChange={(e) => onSelectCampaign(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Targets: {activeCampaign.targetJobTitles.slice(0, 2).join(', ')} at {activeCampaign.minEmployees}+ staff
            </p>
          </div>

          {/* Tone of Voice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tone of Voice & Angle
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as MarketingTone)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none"
            >
              {tones.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {tone === 'Executive & ROI' && 'Metrics, bottom-line efficiency, and risk reduction'}
              {tone === 'Direct & Technical' && 'Architecture, specs, developer/DevOps reality'}
              {tone === 'Consultative' && 'Trusted advisory, diagnostics, and benchmarking'}
              {tone === 'Challenger' && 'Disrupts legacy assumptions and exposes hidden waste'}
              {tone === 'High-Urgency' && 'Focus on immediate operational bandwidth bottlenecks'}
            </p>
          </div>

          {/* Positioning Goal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Primary Positioning Goal
            </label>
            <input
              type="text"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="e.g. Inbound demo requests, event signups, outbound response rate"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Custom Offer / Instructions */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Product Offer / Specific Hook (Optional)
            </label>
            <input
              type="text"
              value={customProductOffer}
              onChange={(e) => setCustomProductOffer(e.target.value)}
              placeholder="e.g. Free 14-day pipeline benchmark, 10-minute infrastructure assessment, zero data fabrication guarantee"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strictly tailored to {activeCampaign.targetIndustries.slice(0, 2).join(' & ')} decision makers</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Crafting Exact Marketing Copy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Exact Marketing Message Pack</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Generated Marketing Message Pack Display */}
      {marketingPack && (
        <div className="space-y-6">
          {/* Section 1: Hero Positioning & Elevator Pitch */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">1. Core Positioning & Hero Message</span>
              <button
                onClick={() =>
                  handleCopy(
                    `${marketingPack.heroHeadline}\n${marketingPack.heroSubheadline}\n\n${marketingPack.elevatorPitch}`,
                    'hero_copy'
                  )
                }
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {copiedKey === 'hero_copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Positioning</span>
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Headline</span>
              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                {marketingPack.heroHeadline}
              </h2>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subheadline</span>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {marketingPack.heroSubheadline}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">30-Second Elevator Pitch</span>
              <p className="text-xs text-slate-800 leading-relaxed italic">
                "{marketingPack.elevatorPitch}"
              </p>
            </div>
          </div>

          {/* Section 2: Core Pain Points & Value Props Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pains */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Audience Pain Points ({activeCampaign.targetJobTitles[0] || 'Decision Maker'})
                </span>
                <button
                  onClick={() => handleCopy(marketingPack.corePainPoints.join('\n'), 'pains')}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500"
                >
                  {copiedKey === 'pains' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="space-y-2.5">
                {marketingPack.corePainPoints.map((pain, pIdx) => (
                  <div key={pIdx} className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/70 text-xs flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {pIdx + 1}
                    </span>
                    <span className="text-rose-950 font-medium leading-relaxed">{pain}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Targeted Value Props */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Targeted Value Proposition Matrix
                </span>
                <button
                  onClick={() =>
                    handleCopy(
                      marketingPack.targetedValueProps
                        .map((v) => `${v.featureOrCapability}: ${v.businessOutcome}`)
                        .join('\n'),
                      'props'
                    )
                  }
                  className="p-1 rounded hover:bg-slate-100 text-slate-500"
                >
                  {copiedKey === 'props' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="space-y-2.5">
                {marketingPack.targetedValueProps.map((vp, vIdx) => (
                  <div key={vIdx} className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/70 text-xs space-y-0.5">
                    <div className="font-bold text-emerald-950">{vp.featureOrCapability}</div>
                    <div className="text-emerald-800 leading-relaxed text-[11px]">{vp.businessOutcome}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3 & 4: LinkedIn Ad Copy & Cold Outbound Hook */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LinkedIn Ad */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs">LinkedIn Sponsored Ad & Post Copy</span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      `${marketingPack.linkedInAdCopy.headline}\n\n${marketingPack.linkedInAdCopy.body}\n\nCTA: ${marketingPack.linkedInAdCopy.ctaButton}`,
                      'linkedin_ad'
                    )
                  }
                  className="text-xs font-medium text-slate-600 flex items-center gap-1 hover:text-slate-900"
                >
                  {copiedKey === 'linkedin_ad' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="font-bold text-slate-900">{marketingPack.linkedInAdCopy.headline}</div>
                <p className="text-slate-700 leading-relaxed font-sans">{marketingPack.linkedInAdCopy.body}</p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 rounded bg-blue-600 text-white font-semibold text-[11px]">
                    {marketingPack.linkedInAdCopy.ctaButton}
                  </span>
                </div>
              </div>
            </div>

            {/* Cold Outbound Angle */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-xs">Direct Outbound Hook & Angles</span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      `Subject: ${marketingPack.coldOutreachAngle.subjectHook}\n\n${marketingPack.coldOutreachAngle.openingLine}\n\n${marketingPack.coldOutreachAngle.socialProofSnippet}\n\n${marketingPack.coldOutreachAngle.callToAction}`,
                      'outbound_angle'
                    )
                  }
                  className="text-xs font-medium text-slate-600 flex items-center gap-1 hover:text-slate-900"
                >
                  {copiedKey === 'outbound_angle' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Subject Hook:</span>
                  <div className="font-semibold text-slate-900">{marketingPack.coldOutreachAngle.subjectHook}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pattern Interrupt Opener:</span>
                  <p className="text-slate-700">{marketingPack.coldOutreachAngle.openingLine}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Proof & CTA:</span>
                  <p className="text-slate-700 italic">{marketingPack.coldOutreachAngle.socialProofSnippet} {marketingPack.coldOutreachAngle.callToAction}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Objection Handlers */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-900 text-sm">Objection Handling & Sales Rebuttals</span>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    marketingPack.objectionHandlers
                      .map((o) => `Objection: "${o.objection}"\nRebuttal: ${o.rebuttal}`)
                      .join('\n\n'),
                    'objections'
                  )
                }
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {copiedKey === 'objections' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy All Rebuttals</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {marketingPack.objectionHandlers.map((obj, oIdx) => (
                <div key={oIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-start gap-1.5">
                    <span className="text-amber-500">Q:</span>
                    <span>"{obj.objection}"</span>
                  </div>
                  <div className="text-slate-600 leading-relaxed text-[11px] pt-1 border-t border-slate-200/60">
                    <strong className="text-emerald-700 block mb-0.5">Counter / Proof:</strong>
                    {obj.rebuttal}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Landing Page Wireframe Hero */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-8 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Landing Page Hero Copy Wireframe
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    `[${marketingPack.websiteHeroCopy.badgeText}]\n${marketingPack.websiteHeroCopy.h1}\n${marketingPack.websiteHeroCopy.subtext}\nPrimary: ${marketingPack.websiteHeroCopy.primaryCta} | Secondary: ${marketingPack.websiteHeroCopy.secondaryCta}`,
                    'lp_copy'
                  )
                }
                className="text-xs text-indigo-300 hover:text-white flex items-center gap-1"
              >
                {copiedKey === 'lp_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Hero Wireframe</span>
              </button>
            </div>

            <div className="max-w-2xl space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                {marketingPack.websiteHeroCopy.badgeText}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                {marketingPack.websiteHeroCopy.h1}
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                {marketingPack.websiteHeroCopy.subtext}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs shadow-sm">
                  {marketingPack.websiteHeroCopy.primaryCta}
                </button>
                <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20">
                  {marketingPack.websiteHeroCopy.secondaryCta}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
