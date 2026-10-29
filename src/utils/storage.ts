import { IcpCampaign, Lead, CompanyProfile, ActivityLog } from '../types';
import { evaluateLeadScore } from './scoring';

export const DEFAULT_PROPELMATCH_CAMPAIGN: IcpCampaign = {
  id: 'campaign_propelmatch_default',
  name: 'PropelMatch Enterprise IT Decision-Makers',
  description: 'Targeting IT leadership (CIO, CTO, VP of IT, Infrastructure, Cloud) across enterprise B2B tech, SaaS, cybersecurity, and IT services (200+ employees).',
  targetIndustries: [
    'B2B Technology',
    'Software & SaaS',
    'Cybersecurity',
    'Cloud Computing',
    'IT Services & Consulting',
    'Enterprise Software',
    'Artificial Intelligence',
  ],
  targetJobTitles: [
    'Chief Information Officer',
    'CIO',
    'Chief Technology Officer',
    'CTO',
    'VP of Information Technology',
    'VP of IT',
    'VP of Infrastructure',
    'VP of Cloud',
    'IT Director',
    'Director of IT Operations',
    'Head of Infrastructure',
    'VP Engineering',
  ],
  targetSeniorities: ['C-Level', 'VP', 'Vice President', 'Director', 'Head'],
  minEmployees: 200,
  maxEmployees: undefined,
  revenueRange: '$50M+',
  targetGeographies: ['United States', 'Canada', 'United Kingdom', 'Germany', 'Australia', 'Global'],
  requiredTechnologies: ['Cloud', 'AWS', 'Azure', 'Kubernetes', 'Cybersecurity', 'SaaS'],
  excludedIndustries: ['Retail', 'Hospitality', 'Real Estate', 'Restaurants'],
  excludedRoles: ['Intern', 'Student', 'Consultant', 'Freelancer', 'Associate', 'Recruiter'],
  requiredCompanyCharacteristics: ['B2B Business Model', 'Modern Cloud Architecture', 'Established IT Org'],
  campaignInstructions: 'Focus outreach on automated qualification, IT infrastructure cost optimization, and modern security posture.',
  weights: {
    companyFit: 25,
    titleSeniority: 30,
    industryFit: 20,
    evidenceQuality: 15,
    geographyFit: 10,
  },
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const INITIAL_SEED_COMPANIES: CompanyProfile[] = [
  {
    id: 'comp_cloudshield',
    name: 'CloudShield Networks',
    domain: 'cloudshield.io',
    industry: 'Cybersecurity',
    headquarters: 'Boston, MA, USA',
    companySize: '350 employees',
    estimatedEmployees: 350,
    revenueEstimate: '$65M ARR',
    foundedYear: 2018,
    description: 'CloudShield provides next-generation cloud workload protection and automated zero-trust perimeter enforcement for hybrid enterprise environments.',
    technologiesUsed: ['Kubernetes', 'AWS', 'GCP', 'Terraform', 'Golang', 'OpenTelemetry'],
    knownLeadership: [
      { name: 'Marcus Vance', title: 'Chief Information Officer', linkedinUrl: 'https://linkedin.com/in/marcus-vance-cloudshield' },
      { name: 'Elena Rostova', title: 'VP of Cloud Infrastructure', linkedinUrl: 'https://linkedin.com/in/elena-rostova-cloud' },
      { name: 'David Chen', title: 'Chief Technology Officer', linkedinUrl: 'https://linkedin.com/in/david-chen-cto' },
    ],
    sources: [
      { title: 'CloudShield About & Press', url: 'https://cloudshield.io/company' },
      { title: 'TechCrunch Security Series C Funding', url: 'https://techcrunch.com/cloudshield-funding' },
    ],
    complianceVerified: true,
    lastUpdated: '2026-10-20T10:00:00Z',
  },
  {
    id: 'comp_datacraft',
    name: 'DataCraft Analytics',
    domain: 'datacraft.ai',
    industry: 'Software & SaaS',
    headquarters: 'Austin, TX, USA',
    companySize: '520 employees',
    estimatedEmployees: 520,
    revenueEstimate: '$95M ARR',
    foundedYear: 2016,
    description: 'DataCraft delivers autonomous enterprise business intelligence and predictive telemetry pipelines for multi-cloud data warehouses.',
    technologiesUsed: ['Snowflake', 'AWS', 'Databricks', 'Apache Spark', 'Python', 'React'],
    knownLeadership: [
      { name: 'Sarah Jenkins', title: 'VP of IT Operations', linkedinUrl: 'https://linkedin.com/in/sarah-jenkins-itops' },
      { name: 'Liam O’Connor', title: 'Chief Information Officer', linkedinUrl: 'https://linkedin.com/in/liam-oconnor-cio' },
    ],
    sources: [
      { title: 'DataCraft Enterprise Overview', url: 'https://datacraft.ai/about' },
      { title: 'Gartner Magic Quadrant Cloud Analytics', url: 'https://gartner.com/datacraft-profile' },
    ],
    complianceVerified: true,
    lastUpdated: '2026-10-22T14:30:00Z',
  },
  {
    id: 'comp_nexusiq',
    name: 'NexusIQ Systems',
    domain: 'nexusiq.tech',
    industry: 'IT Services & Consulting',
    headquarters: 'Chicago, IL, USA',
    companySize: '850 employees',
    estimatedEmployees: 850,
    revenueEstimate: '$140M',
    foundedYear: 2012,
    description: 'Global managed cloud migration and enterprise DevSecOps automation consultancy serving Fortune 1000 organizations.',
    technologiesUsed: ['Azure', 'AWS', 'HashiCorp Vault', 'Docker', 'Kubernetes'],
    knownLeadership: [
      { name: 'Robert Tanaka', title: 'Director of IT Architecture', linkedinUrl: 'https://linkedin.com/in/robert-tanaka-it' },
      { name: 'Amanda Sterling', title: 'Chief Technology Officer', linkedinUrl: 'https://linkedin.com/in/amanda-sterling-cto' },
    ],
    sources: [
      { title: 'NexusIQ Corporate Profile', url: 'https://nexusiq.tech/overview' },
      { title: 'Forbes Cloud Leaders 2026', url: 'https://forbes.com/nexusiq-systems' },
    ],
    complianceVerified: true,
    lastUpdated: '2026-10-25T09:15:00Z',
  },
];

export const INITIAL_SEED_LEADS: Lead[] = [
  {
    id: 'lead_seed_1',
    fullName: 'Marcus Vance',
    jobTitle: 'Chief Information Officer',
    companyName: 'CloudShield Networks',
    companyDomain: 'cloudshield.io',
    email: 'm.vance@cloudshield.io',
    emailStatus: 'unverified',
    linkedinUrl: 'https://linkedin.com/in/marcus-vance-cloudshield',
    phone: '+1 (617) 555-0142',
    industry: 'Cybersecurity',
    companySize: '350 employees',
    employeeCount: 350,
    revenueRange: '$50M-$100M',
    location: 'Boston, MA',
    country: 'United States',
    technologies: ['Kubernetes', 'AWS', 'GCP', 'Terraform', 'Cloud'],
    source: 'web_discovery',
    sourceUrls: [
      { title: 'CloudShield Leadership', url: 'https://cloudshield.io/company' },
      { title: 'Verified Press Release', url: 'https://techcrunch.com/cloudshield-funding' },
    ],
    evidenceText: 'Directly verified from CloudShield official executive directory and verified C-level appointment announcement.',
    isDirectEvidence: true,
    qualificationScore: 92,
    scoreBreakdown: {
      companyFit: 25,
      titleSeniorityFit: 30,
      industryFit: 20,
      evidenceQuality: 15,
      geographyFit: 10,
      totalScore: 92,
      tier: 'Qualified for Review',
      reasons: [
        'Company size (350 employees) meets target threshold (min 200)',
        'Uses required tech stack: Kubernetes, AWS, Cloud',
        'Job title matches target role: "Chief Information Officer"',
        'Seniority level confirmed: "C-Level"',
        'Industry matches ICP: "Cybersecurity"',
        'Direct verified evidence with 2 cited source URL(s)',
        'Location aligns with target geography (United States)',
      ],
      missingInformation: [],
      exclusionWarnings: [],
      confidence: 96,
      isExcluded: false,
    },
    campaignId: DEFAULT_PROPELMATCH_CAMPAIGN.id,
    status: 'new',
    createdAt: '2026-10-28T09:00:00Z',
    updatedAt: '2026-10-28T09:00:00Z',
  },
  {
    id: 'lead_seed_2',
    fullName: 'Sarah Jenkins',
    jobTitle: 'VP of IT Operations',
    companyName: 'DataCraft Analytics',
    companyDomain: 'datacraft.ai',
    email: 's.jenkins@datacraft.ai',
    emailStatus: 'unverified',
    linkedinUrl: 'https://linkedin.com/in/sarah-jenkins-itops',
    phone: '+1 (512) 555-0189',
    industry: 'Software & SaaS',
    companySize: '520 employees',
    employeeCount: 520,
    revenueRange: '$50M-$100M',
    location: 'Austin, TX',
    country: 'United States',
    technologies: ['AWS', 'Snowflake', 'Cloud', 'Databricks'],
    source: 'web_discovery',
    sourceUrls: [
      { title: 'DataCraft About Us', url: 'https://datacraft.ai/about' },
    ],
    evidenceText: 'Listed as VP IT Operations in conference speaker listing and corporate leadership page.',
    isDirectEvidence: true,
    qualificationScore: 88,
    scoreBreakdown: {
      companyFit: 25,
      titleSeniorityFit: 28,
      industryFit: 20,
      evidenceQuality: 15,
      geographyFit: 10,
      totalScore: 88,
      tier: 'Qualified for Review',
      reasons: [
        'Company size (520 employees) meets target threshold (min 200)',
        'Uses required tech stack: AWS, Cloud',
        'Job title matches target role: "VP of IT"',
        'Seniority level confirmed: "VP"',
        'Industry matches ICP: "Software & SaaS"',
        'Direct verified evidence with 1 cited source URL(s)',
        'Location aligns with target geography (United States)',
      ],
      missingInformation: [],
      exclusionWarnings: [],
      confidence: 92,
      isExcluded: false,
    },
    campaignId: DEFAULT_PROPELMATCH_CAMPAIGN.id,
    status: 'new',
    createdAt: '2026-10-28T10:15:00Z',
    updatedAt: '2026-10-28T10:15:00Z',
  },
  {
    id: 'lead_seed_3',
    fullName: 'Robert Tanaka',
    jobTitle: 'Director of IT Architecture',
    companyName: 'NexusIQ Systems',
    companyDomain: 'nexusiq.tech',
    email: 'robert.t@nexusiq.tech',
    emailStatus: 'unverified',
    linkedinUrl: 'https://linkedin.com/in/robert-tanaka-it',
    phone: '',
    industry: 'IT Services & Consulting',
    companySize: '850 employees',
    employeeCount: 850,
    location: 'Chicago, IL',
    country: 'United States',
    technologies: ['Azure', 'AWS', 'Kubernetes'],
    source: 'web_discovery',
    sourceUrls: [
      { title: 'NexusIQ Team', url: 'https://nexusiq.tech/overview' },
    ],
    evidenceText: 'Identified as technical leadership contact in recent cloud security benchmark whitepaper.',
    isDirectEvidence: false,
    qualificationScore: 82,
    scoreBreakdown: {
      companyFit: 25,
      titleSeniorityFit: 25,
      industryFit: 20,
      evidenceQuality: 12,
      geographyFit: 10,
      totalScore: 82,
      tier: 'Qualified for Review',
      reasons: [
        'Company size (850 employees) meets target threshold (min 200)',
        'Uses required tech stack: Azure, AWS, Kubernetes',
        'Job title matches target role: "IT Director"',
        'Seniority level confirmed: "Director"',
        'Industry matches ICP: "IT Services & Consulting"',
        'Location aligns with target geography (United States)',
      ],
      missingInformation: ['Direct phone contact missing'],
      exclusionWarnings: [],
      confidence: 85,
      isExcluded: false,
    },
    campaignId: DEFAULT_PROPELMATCH_CAMPAIGN.id,
    status: 'in_review',
    createdAt: '2026-10-28T11:00:00Z',
    updatedAt: '2026-10-28T11:00:00Z',
  },
  {
    id: 'lead_seed_4',
    fullName: 'Emily Thorne',
    jobTitle: 'Independent IT Consultant',
    companyName: 'Apex Advisory',
    companyDomain: 'apexadvisory.co',
    email: 'emily@apexadvisory.co',
    emailStatus: 'unverified',
    linkedinUrl: '',
    phone: '',
    industry: 'Management Consulting',
    companySize: '5 employees',
    employeeCount: 5,
    location: 'Denver, CO',
    country: 'United States',
    technologies: ['Cloud'],
    source: 'csv_import',
    sourceUrls: [],
    isDirectEvidence: false,
    qualificationScore: 22,
    scoreBreakdown: {
      companyFit: 5,
      titleSeniorityFit: 5,
      industryFit: 5,
      evidenceQuality: 4,
      geographyFit: 3,
      totalScore: 22,
      tier: 'Excluded by Rule',
      reasons: [],
      missingInformation: ['Company size below 200 threshold', 'No verified source links'],
      exclusionWarnings: [
        'Role matches excluded keyword: "Consultant"',
        'Company size (5) below target threshold (200+)',
      ],
      confidence: 45,
      isExcluded: true,
    },
    campaignId: DEFAULT_PROPELMATCH_CAMPAIGN.id,
    status: 'disqualified',
    createdAt: '2026-10-28T12:00:00Z',
    updatedAt: '2026-10-28T12:00:00Z',
  },
];

const STORAGE_KEYS = {
  LEADS: 'propelmatch_leads_v1',
  CAMPAIGNS: 'propelmatch_campaigns_v1',
  COMPANIES: 'propelmatch_companies_v1',
  ACTIVITY: 'propelmatch_activity_v1',
  ACTIVE_CAMPAIGN_ID: 'propelmatch_active_campaign_id_v1',
};

export class AppStorage {
  static getCampaigns(): IcpCampaign[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [DEFAULT_PROPELMATCH_CAMPAIGN];
  }

  static saveCampaigns(campaigns: IcpCampaign[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    } catch (e) {
      console.warn('LocalStorage save failed for campaigns', e);
    }
  }

  static getActiveCampaign(): IcpCampaign {
    const campaigns = this.getCampaigns();
    try {
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CAMPAIGN_ID);
      if (activeId) {
        const found = campaigns.find((c) => c.id === activeId);
        if (found) return found;
      }
    } catch {
      // fallback
    }
    const active = campaigns.find((c) => c.isActive) || campaigns[0] || DEFAULT_PROPELMATCH_CAMPAIGN;
    return active;
  }

  static setActiveCampaign(campaignId: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CAMPAIGN_ID, campaignId);
      const campaigns = this.getCampaigns().map((c) => ({
        ...c,
        isActive: c.id === campaignId,
      }));
      this.saveCampaigns(campaigns);
    } catch (e) {
      console.warn('Failed to set active campaign', e);
    }
  }

  static getLeads(): Lead[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SEED_LEADS;
  }

  static saveLeads(leads: Lead[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    } catch (e) {
      console.warn('LocalStorage save failed for leads', e);
    }
  }

  static getCompanies(): CompanyProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SEED_COMPANIES;
  }

  static saveCompanies(companies: CompanyProfile[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    } catch (e) {
      console.warn('LocalStorage save failed for companies', e);
    }
  }

  static getActivity(): ActivityLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'act_seed_1',
        type: 'qualification',
        title: 'Initial Seed Database Loaded',
        details: 'Loaded 4 verified seed leads with PropelMatch default IT decision-maker criteria.',
        timestamp: new Date().toISOString(),
        itemCount: 4,
        status: 'success',
      },
    ];
  }

  static logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const activities = this.getActivity();
    const newEntry: ActivityLog = {
      ...log,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...activities].slice(0, 100);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed for activity', e);
    }
  }

  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
    localStorage.removeItem(STORAGE_KEYS.COMPANIES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CAMPAIGN_ID);
  }
}
