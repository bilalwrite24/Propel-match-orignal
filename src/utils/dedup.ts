import { Lead } from '../types';

export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

export function normalizeDomain(domainOrUrl?: string): string {
  if (!domainOrUrl) return '';
  let d = domainOrUrl.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.split('/')[0];
  d = d.split('?')[0];
  return d;
}

export function normalizeCompanyName(company?: string): string {
  if (!company) return '';
  return company
    .toLowerCase()
    .replace(/[,.]/g, '')
    .replace(/\b(inc|llc|corp|ltd|co|corporation|technologies|solutions|group)\b/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizePersonName(name?: string): string {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, ' ');
}

export interface DuplicateDetectionResult {
  uniqueLeads: Lead[];
  duplicateLeads: { lead: Lead; matchedWithId: string; matchReason: string }[];
  duplicateCount: number;
}

export function deduplicateLeads(existingLeads: Lead[], newLeads: Lead[]): DuplicateDetectionResult {
  const seenEmails = new Map<string, string>(); // email -> lead id
  const seenDomainPerson = new Map<string, string>(); // domain:person -> lead id
  const seenCompanyPerson = new Map<string, string>(); // company:person -> lead id

  // Register existing leads
  for (const lead of existingLeads) {
    const email = normalizeEmail(lead.email);
    if (email) seenEmails.set(email, lead.id);

    const normName = normalizePersonName(lead.fullName);
    const domain = normalizeDomain(lead.companyDomain);
    if (domain && normName) {
      seenDomainPerson.set(`${domain}:::${normName}`, lead.id);
    }

    const normCompany = normalizeCompanyName(lead.companyName);
    if (normCompany && normName) {
      seenCompanyPerson.set(`${normCompany}:::${normName}`, lead.id);
    }
  }

  const uniqueLeads: Lead[] = [];
  const duplicateLeads: { lead: Lead; matchedWithId: string; matchReason: string }[] = [];

  for (const lead of newLeads) {
    const email = normalizeEmail(lead.email);
    const normName = normalizePersonName(lead.fullName);
    const domain = normalizeDomain(lead.companyDomain);
    const normCompany = normalizeCompanyName(lead.companyName);

    let matchId: string | undefined;
    let matchReason = '';

    if (email && seenEmails.has(email)) {
      matchId = seenEmails.get(email);
      matchReason = `Identical email address (${email})`;
    } else if (domain && normName && seenDomainPerson.has(`${domain}:::${normName}`)) {
      matchId = seenDomainPerson.get(`${domain}:::${normName}`);
      matchReason = `Same company domain (${domain}) and contact name (${lead.fullName})`;
    } else if (normCompany && normName && seenCompanyPerson.has(`${normCompany}:::${normName}`)) {
      matchId = seenCompanyPerson.get(`${normCompany}:::${normName}`);
      matchReason = `Identical company name (${lead.companyName}) and contact name (${lead.fullName})`;
    }

    if (matchId) {
      duplicateLeads.push({ lead, matchedWithId: matchId, matchReason });
    } else {
      // Register in seen maps for subsequent new leads
      if (email) seenEmails.set(email, lead.id);
      if (domain && normName) seenDomainPerson.set(`${domain}:::${normName}`, lead.id);
      if (normCompany && normName) seenCompanyPerson.set(`${normCompany}:::${normName}`, lead.id);
      uniqueLeads.push(lead);
    }
  }

  return {
    uniqueLeads,
    duplicateLeads,
    duplicateCount: duplicateLeads.length,
  };
}
