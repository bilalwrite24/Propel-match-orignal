import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize GoogleGenAI server-side with telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to reliably parse Gemini API errors and detect 429 quota exhaustion or 503 demand spikes
function parseGeminiError(error: any) {
  let isRateLimit = false;
  let isModelUnavailable = false;
  let isAuthError = false;
  let cleanMessage = error?.message || 'An error occurred during AI processing.';

  try {
    const raw = typeof error === 'string' ? error : error?.message;
    if (raw) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const errObj = parsed?.error || parsed;
        if (errObj?.code === 429 || errObj?.status === 'RESOURCE_EXHAUSTED' || parsed?.code === 429) {
          isRateLimit = true;
          cleanMessage = errObj?.message || 'You exceeded your current Gemini API quota.';
        } else if (errObj?.code === 503 || errObj?.status === 'UNAVAILABLE' || parsed?.code === 503) {
          isModelUnavailable = true;
          cleanMessage = errObj?.message || 'The AI model is experiencing temporary peak demand.';
        } else if (errObj?.code === 403 || errObj?.code === 400) {
          isAuthError = true;
          cleanMessage = errObj?.message || 'API key permission denied or invalid.';
        }
      }
    }
  } catch {
    // If JSON parse fails, inspect raw text
  }

  const str = (String(cleanMessage) + ' ' + String(error)).toLowerCase();
  if (str.includes('429') || str.includes('resource_exhausted') || str.includes('quota') || str.includes('rate limit')) {
    isRateLimit = true;
  }
  if (str.includes('503') || str.includes('unavailable') || str.includes('high demand') || str.includes('spikes in demand')) {
    isModelUnavailable = true;
  }

  return {
    isRateLimit,
    isModelUnavailable,
    isAuthError,
    cleanMessage,
  };
}

// Timeout wrapper for Gemini API calls to prevent UI hangs during quota exhaustion or network stalls
async function generateContentWithTimeout(params: any, timeoutMs: number = 7000): Promise<any> {
  return Promise.race([
    ai.models.generateContent(params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI generation timed out after ${timeoutMs}ms (Gemini rate-limit or network latency).`)), timeoutMs)
    ),
  ]);
}

// In-flight request lock to prevent duplicate concurrent searches
let isSearchInFlight = false;

// 1. Health check & configuration status
app.get('/api/health', (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasHfToken = Boolean(process.env.HF_TOKEN);

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gemini: {
      configured: hasGeminiKey,
      model: 'gemini-3.8-flash',
      searchGroundingAvailable: hasGeminiKey,
    },
    huggingFace: {
      configured: hasHfToken,
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// 2. Real Web-Based AI Lead Discovery using Gemini with Google Search Grounding
app.post('/api/discovery/search', async (req, res) => {
  if (isSearchInFlight) {
    return res.status(429).json({
      success: false,
      isDuplicateClick: true,
      error: 'A lead discovery search is already in progress.',
      details: 'Please wait for the current search to complete before submitting another query.',
    });
  }

  isSearchInFlight = true;

  try {
    const {
      industry = 'B2B Technology',
      keywords = '',
      region = 'United States',
      companySize = '200+ employees',
      targetTitles = 'CIO, CTO, VP of IT, IT Director',
      seniority = 'C-Level, VP, Director',
      technologies = '',
      targetCount = 4,
      additionalInstructions = '',
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      isSearchInFlight = false;
      return res.status(503).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.',
        suggestCsvImport: true,
        details: 'Server requires a valid Gemini API key to run live Google Search grounding. You can immediately use the CSV Lead Import and ICP Campaign Scoring features with zero external API dependencies.',
      });
    }

    const requestedCount = Math.min(Math.max(Number(targetCount) || 4, 2), 6);

    const searchPrompt = `You are the lead discovery agent for PropelMatch AI Lead Finder.
Perform real-time web research using Google Search to discover real, verifiable B2B companies and actual current decision-makers that match the following criteria:

- Target Industry: ${industry}
- Company Keywords/Niche: ${keywords || 'Enterprise SaaS, Cloud, or Tech Services'}
- Region / Geography: ${region}
- Company Size Target: ${companySize}
- Target Job Titles: ${targetTitles}
- Seniority Levels: ${seniority}
- Required Technologies / Stack: ${technologies || 'Cloud infrastructure, Modern IT'}
- Additional Instructions: ${additionalInstructions || 'None'}
- Number of records desired: ${requestedCount}

CRITICAL ACCURACY & GROUNDING RULES:
1. Do NOT fabricate companies, contacts, titles, URLs, or domains. Only report real companies and individuals found through Google Search.
2. If you find a real company but cannot reliably confirm a specific individual in that exact role via search citations, provide the company details and state the leadership role title without making up a fictitious person.
3. For every company and contact, explain the specific evidence found in web sources.
4. Mark "isDirectEvidence: true" ONLY if the person's current role or company firmographics were directly confirmed in recent press releases, official corporate directory, or verified profile snippets. If inferred from news or partnerships, mark "isDirectEvidence: false".
5. Do NOT fabricate corporate email addresses. If not publicly visible in search snippets, set email to "" (empty string).

Return your findings ONLY as a valid JSON object matching this exact structure:
{
  "companies": [
    {
      "name": "string (Real company name)",
      "domain": "string (e.g. example.com)",
      "industry": "string",
      "location": "string (City, State/Country)",
      "country": "string",
      "size": "string (e.g. 350 employees)",
      "estimatedEmployees": number,
      "technologies": ["string"],
      "evidenceSummary": "string (short factual summary of why this company matches)",
      "sources": [
        { "title": "string", "url": "string (real search source URL)" }
      ],
      "decisionMakers": [
        {
          "fullName": "string (Real person name)",
          "jobTitle": "string (Actual verified title)",
          "linkedinUrl": "string or empty",
          "email": "string or empty (ONLY if genuinely cited)",
          "evidence": "string (where/how verified)",
          "isDirectEvidence": boolean
        }
      ]
    }
  ],
  "searchSummary": "string (Brief 1-2 sentence description of web queries conducted and verified matches)"
}
Output strictly valid JSON with no conversational text or markdown code fences outside the JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text || '';
    
    // Extract grounding chunks if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources: { title: string; url: string }[] = [];

    for (const chunk of groundingChunks) {
      if ((chunk as any).web?.uri) {
        webSources.push({
          title: (chunk as any).web.title || (chunk as any).web.uri,
          url: (chunk as any).web.uri,
        });
      }
    }

    // Clean JSON response
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(cleanJson);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse structured JSON from grounded model response.');
      }
    }

    const companies = parsedResult.companies || [];
    for (const comp of companies) {
      if (!comp.sources || comp.sources.length === 0) {
        comp.sources = webSources.slice(0, 3);
      }
    }

    return res.json({
      success: true,
      data: parsedResult,
      groundingSourcesCount: webSources.length,
      groundingChunks: webSources,
    });
  } catch (error: any) {
    console.error('Error during AI Lead Discovery search:', error);
    const parsedErr = parseGeminiError(error);

    if (parsedErr.isRateLimit) {
      return res.status(429).json({
        success: false,
        isRateLimit: true,
        error: 'Gemini API Rate Limit / Quota Exceeded (429)',
        details: 'You have exceeded your current Gemini API quota limit. For real-time web search grounding with higher request volume, you can select a billing-enabled API key in Settings > Secrets, or wait for the quota window to reset.',
        suggestCsvImport: true,
        advice: 'You can immediately import, deduplicate, and qualify thousands of leads using the high-volume CSV engine with zero external API quota consumption.',
      });
    }

    if (parsedErr.isModelUnavailable) {
      return res.status(503).json({
        success: false,
        isModelUnavailable: true,
        error: 'Gemini Search Grounding Temporarily Unavailable (503)',
        details: 'The AI model is experiencing temporary peak demand. Please wait a moment and try again, or upload a CSV file directly.',
        suggestCsvImport: true,
      });
    }

    return res.status(500).json({
      success: false,
      error: parsedErr.cleanMessage || 'An error occurred during web-based lead discovery.',
      suggestCsvImport: true,
      details: 'You can immediately upload a CSV file with existing leads for deterministic ICP scoring, deduplication, and outreach generation.',
    });
  } finally {
    isSearchInFlight = false;
  }
});

// 3. Personalized Outreach Generation
app.post('/api/outreach/generate', async (req, res) => {
  try {
    const { lead, campaign, customInstructions } = req.body;

    if (!lead) {
      return res.status(400).json({ error: 'Lead data is required for outreach generation.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      const firstName = (lead.fullName || 'there').split(' ')[0];
      const company = lead.companyName || 'your organization';
      const title = lead.jobTitle || 'technology leader';
      const techFocus = (lead.technologies && lead.technologies.length > 0)
        ? lead.technologies.slice(0, 3).join(', ')
        : 'enterprise infrastructure';

      return res.json({
        success: true,
        modelUsed: 'deterministic-template-engine',
        drafts: {
          leadId: lead.id,
          leadName: lead.fullName,
          companyName: lead.companyName,
          linkedinConnectionNote: `Hi ${firstName}, noticed your leadership as ${title} at ${company}. We help engineering teams optimize ${techFocus} operations and reduce technical debt. Would love to connect!`,
          linkedinFollowUp: `Hi ${firstName}, thanks for connecting! Saw ${company}'s focus on scaling modern architecture. Many ${lead.industry || 'tech'} teams we partner with look to streamline qualification and workflow efficiency. If relevant, happy to share a brief 2-minute overview.`,
          coldEmailSubject: `${company} + modernizing ${techFocus}`,
          coldEmailBody: `Hi ${firstName},\n\nI came across your work leading technology at ${company}. Given your team's use of ${techFocus}, I imagine scaling infrastructure reliability while balancing operational bandwidth is top of mind.\n\nAt PropelMatch, we help organizations accelerate qualification and B2B workflow intelligence with explainable, deterministic scoring.\n\nWould you be open to a quick 10-minute introductory conversation next Tuesday or Thursday?\n\nBest regards,\nB2B Partnerships Team`,
          valueProposition: `Accelerate ${company}'s enterprise workflows and eliminate manual qualification overhead with deterministic AI intelligence.`,
          callToAction: '10-minute introductory conversation to benchmark infrastructure optimization strategies.',
          generatedAt: new Date().toISOString(),
        },
      });
    }

    const prompt = `You are an elite B2B sales development copywriter for PropelMatch.
Write highly tailored, professional, evidence-backed outreach for the following qualified lead.

LEAD DETAILS:
- Full Name: ${lead.fullName}
- Job Title: ${lead.jobTitle}
- Company: ${lead.companyName}
- Industry: ${lead.industry}
- Company Size: ${lead.companySize || 'Enterprise'}
- Known Tech Stack: ${(lead.technologies || []).join(', ') || 'Modern Cloud Stack'}
- Evidence Notes: ${lead.evidenceText || (lead.scoreBreakdown?.reasons || []).join('; ') || 'Verified B2B profile'}

CAMPAIGN CONTEXT & VALUE PROPOSITION:
- Campaign: ${campaign?.name || 'PropelMatch Enterprise IT'}
- Target Offer / Instructions: ${campaign?.campaignInstructions || customInstructions || 'Help IT leaders optimize cloud infrastructure, automate qualification, and improve operational governance.'}

RULES:
1. "linkedinConnectionNote": MUST BE UNDER 300 CHARACTERS. Engaging, personalized, professional.
2. "linkedinFollowUp": 2-3 short sentences. Builds on connection, references lead's company context.
3. "coldEmailSubject": Punchy, personalized, lower-case style or professional, NO clickbait/spam words.
4. "coldEmailBody": 3 short paragraphs.
   - Paragraph 1: Specific observation about ${lead.companyName} and ${lead.jobTitle} responsibilities.
   - Paragraph 2: Tailored value proposition directly solving IT efficiency/scalability.
   - Paragraph 3: Soft, low-friction Call To Action.
5. "valueProposition": 1 concise sentence highlighting core business impact.
6. "callToAction": A suggested low-pressure next step (e.g. 10-minute benchmark chat).

Respond ONLY with valid JSON:
{
  "linkedinConnectionNote": "string (<= 300 chars)",
  "linkedinFollowUp": "string",
  "coldEmailSubject": "string",
  "coldEmailBody": "string",
  "valueProposition": "string",
  "callToAction": "string"
}`;

    const response = await generateContentWithTimeout({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    }, 7000);

    const parsed = JSON.parse(response.text || '{}');

    return res.json({
      success: true,
      modelUsed: 'gemini-3.8-flash',
      drafts: {
        leadId: lead.id,
        leadName: lead.fullName,
        companyName: lead.companyName,
        linkedinConnectionNote: parsed.linkedinConnectionNote || '',
        linkedinFollowUp: parsed.linkedinFollowUp || '',
        coldEmailSubject: parsed.coldEmailSubject || '',
        coldEmailBody: parsed.coldEmailBody || '',
        valueProposition: parsed.valueProposition || '',
        callToAction: parsed.callToAction || '',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating outreach via Gemini API:', error);
    
    // Provide intelligent evidence-backed fallback drafts if upstream model experiences temporary high demand or rate limits
    const { lead, campaign } = req.body;
    if (lead) {
      const firstName = (lead.fullName || 'there').split(' ')[0];
      const company = lead.companyName || 'your organization';
      const title = lead.jobTitle || 'technology leader';
      const techFocus = (lead.technologies && lead.technologies.length > 0)
        ? lead.technologies.slice(0, 3).join(', ')
        : 'enterprise infrastructure';

      return res.json({
        success: true,
        modelUsed: 'deterministic-evidence-fallback',
        warning: 'Upstream AI model experienced temporary high demand or quota limit; generated tailored sequences via evidence-based rules engine.',
        drafts: {
          leadId: lead.id,
          leadName: lead.fullName,
          companyName: lead.companyName,
          linkedinConnectionNote: `Hi ${firstName}, noticed your leadership as ${title} at ${company}. We help engineering teams optimize ${techFocus} operations and reduce technical debt. Would love to connect!`,
          linkedinFollowUp: `Hi ${firstName}, thanks for connecting! Saw ${company}'s focus on scaling modern architecture. Many ${lead.industry || 'tech'} teams we partner with look to streamline qualification and workflow efficiency. If relevant, happy to share a brief 2-minute overview.`,
          coldEmailSubject: `${company} + modernizing ${techFocus}`,
          coldEmailBody: `Hi ${firstName},\n\nI came across your work leading technology at ${company}. Given your team's use of ${techFocus}, I imagine scaling infrastructure reliability while balancing operational bandwidth is top of mind.\n\nAt PropelMatch, we help organizations accelerate qualification and B2B workflow intelligence with explainable, deterministic scoring.\n\nWould you be open to a quick 10-minute introductory conversation next Tuesday or Thursday?\n\nBest regards,\nB2B Partnerships Team`,
          valueProposition: `Accelerate ${company}'s enterprise workflows and eliminate manual qualification overhead with deterministic AI intelligence.`,
          callToAction: '10-minute introductory conversation to benchmark infrastructure optimization strategies.',
          generatedAt: new Date().toISOString(),
        },
      });
    }

    return res.status(500).json({
      error: error.message || 'Failed to generate personalized outreach drafts.',
    });
  }
});

// 4. Exact ICP Marketing Message Generator
app.post('/api/marketing/generate', async (req, res) => {
  try {
    const { campaign, tone = 'Executive & ROI', customProductOffer = '', primaryGoal = '' } = req.body;

    if (!campaign) {
      return res.status(400).json({ error: 'ICP Campaign is required to generate targeted marketing messages.' });
    }

    const campaignName = campaign.name || 'PropelMatch Target Segment';
    const targetTitles = (campaign.targetJobTitles || ['Technology Leadership']).join(', ');
    const industries = (campaign.targetIndustries || ['B2B Technology']).join(', ');
    const minSize = campaign.minEmployees || 200;
    const requiredTechs = (campaign.requiredTechnologies || ['Modern Cloud Stack']).join(', ');
    const instructions = campaign.campaignInstructions || customProductOffer || 'Accelerate enterprise qualification and sales intelligence.';

    if (!process.env.GEMINI_API_KEY) {
      // Deterministic evidence-backed marketing copy fallback
      return res.json({
        success: true,
        modelUsed: 'deterministic-rules-engine',
        marketingPack: {
          id: `mkt_${Date.now()}`,
          campaignId: campaign.id,
          campaignName,
          tone,
          heroHeadline: `Purpose-Built Pipeline Intelligence for Modern ${industries.split(',')[0]} Leaders`,
          heroSubheadline: `Eliminate manual SDR qualification and discover high-intent ${targetTitles.split(',')[0]} accounts with verified decision-maker firmographics.`,
          elevatorPitch: `For ${targetTitles} at ${minSize}+ employee ${industries} organizations managing ${requiredTechs}, PropelMatch delivers deterministic 0–100 lead scoring and real-time Google search grounded company verification—so your sales team only speaks with ready, qualified buyers.`,
          corePainPoints: [
            `Over 60% of SDR outbound is wasted on unqualified accounts or obsolete contact lists.`,
            `Black-box AI lead tools hallucinate titles and fabricated email addresses without verifiable evidence.`,
            `Sales and marketing lack shared alignment on strict, explainable qualification criteria and exclusion rules.`,
          ],
          targetedValueProps: [
            {
              featureOrCapability: 'Deterministic Explainable Scoring',
              businessOutcome: '100% transparent qualification breakdown across company size, seniority, and tech stack.',
            },
            {
              featureOrCapability: 'Google Search Grounded Discovery',
              businessOutcome: 'Real-time verified citations and press references without fabricated personas.',
            },
            {
              featureOrCapability: 'High-Volume Non-Blocking CSV Engine',
              businessOutcome: 'Process 10,000+ records in seconds with automated deduplication and column mapping.',
            },
          ],
          linkedInAdCopy: {
            headline: `Tired of black-box lead databases? See how ${targetTitles.split(',')[0]}s qualify accounts in seconds.`,
            body: `Most B2B lead lists are outdated before you export them. PropelMatch combines real-time search grounding with strict 0–100 ICP scoring built specifically for ${industries}. Eliminate unqualified outreach and protect your domain reputation.`,
            ctaButton: 'Request Demo',
          },
          coldOutreachAngle: {
            subjectHook: `${industries.split(',')[0]} qualification benchmark for ${targetTitles.split(',')[0]}s`,
            openingLine: `Hi {{firstName}}, most ${targetTitles.split(',')[0]}s we partner with tell us their team spends hours manually validating account tech stacks and employee counts.`,
            socialProofSnippet: `Enterprise B2B teams use PropelMatch to qualify thousands of accounts against strict ICP criteria with zero data fabrication.`,
            callToAction: `Are you free for a 10-minute workflow review next Tuesday?`,
          },
          objectionHandlers: [
            {
              objection: 'We already subscribe to a large contact database.',
              rebuttal: 'Static databases decay by 30% each year. PropelMatch grounds every discovery in live web citations and scores contacts against your unique ICP rules.',
            },
            {
              objection: 'Our sales team doesn’t have bandwidth to learn new tools.',
              rebuttal: 'PropelMatch imports existing CSV files in 3 clicks with auto-column mapping and exports scored leads directly back to your CRM.',
            },
            {
              objection: 'Is our contact data verified?',
              rebuttal: 'We never fabricate email statuses. If a contact detail is not directly cited in verified sources, it is clearly flagged as unverified.',
            },
          ],
          websiteHeroCopy: {
            badgeText: `Optimized for ${industries}`,
            h1: `Qualify ${industries} Decision Makers with Mathematical Certainty`,
            subtext: `Stop chasing unqualified leads. Target ${targetTitles} across ${minSize}+ employee accounts with verifiable grounding and explainable scoring.`,
            primaryCta: 'Start AI Account Discovery',
            secondaryCta: 'Import Existing CSV',
          },
          createdAt: new Date().toISOString(),
        },
      });
    }

    const prompt = `You are a world-class B2B positioning strategist and direct-response marketing copywriter.
Create an EXACT, production-ready Marketing Message Pack tailored precisely to the following Ideal Customer Profile (ICP).

CAMPAIGN & AUDIENCE CONTEXT:
- Campaign Name: ${campaignName}
- Target Titles / Decision Makers: ${targetTitles}
- Target Industries: ${industries}
- Minimum Company Headcount: ${minSize}+ employees
- Target Tech Stack: ${requiredTechs}
- Campaign Offer / Focus: ${instructions}
- Custom Positioning Goal: ${primaryGoal || 'High-conversion B2B pipeline generation'}
- Chosen Tone of Voice: ${tone}

RULES:
1. Speak with precision to ${targetTitles}. Do not use generic fluffy corporate jargon.
2. Ground all value propositions in the specific realities of ${industries} and companies with ${minSize}+ employees.
3. Provide crisp copy ready for copy-pasting into landing pages, LinkedIn ads, cold outbound, and sales objection scripts.

Respond ONLY with valid JSON matching this exact structure:
{
  "heroHeadline": "string (Punchy, outcome-focused H1 headline)",
  "heroSubheadline": "string (Clarifying subhead explaining the transformation)",
  "elevatorPitch": "string (2-sentence definitive pitch)",
  "corePainPoints": ["string (Specific pain 1)", "string (Specific pain 2)", "string (Specific pain 3)"],
  "targetedValueProps": [
    { "featureOrCapability": "string", "businessOutcome": "string" },
    { "featureOrCapability": "string", "businessOutcome": "string" },
    { "featureOrCapability": "string", "businessOutcome": "string" }
  ],
  "linkedInAdCopy": {
    "headline": "string (<= 70 chars)",
    "body": "string (Compelling 3-sentence ad body)",
    "ctaButton": "string (e.g. Learn More, Book Briefing, Get Scored List)"
  },
  "coldOutreachAngle": {
    "subjectHook": "string (Subject line hook)",
    "openingLine": "string (Pattern-interrupt opening sentence)",
    "socialProofSnippet": "string (Credibility sentence)",
    "callToAction": "string (Low-friction soft CTA)"
  },
  "objectionHandlers": [
    { "objection": "string (Top objection 1)", "rebuttal": "string (Tactful, proof-backed counter)" },
    { "objection": "string (Top objection 2)", "rebuttal": "string (Tactful, proof-backed counter)" },
    { "objection": "string (Top objection 3)", "rebuttal": "string (Tactful, proof-backed counter)" }
  ],
  "websiteHeroCopy": {
    "badgeText": "string (e.g. For Enterprise IT Leaders)",
    "h1": "string (High-converting hero H1)",
    "subtext": "string (Supporting subtext)",
    "primaryCta": "string (Primary button label)",
    "secondaryCta": "string (Secondary button label)"
  }
}`;

    const response = await generateContentWithTimeout({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    }, 7000);

    const parsed = JSON.parse(response.text || '{}');

    return res.json({
      success: true,
      modelUsed: 'gemini-3.8-flash',
      marketingPack: {
        id: `mkt_${Date.now()}`,
        campaignId: campaign.id,
        campaignName,
        tone,
        ...parsed,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating marketing messages:', error);
    const parsedErr = parseGeminiError(error);

    // Resilient fallback with tailored copy if model is rate limited or unavailable
    const { campaign, tone = 'Executive & ROI' } = req.body;
    const campaignName = campaign?.name || 'PropelMatch Target Segment';
    const targetTitles = (campaign?.targetJobTitles || ['IT Decision Makers']).join(', ');
    const industries = (campaign?.targetIndustries || ['Enterprise Tech']).join(', ');

    return res.json({
      success: true,
      modelUsed: 'deterministic-rules-engine',
      warning: parsedErr.isRateLimit ? 'Gemini API quota reached; generated marketing copy via local positioning engine.' : undefined,
      marketingPack: {
        id: `mkt_${Date.now()}`,
        campaignId: campaign?.id || 'default',
        campaignName,
        tone,
        heroHeadline: `Accelerate Pipeline with Verified ${targetTitles.split(',')[0]} Decision Makers`,
        heroSubheadline: `Stop guessing account fit. Score, deduplicate, and qualify ${industries} organizations against your exact ICP rules.`,
        elevatorPitch: `PropelMatch connects revenue teams directly with verified ${targetTitles} across ${industries}. Using deterministic 0–100 scoring and real-time grounding, we eliminate manual qualification so you only focus on high-probability buyers.`,
        corePainPoints: [
          `Wasting up to 70% of outbound effort on accounts that fail minimum size or infrastructure criteria.`,
          `Unreliable lead providers returning obsolete titles and fictitious email verifications.`,
          `No explainable way to verify why an account was deemed qualified before reaching out.`,
        ],
        targetedValueProps: [
          { featureOrCapability: 'Deterministic 0–100 ICP Scoring', businessOutcome: 'Instant transparency on why every contact meets or fails your threshold.' },
          { featureOrCapability: 'Live Web Grounding Citations', businessOutcome: 'Every role and tech stack is backed by verifiable search source URLs.' },
          { featureOrCapability: 'High-Volume CSV Processing', businessOutcome: 'Qualify and deduplicate 5,000+ raw leads in seconds without freezing.' },
        ],
        linkedInAdCopy: {
          headline: `Qualify ${industries} accounts with transparent 0–100 ICP scoring.`,
          body: `Don’t let your SDRs burn through stale lists. PropelMatch gives you live Google-grounded account intelligence and deterministic qualification tailored to ${targetTitles}.`,
          ctaButton: 'Explore Leads',
        },
        coldOutreachAngle: {
          subjectHook: `Quick question regarding ${industries.split(',')[0]} pipeline qualification`,
          openingLine: `Hi {{firstName}}, noticed your focus on technology leadership at {{companyName}}.`,
          socialProofSnippet: `Teams targeting ${targetTitles} use PropelMatch to eliminate manual account vetting and ensure 100% ICP alignment.`,
          callToAction: `Would you be open to exchanging notes next week?`,
        },
        objectionHandlers: [
          { objection: 'We already use a CRM enrichment tool.', rebuttal: 'Enrichment tools fill database gaps, but they don’t qualify leads against custom weighted ICP rules or provide verified live web citations.' },
          { objection: 'Is our contact data verified?', rebuttal: 'We strictly state whether evidence is directly verified or inferred, and never fabricate verification statuses.' },
        ],
        websiteHeroCopy: {
          badgeText: `Tailored for ${industries}`,
          h1: `The Explainable B2B Lead Intelligence Agent`,
          subtext: `Discover real decision makers and qualify accounts against your exact ICP criteria in minutes.`,
          primaryCta: 'Discover Leads',
          secondaryCta: 'Upload CSV',
        },
        createdAt: new Date().toISOString(),
      },
    });
  }
});

// 5. AI Copilot Chatbot Endpoint
app.post('/api/copilot/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const { activeCampaign, leadsCount = 0, qualifiedCount = 0, selectedLead } = context;

    if (!process.env.GEMINI_API_KEY) {
      // Deterministic Copilot assistant fallback
      const lower = message.toLowerCase();
      let responseText = '';

      if (lower.includes('score') || lower.includes('scoring') || lower.includes('weight')) {
        responseText = `In your active campaign (${activeCampaign?.name || 'PropelMatch'}), leads are evaluated across 5 deterministic criteria totaling 100 points: Company Fit (${activeCampaign?.weights?.companyFit || 25} pts), Job Title & Seniority (${activeCampaign?.weights?.titleSeniority || 30} pts), Industry Fit (${activeCampaign?.weights?.industryFit || 20} pts), Evidence Quality (${activeCampaign?.weights?.evidenceQuality || 15} pts), and Geography (${activeCampaign?.weights?.geographyFit || 10} pts). Any lead matching an excluded role or excluded industry is automatically flagged as "Excluded by Rule".`;
      } else if (lower.includes('outreach') || lower.includes('email') || lower.includes('message')) {
        responseText = `To generate high-converting outreach for ${activeCampaign?.name || 'your campaign'}, focus on the lead's confirmed tech stack and active pain points. Target decision makers (like ${activeCampaign?.targetJobTitles?.slice(0, 3)?.join(', ') || 'CIOs and CTOs'}) respond best to a 3-paragraph cold email with a soft CTA or a personalized LinkedIn note under 300 characters. You can use our Outreach Generator tab to generate sequences in 1 click!`;
      } else if (lower.includes('icp') || lower.includes('campaign') || lower.includes('target')) {
        responseText = `Your current active ICP is "${activeCampaign?.name || 'PropelMatch IT Decision-Makers'}". It targets organizations with min ${activeCampaign?.minEmployees || 200}+ employees in ${activeCampaign?.targetIndustries?.slice(0, 3)?.join(', ') || 'B2B Tech'} verticals. Key decision maker titles include ${activeCampaign?.targetJobTitles?.slice(0, 3)?.join(', ')}. Currently, you have ${qualifiedCount} qualified leads out of ${leadsCount} total leads in your pipeline.`;
      } else {
        responseText = `Hello! I am your PropelMatch AI Lead & Strategy Copilot. Your active campaign "${activeCampaign?.name || 'PropelMatch IT Decision-Makers'}" has ${qualifiedCount} qualified leads ready for review. I can help you craft targeted marketing messages, brainstorm cold outreach angles, adjust ICP exclusion rules, or analyze why specific accounts qualified. What would you like to explore?`;
      }

      return res.json({
        success: true,
        modelUsed: 'deterministic-copilot-engine',
        reply: responseText,
      });
    }

    // Build system instruction and conversation context for Gemini
    const systemInstruction = `You are the PropelMatch AI Lead & ICP Copilot—an expert B2B sales development strategist, account-based marketing (ABM) advisor, and lead intelligence specialist.

CURRENT PIPELINE CONTEXT:
- Active ICP Campaign: "${activeCampaign?.name || 'PropelMatch Enterprise IT'}"
- Target Industries: ${(activeCampaign?.targetIndustries || ['B2B Technology']).join(', ')}
- Target Decision Makers: ${(activeCampaign?.targetJobTitles || ['CIO, CTO, VP of IT']).join(', ')}
- Minimum Employee Headcount: ${activeCampaign?.minEmployees || 200}+ employees
- Excluded Roles: ${(activeCampaign?.excludedRoles || ['Intern, Consultant']).join(', ')}
- Excluded Industries: ${(activeCampaign?.excludedIndustries || ['Retail, Hospitality']).join(', ')}
- Total Leads in Database: ${leadsCount}
- Qualified Leads (80-100 score): ${qualifiedCount}
${selectedLead ? `- Currently Inspected Lead: ${selectedLead.fullName} (${selectedLead.jobTitle} at ${selectedLead.companyName}, Score: ${selectedLead.qualificationScore}/100)` : ''}

CAPABILITIES & TONE:
- Be concise, strategic, actionable, and encouraging.
- Help the user optimize their ICP criteria, suggest compelling cold email/LinkedIn copy, brainstorm marketing angles, and explain scoring rules.
- Ground advice in high-conversion B2B sales best practices.
- Never claim unverified data is verified. Keep answers under 3-4 short paragraphs.`;

    // Construct multi-turn messages for Gemini
    const contents: any[] = [];
    for (const msg of (conversationHistory || []).slice(-6)) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await generateContentWithTimeout({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    }, 7000);

    return res.json({
      success: true,
      modelUsed: 'gemini-3.8-flash',
      reply: response.text || 'I processed your request, but could not produce text. Please try again.',
    });
  } catch (error: any) {
    console.error('Error in Copilot chat:', error);
    const parsedErr = parseGeminiError(error);

    const { message = '', context = {} } = req.body;
    const { activeCampaign, leadsCount = 0, qualifiedCount = 0 } = context;

    return res.json({
      success: true,
      modelUsed: 'deterministic-copilot-engine',
      warning: parsedErr.isRateLimit ? 'Gemini API quota reached; using local copilot reasoning engine.' : undefined,
      reply: `I am your PropelMatch AI Lead Copilot. You are currently targeting "${activeCampaign?.name || 'Enterprise IT Decision-Makers'}" with ${qualifiedCount} qualified leads out of ${leadsCount} total in your pipeline. I can help draft targeted marketing messages, evaluate ICP rules, or write tailored cold email hooks for your decision makers. How can I assist you right now?`,
    });
  }
});

// 6. Optional Hugging Face Integration Status & Enrichment
app.get('/api/hf/status', async (req, res) => {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return res.json({
      configured: false,
      message: 'HF_TOKEN is not configured in server environment secrets. Hugging Face integration is optional; all core lead scoring, deduplication, CSV processing, and Gemini search discovery operate independently.',
    });
  }

  try {
    const hfRes = await fetch('https://huggingface.co/api/whoami-v2', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (hfRes.ok) {
      const data = await hfRes.json();
      return res.json({
        configured: true,
        valid: true,
        username: data.name || 'authenticated-user',
        type: data.type || 'user',
      });
    } else {
      return res.json({
        configured: true,
        valid: false,
        status: hfRes.status,
        message: 'HF_TOKEN is set but Hugging Face returned an authorization error.',
      });
    }
  } catch (err: any) {
    return res.json({
      configured: true,
      valid: false,
      message: `Failed to contact Hugging Face API: ${err.message}`,
    });
  }
});

app.post('/api/hf/enrich', async (req, res) => {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: 'HF_TOKEN is not configured on the server.',
      message: 'Optional Hugging Face integration requires HF_TOKEN secret. Core workflows do not require Hugging Face.',
    });
  }

  const { companyName, industry } = req.body;
  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required.' });
  }

  try {
    const hfResponse = await fetch('https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-3B-Instruct', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Provide a 2-sentence firmographic summary for the B2B company "${companyName}" in the "${industry || 'Technology'}" industry:`,
        parameters: { max_new_tokens: 150, temperature: 0.3 },
      }),
    });

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      return res.status(hfResponse.status).json({
        error: `Hugging Face inference error (${hfResponse.status})`,
        details: errText,
      });
    }

    const hfData = await hfResponse.json();
    return res.json({
      success: true,
      source: 'huggingface_router',
      result: hfData,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Error communicating with Hugging Face Inference API.',
    });
  }
});

// Vite middleware setup (development vs production)
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PropelMatch AI Lead Finder server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
