import Papa from 'papaparse';
import { IcpCampaign, Lead } from '../types';
import { evaluateLeadScore, parseEmployeeCount } from './scoring';
import { deduplicateLeads } from './dedup';

export interface ColumnMapping {
  fullName: string;
  jobTitle: string;
  companyName: string;
  companyDomain: string;
  email: string;
  industry: string;
  companySize: string;
  location: string;
  country: string;
  linkedinUrl: string;
  phone: string;
  technologies: string;
}

export const STANDARD_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: 'fullName', label: 'Full Name / Contact', required: true },
  { key: 'jobTitle', label: 'Job Title / Role', required: true },
  { key: 'companyName', label: 'Company Name', required: true },
  { key: 'companyDomain', label: 'Website / Domain', required: false },
  { key: 'email', label: 'Email Address', required: false },
  { key: 'industry', label: 'Industry / Vertical', required: false },
  { key: 'companySize', label: 'Company Size / Employees', required: false },
  { key: 'location', label: 'City / State / Location', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'linkedinUrl', label: 'LinkedIn Profile URL', required: false },
  { key: 'phone', label: 'Phone Number', required: false },
  { key: 'technologies', label: 'Technologies / Tech Stack', required: false },
];

export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    fullName: '',
    jobTitle: '',
    companyName: '',
    companyDomain: '',
    email: '',
    industry: '',
    companySize: '',
    location: '',
    country: '',
    linkedinUrl: '',
    phone: '',
    technologies: '',
  };

  const cleanHeaders = headers.map((h) => ({
    original: h,
    lower: h.toLowerCase().replace(/[^a-z0-9]/g, ''),
  }));

  for (const h of cleanHeaders) {
    const l = h.lower;
    if (!mapping.fullName && (l.includes('fullname') || l === 'name' || l.includes('contactname') || l.includes('person') || l === 'leadname')) {
      mapping.fullName = h.original;
    } else if (!mapping.jobTitle && (l.includes('title') || l.includes('role') || l.includes('position') || l.includes('job') || l === 'designation')) {
      mapping.jobTitle = h.original;
    } else if (!mapping.companyName && (l.includes('company') || l.includes('organization') || l.includes('accountname') || l === 'business' || l === 'firm')) {
      mapping.companyName = h.original;
    } else if (!mapping.companyDomain && (l.includes('domain') || l.includes('website') || l.includes('url') || l === 'site' || l.includes('web'))) {
      mapping.companyDomain = h.original;
    } else if (!mapping.email && (l.includes('email') || l.includes('mail') || l === 'e-mail')) {
      mapping.email = h.original;
    } else if (!mapping.industry && (l.includes('industry') || l.includes('sector') || l.includes('vertical') || l.includes('category'))) {
      mapping.industry = h.original;
    } else if (!mapping.companySize && (l.includes('size') || l.includes('employee') || l.includes('headcount') || l.includes('staff'))) {
      mapping.companySize = h.original;
    } else if (!mapping.location && (l.includes('location') || l.includes('city') || l.includes('state') || l.includes('region') || l.includes('address'))) {
      mapping.location = h.original;
    } else if (!mapping.country && (l.includes('country') || l.includes('nation') || l === 'geo')) {
      mapping.country = h.original;
    } else if (!mapping.linkedinUrl && (l.includes('linkedin') || l.includes('profile') || l.includes('social'))) {
      mapping.linkedinUrl = h.original;
    } else if (!mapping.phone && (l.includes('phone') || l.includes('mobile') || l.includes('telephone') || l.includes('contactnumber'))) {
      mapping.phone = h.original;
    } else if (!mapping.technologies && (l.includes('tech') || l.includes('stack') || l.includes('skills') || l.includes('tools'))) {
      mapping.technologies = h.original;
    }
  }

  return mapping;
}

export interface CsvParseResult {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      preview: 50,
      complete: (previewResults) => {
        if (previewResults.errors.length > 0 && previewResults.data.length === 0) {
          return reject(new Error(`CSV Parsing error: ${previewResults.errors[0].message}`));
        }
        const headers = previewResults.meta.fields || [];
        if (headers.length === 0) {
          return reject(new Error('Uploaded CSV file does not contain a valid header row.'));
        }

        // Count total rows by streaming count quickly
        let totalCount = 0;
        Papa.parse(file, {
          header: true,
          skipEmptyLines: 'greedy',
          step: () => {
            totalCount++;
          },
          complete: () => {
            resolve({
              headers,
              sampleRows: previewResults.data,
              totalRows: totalCount,
            });
          },
          error: (err) => reject(new Error(err.message)),
        });
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}

export interface ProcessCsvOptions {
  file: File;
  mapping: ColumnMapping;
  campaign: IcpCampaign;
  existingLeads: Lead[];
  onProgress?: (processed: number, total: number) => void;
  batchSize?: number;
}

export interface CsvProcessingSummary {
  totalParsed: number;
  importedLeads: Lead[];
  duplicateCount: number;
  rejectedCount: number;
  rejectionReasons: string[];
  qualifiedCount: number;
  reviewRequiredCount: number;
  lowPriorityCount: number;
  excludedCount: number;
}

export async function processCsvInChunks(options: ProcessCsvOptions): Promise<CsvProcessingSummary> {
  const { file, mapping, campaign, existingLeads, onProgress } = options;
  const rawParsedLeads: Lead[] = [];
  let rejectedCount = 0;
  const rejectionReasons: string[] = [];
  let totalProcessed = 0;

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      chunkSize: 1024 * 128, // chunk in 128KB slices to keep UI responsive
      chunk: (results, parser) => {
        parser.pause(); // pause while processing chunk
        const rows = results.data;

        for (const row of rows) {
          totalProcessed++;
          const fullName = (row[mapping.fullName] || '').trim();
          const jobTitle = (row[mapping.jobTitle] || '').trim();
          const companyName = (row[mapping.companyName] || '').trim();

          // Validation: need at least company name and either person name or title
          if (!companyName && !fullName) {
            rejectedCount++;
            if (rejectionReasons.length < 5) {
              rejectionReasons.push(`Row ${totalProcessed}: missing company and contact name`);
            }
            continue;
          }

          const rawSize = row[mapping.companySize] || '';
          const empNum = parseEmployeeCount(rawSize);

          const email = (row[mapping.email] || '').trim();
          const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

          const techString = row[mapping.technologies] || '';
          const techs = techString
            ? techString.split(/[,;|]/).map((t) => t.trim()).filter(Boolean)
            : [];

          const leadDraft: Partial<Lead> = {
            id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            fullName: fullName || 'Decision Maker (Unspecified)',
            jobTitle: jobTitle || 'Executive / Lead',
            companyName: companyName || 'Confidential Company',
            companyDomain: (row[mapping.companyDomain] || '').trim(),
            email: email || undefined,
            emailStatus: hasValidEmail ? 'unverified' : 'unavailable',
            phone: (row[mapping.phone] || '').trim() || undefined,
            linkedinUrl: (row[mapping.linkedinUrl] || '').trim() || undefined,
            industry: (row[mapping.industry] || '').trim() || 'Technology',
            companySize: rawSize || (empNum > 0 ? `${empNum} employees` : undefined),
            employeeCount: empNum > 0 ? empNum : undefined,
            location: (row[mapping.location] || '').trim(),
            country: (row[mapping.country] || '').trim() || 'Global',
            technologies: techs,
            source: 'csv_import',
            sourceUrls: [],
            isDirectEvidence: false,
            campaignId: campaign.id,
            status: 'new',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const breakdown = evaluateLeadScore(leadDraft, campaign);
          leadDraft.qualificationScore = breakdown.totalScore;
          leadDraft.scoreBreakdown = breakdown;

          rawParsedLeads.push(leadDraft as Lead);
        }

        if (onProgress) {
          onProgress(totalProcessed, totalProcessed);
        }

        // Resume parser on next animation frame to prevent thread blocking
        setTimeout(() => {
          parser.resume();
        }, 0);
      },
      complete: () => {
        // Run Deduplication against existing leads and new batch
        const dedupResult = deduplicateLeads(existingLeads, rawParsedLeads);
        const finalLeads = dedupResult.uniqueLeads;

        let qualifiedCount = 0;
        let reviewRequiredCount = 0;
        let lowPriorityCount = 0;
        let excludedCount = 0;

        for (const lead of finalLeads) {
          const tier = lead.scoreBreakdown?.tier;
          if (tier === 'Qualified for Review') qualifiedCount++;
          else if (tier === 'Review Required') reviewRequiredCount++;
          else if (tier === 'Excluded by Rule') excludedCount++;
          else lowPriorityCount++;
        }

        resolve({
          totalParsed: totalProcessed,
          importedLeads: finalLeads,
          duplicateCount: dedupResult.duplicateCount,
          rejectedCount,
          rejectionReasons,
          qualifiedCount,
          reviewRequiredCount,
          lowPriorityCount,
          excludedCount,
        });
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}

export function exportLeadsToCsv(leads: Lead[], filename = 'propelmatch_qualified_leads.csv'): void {
  const exportData = leads.map((l) => ({
    'Lead ID': l.id,
    'Full Name': l.fullName,
    'Job Title': l.jobTitle,
    'Company Name': l.companyName,
    'Company Domain': l.companyDomain || '',
    'Corporate Email': l.email || '',
    'Email Status': l.emailStatus,
    'LinkedIn Profile': l.linkedinUrl || '',
    'Industry': l.industry,
    'Company Size': l.companySize || (l.employeeCount ? `${l.employeeCount} employees` : ''),
    'Location': l.location,
    'Country': l.country,
    'Lead Score': l.qualificationScore,
    'Qualification Tier': l.scoreBreakdown?.tier || 'Unscored',
    'Score: Company Fit': l.scoreBreakdown?.companyFit ?? 0,
    'Score: Title/Seniority': l.scoreBreakdown?.titleSeniorityFit ?? 0,
    'Score: Industry': l.scoreBreakdown?.industryFit ?? 0,
    'Score: Evidence': l.scoreBreakdown?.evidenceQuality ?? 0,
    'Score: Geography': l.scoreBreakdown?.geographyFit ?? 0,
    'Confidence Score': l.scoreBreakdown?.confidence ?? 0,
    'Matching Reasons': (l.scoreBreakdown?.reasons || []).join('; '),
    'Missing Info': (l.scoreBreakdown?.missingInformation || []).join('; '),
    'Exclusion Warnings': (l.scoreBreakdown?.exclusionWarnings || []).join('; '),
    'Evidence Sources': (l.sourceUrls || []).map((s) => `${s.title}: ${s.url}`).join(' | '),
    'Discovery Source': l.source,
    'Direct Evidence': l.isDirectEvidence ? 'Yes' : 'No',
    'Created At': l.createdAt,
  }));

  const csvString = Papa.unparse(exportData);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
