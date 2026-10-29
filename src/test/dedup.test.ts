import test from 'node:test';
import assert from 'node:assert/strict';
import { deduplicateLeads, normalizeDomain, normalizeCompanyName, normalizeEmail } from '../utils/dedup';
import { Lead } from '../types';

test('normalize helpers clean domains, emails and company names', () => {
  assert.equal(normalizeEmail('  Marcus.Vance@CloudShield.io '), 'marcus.vance@cloudshield.io');
  assert.equal(normalizeDomain('https://www.cloudshield.io/about?utm=1'), 'cloudshield.io');
  assert.equal(normalizeCompanyName('CloudShield Technologies, Inc.'), 'cloudshield');
});

test('deduplicateLeads detects duplicate by email', () => {
  const existing: Lead[] = [
    {
      id: 'lead-1',
      fullName: 'Marcus Vance',
      jobTitle: 'CIO',
      companyName: 'CloudShield',
      email: 'marcus@cloudshield.io',
      emailStatus: 'unverified',
      industry: 'Cybersecurity',
      location: 'Boston',
      country: 'USA',
      technologies: [],
      source: 'web_discovery',
      sourceUrls: [],
      isDirectEvidence: false,
      qualificationScore: 90,
      scoreBreakdown: {} as any,
      campaignId: 'default',
      status: 'new',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const incoming: Lead[] = [
    {
      id: 'lead-2',
      fullName: 'Marcus Vance Jr',
      jobTitle: 'CIO',
      companyName: 'CloudShield Corp',
      email: 'MARCUS@cloudshield.io', // same email
      emailStatus: 'unverified',
      industry: 'Cybersecurity',
      location: 'Boston',
      country: 'USA',
      technologies: [],
      source: 'csv_import',
      sourceUrls: [],
      isDirectEvidence: false,
      qualificationScore: 85,
      scoreBreakdown: {} as any,
      campaignId: 'default',
      status: 'new',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'lead-3',
      fullName: 'Elena Rostova',
      jobTitle: 'VP Cloud',
      companyName: 'CloudShield',
      email: 'elena@cloudshield.io',
      emailStatus: 'unverified',
      industry: 'Cybersecurity',
      location: 'Boston',
      country: 'USA',
      technologies: [],
      source: 'csv_import',
      sourceUrls: [],
      isDirectEvidence: false,
      qualificationScore: 88,
      scoreBreakdown: {} as any,
      campaignId: 'default',
      status: 'new',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const res = deduplicateLeads(existing, incoming);
  assert.equal(res.duplicateCount, 1);
  assert.equal(res.uniqueLeads.length, 1);
  assert.equal(res.uniqueLeads[0].fullName, 'Elena Rostova');
  assert.ok(res.duplicateLeads[0].matchReason.includes('Identical email address'));
});
