import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLeadScore, normalizeWeights, parseEmployeeCount } from '../utils/scoring';
import { DEFAULT_PROPELMATCH_CAMPAIGN } from '../utils/storage';
import { Lead } from '../types';

test('normalizeWeights properly sums weights to 100', () => {
  const customWeights = {
    companyFit: 50,
    titleSeniority: 50,
    industryFit: 50,
    evidenceQuality: 50,
    geographyFit: 50,
  };
  const normalized = normalizeWeights(customWeights);
  const total =
    normalized.companyFit +
    normalized.titleSeniority +
    normalized.industryFit +
    normalized.evidenceQuality +
    normalized.geographyFit;
  assert.equal(Math.round(total), 100);
  assert.equal(normalized.companyFit, 20);
});

test('parseEmployeeCount extracts correct numbers from ranges and strings', () => {
  assert.equal(parseEmployeeCount('500+'), 500);
  assert.equal(parseEmployeeCount('200-500 employees'), 350);
  assert.equal(parseEmployeeCount('1,000 employees'), 1000);
  assert.equal(parseEmployeeCount('Enterprise'), 1000);
  assert.equal(parseEmployeeCount('15 employees'), 15);
  assert.equal(parseEmployeeCount(undefined, 420), 420);
});

test('evaluateLeadScore gives high score to a qualified IT decision-maker in target industry', () => {
  const lead: Partial<Lead> = {
    fullName: 'Jane Doe',
    jobTitle: 'Chief Information Officer (CIO)',
    companyName: 'CloudMatrix Inc',
    industry: 'Cybersecurity',
    companySize: '500 employees',
    employeeCount: 500,
    location: 'New York, NY',
    country: 'United States',
    technologies: ['AWS', 'Kubernetes', 'Cloud'],
    sourceUrls: [{ title: 'Official Press Release', url: 'https://cloudmatrix.com/news' }],
    isDirectEvidence: true,
    email: 'jane@cloudmatrix.com',
  };

  const breakdown = evaluateLeadScore(lead, DEFAULT_PROPELMATCH_CAMPAIGN);
  assert.ok(breakdown.totalScore >= 80, `Score ${breakdown.totalScore} should be >= 80`);
  assert.equal(breakdown.tier, 'Qualified for Review');
  assert.equal(breakdown.isExcluded, false);
  assert.ok(breakdown.reasons.length >= 3);
});

test('evaluateLeadScore overrides score when mandatory exclusion rule is triggered', () => {
  const excludedLead: Partial<Lead> = {
    fullName: 'John Consultant',
    jobTitle: 'Freelance IT Consultant',
    companyName: 'B2B Software Labs',
    industry: 'Software & SaaS',
    companySize: '1,000 employees',
    employeeCount: 1000,
    location: 'San Francisco, CA',
    country: 'United States',
    sourceUrls: [],
    isDirectEvidence: false,
  };

  const breakdown = evaluateLeadScore(excludedLead, DEFAULT_PROPELMATCH_CAMPAIGN);
  assert.equal(breakdown.isExcluded, true);
  assert.equal(breakdown.tier, 'Excluded by Rule');
  assert.ok(breakdown.totalScore <= 25);
  assert.ok(breakdown.exclusionWarnings.some((w) => w.includes('Consultant')));
});
