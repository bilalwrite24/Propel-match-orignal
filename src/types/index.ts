export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified' | 'in_review';

export type QualificationTier = 'Qualified for Review' | 'Review Required' | 'Low Priority' | 'Excluded by Rule';

export type VerificationStatus = 'verified_source' | 'inferred' | 'unverified' | 'unavailable';

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface ScoreBreakdown {
  companyFit: number;      // max based on weight (default 25)
  titleSeniorityFit: number; // max based on weight (default 30)
  industryFit: number;     // max based on weight (default 20)
  evidenceQuality: number; // max based on weight (default 15)
  geographyFit: number;    // max based on weight (default 10)
  totalScore: number;      // 0-100
  tier: QualificationTier;
  reasons: string[];
  missingInformation: string[];
  exclusionWarnings: string[];
  confidence: number;      // 0-100 separate from fit score
  isExcluded: boolean;
}

export interface Lead {
  id: string;
  fullName: string;
  jobTitle: string;
  companyName: string;
  companyDomain?: string;
  email?: string;
  emailStatus: 'verified' | 'unverified' | 'unavailable';
  linkedinUrl?: string;
  phone?: string;
  industry: string;
  companySize?: string;
  employeeCount?: number;
  revenueRange?: string;
  location: string;
  country: string;
  technologies: string[];
  source: 'web_discovery' | 'csv_import' | 'manual';
  sourceUrls: GroundingSource[];
  evidenceText?: string;
  isDirectEvidence: boolean; // Direct vs inferred claim
  qualificationScore: number;
  scoreBreakdown: ScoreBreakdown;
  campaignId: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  customFields?: Record<string, string>;
}

export interface CompanyProfile {
  id: string;
  name: string;
  domain: string;
  industry: string;
  headquarters: string;
  companySize: string;
  estimatedEmployees?: number;
  revenueEstimate?: string;
  foundedYear?: number;
  description: string;
  technologiesUsed: string[];
  knownLeadership: { name: string; title: string; linkedinUrl?: string }[];
  sources: GroundingSource[];
  complianceVerified: boolean;
  lastUpdated: string;
}

export interface IcpScoringWeights {
  companyFit: number;      // default 25
  titleSeniority: number;  // default 30
  industryFit: number;     // default 20
  evidenceQuality: number; // default 15
  geographyFit: number;    // default 10
}

export interface IcpCampaign {
  id: string;
  name: string;
  description: string;
  targetIndustries: string[];
  targetJobTitles: string[];
  targetSeniorities: string[];
  minEmployees: number;
  maxEmployees?: number;
  revenueRange?: string;
  targetGeographies: string[];
  requiredTechnologies: string[];
  excludedIndustries: string[];
  excludedRoles: string[];
  requiredCompanyCharacteristics: string[];
  campaignInstructions?: string;
  weights: IcpScoringWeights;
  isActive: boolean;
  createdAt: string;
}

export interface OutreachDrafts {
  leadId: string;
  leadName: string;
  companyName: string;
  linkedinConnectionNote: string; // <= 300 chars
  linkedinFollowUp: string;
  coldEmailSubject: string;
  coldEmailBody: string;
  valueProposition: string;
  callToAction: string;
  generatedAt: string;
  modelUsed: string;
}

export interface ActivityLog {
  id: string;
  type: 'search_discovery' | 'csv_import' | 'qualification' | 'outreach_generated' | 'csv_export' | 'campaign_updated';
  title: string;
  details: string;
  timestamp: string;
  itemCount?: number;
  status: 'success' | 'warning' | 'error';
}

export interface SearchCriteria {
  industry: string;
  keywords: string;
  region: string;
  companySize: string;
  targetTitles: string;
  seniority: string;
  technologies: string;
  targetCount: number;
  additionalInstructions: string;
}

export type MarketingTone = 'Executive & ROI' | 'Direct & Technical' | 'Consultative' | 'Challenger' | 'High-Urgency';

export interface MarketingMessagePack {
  id: string;
  campaignId: string;
  campaignName: string;
  tone: MarketingTone;
  heroHeadline: string;
  heroSubheadline: string;
  elevatorPitch: string;
  corePainPoints: string[];
  targetedValueProps: { featureOrCapability: string; businessOutcome: string }[];
  linkedInAdCopy: {
    headline: string;
    body: string;
    ctaButton: string;
  };
  coldOutreachAngle: {
    subjectHook: string;
    openingLine: string;
    socialProofSnippet: string;
    callToAction: string;
  };
  objectionHandlers: { objection: string; rebuttal: string }[];
  websiteHeroCopy: {
    badgeText: string;
    h1: string;
    subtext: string;
    primaryCta: string;
    secondaryCta: string;
  };
  createdAt: string;
  modelUsed: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; actionType: 'navigate' | 'query'; payload: string }[];
}

