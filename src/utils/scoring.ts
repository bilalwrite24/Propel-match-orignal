import { IcpCampaign, Lead, ScoreBreakdown, QualificationTier } from '../types';

export function normalizeWeights(weights: IcpCampaign['weights']) {
  const sum =
    weights.companyFit +
    weights.titleSeniority +
    weights.industryFit +
    weights.evidenceQuality +
    weights.geographyFit;

  if (sum === 0) {
    return {
      companyFit: 25,
      titleSeniority: 30,
      industryFit: 20,
      evidenceQuality: 15,
      geographyFit: 10,
    };
  }

  return {
    companyFit: (weights.companyFit / sum) * 100,
    titleSeniority: (weights.titleSeniority / sum) * 100,
    industryFit: (weights.industryFit / sum) * 100,
    evidenceQuality: (weights.evidenceQuality / sum) * 100,
    geographyFit: (weights.geographyFit / sum) * 100,
  };
}

export function parseEmployeeCount(sizeStr?: string, numericCount?: number): number {
  if (numericCount !== undefined && !isNaN(numericCount) && numericCount > 0) {
    return numericCount;
  }
  if (!sizeStr) return 0;

  const clean = sizeStr.toLowerCase().replace(/,/g, '').trim();
  const plusMatch = clean.match(/(\d+)\s*\+/);
  if (plusMatch) return parseInt(plusMatch[1], 10);

  const rangeMatch = clean.match(/(\d+)\s*[-–to]\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    return Math.round((min + max) / 2);
  }

  const singleMatch = clean.match(/(\d+)/);
  if (singleMatch) return parseInt(singleMatch[1], 10);

  if (clean.includes('enterprise') || clean.includes('large')) return 1000;
  if (clean.includes('mid') || clean.includes('medium')) return 300;
  if (clean.includes('small') || clean.includes('startup')) return 30;

  return 0;
}

export function evaluateLeadScore(
  lead: Partial<Lead>,
  campaign: IcpCampaign
): ScoreBreakdown {
  const weights = normalizeWeights(campaign.weights);
  const reasons: string[] = [];
  const missingInformation: string[] = [];
  const exclusionWarnings: string[] = [];

  // Check mandatory exclusions first
  let isExcluded = false;

  const leadTitle = (lead.jobTitle || '').toLowerCase().trim();
  const leadIndustry = (lead.industry || '').toLowerCase().trim();
  const leadCompany = (lead.companyName || '').toLowerCase().trim();

  // Excluded roles check
  for (const excludedRole of campaign.excludedRoles) {
    const term = excludedRole.toLowerCase().trim();
    if (term && leadTitle.includes(term)) {
      isExcluded = true;
      exclusionWarnings.push(`Role matches excluded keyword: "${excludedRole}"`);
    }
  }

  // Excluded industries check
  for (const excludedInd of campaign.excludedIndustries) {
    const term = excludedInd.toLowerCase().trim();
    if (term && leadIndustry.includes(term)) {
      isExcluded = true;
      exclusionWarnings.push(`Industry matches excluded category: "${excludedInd}"`);
    }
  }

  // 1. Company Fit (size, tech requirements, characteristics)
  let rawCompanyFitRatio = 0;
  const empCount = parseEmployeeCount(lead.companySize, lead.employeeCount);

  if (empCount > 0) {
    if (empCount >= campaign.minEmployees) {
      if (!campaign.maxEmployees || empCount <= campaign.maxEmployees) {
        rawCompanyFitRatio += 0.6;
        reasons.push(`Company size (${empCount} employees) meets target threshold (min ${campaign.minEmployees})`);
      } else {
        rawCompanyFitRatio += 0.3;
        reasons.push(`Company size (${empCount} employees) exceeds target range`);
      }
    } else {
      reasons.push(`Company size (${empCount}) below target threshold (${campaign.minEmployees}+)`);
    }
  } else {
    missingInformation.push('Company employee size missing or unspecified');
  }

  // Tech check
  const leadTechs = (lead.technologies || []).map((t) => t.toLowerCase());
  if (campaign.requiredTechnologies && campaign.requiredTechnologies.length > 0) {
    const matchedTechs = campaign.requiredTechnologies.filter((req) =>
      leadTechs.some((lt) => lt.includes(req.toLowerCase()))
    );
    if (matchedTechs.length > 0) {
      const techRatio = Math.min(1, matchedTechs.length / campaign.requiredTechnologies.length);
      rawCompanyFitRatio += techRatio * 0.4;
      reasons.push(`Uses required tech stack: ${matchedTechs.join(', ')}`);
    } else {
      missingInformation.push(`Missing verified required technologies (${campaign.requiredTechnologies.join(', ')})`);
    }
  } else {
    rawCompanyFitRatio += 0.4;
  }
  const companyFitScore = Math.min(weights.companyFit, weights.companyFit * rawCompanyFitRatio);

  // 2. Job Title & Seniority Fit
  let rawTitleRatio = 0;
  if (!lead.jobTitle || lead.jobTitle.trim() === '') {
    missingInformation.push('Lead job title is empty or missing');
  } else {
    let titleMatched = false;
    for (const target of campaign.targetJobTitles) {
      const targetTerm = target.toLowerCase().trim();
      if (targetTerm && leadTitle.includes(targetTerm)) {
        titleMatched = true;
        reasons.push(`Job title matches target role: "${target}"`);
        break;
      }
    }

    let seniorityMatched = false;
    for (const seniority of campaign.targetSeniorities) {
      const senTerm = seniority.toLowerCase().trim();
      if (senTerm && (leadTitle.includes(senTerm) || (lead.jobTitle && lead.jobTitle.toLowerCase().includes(senTerm)))) {
        seniorityMatched = true;
        reasons.push(`Seniority level confirmed: "${seniority}"`);
        break;
      }
    }

    if (titleMatched && seniorityMatched) {
      rawTitleRatio = 1.0;
    } else if (titleMatched) {
      rawTitleRatio = 0.75;
    } else if (seniorityMatched) {
      rawTitleRatio = 0.5;
      reasons.push('Seniority level matches, but specific functional title differs from target list');
    } else {
      rawTitleRatio = 0.15;
    }
  }
  const titleSeniorityScore = Math.min(weights.titleSeniority, weights.titleSeniority * rawTitleRatio);

  // 3. Industry Fit
  let rawIndustryRatio = 0;
  if (!lead.industry || lead.industry.trim() === '') {
    missingInformation.push('Industry information not provided');
  } else {
    let industryMatched = false;
    for (const ind of campaign.targetIndustries) {
      const indTerm = ind.toLowerCase().trim();
      if (indTerm && (leadIndustry.includes(indTerm) || indTerm.includes(leadIndustry))) {
        industryMatched = true;
        rawIndustryRatio = 1.0;
        reasons.push(`Industry matches ICP: "${ind}"`);
        break;
      }
    }
    if (!industryMatched) {
      rawIndustryRatio = 0.2;
      reasons.push(`Industry "${lead.industry}" is outside prioritized target verticals`);
    }
  }
  const industryFitScore = Math.min(weights.industryFit, weights.industryFit * rawIndustryRatio);

  // 4. Evidence Quality
  let rawEvidenceRatio = 0;
  const sources = lead.sourceUrls || [];
  if (sources.length > 0) {
    if (lead.isDirectEvidence) {
      rawEvidenceRatio = 1.0;
      reasons.push(`Direct verified evidence with ${sources.length} cited source URL(s)`);
    } else {
      rawEvidenceRatio = 0.7;
      reasons.push(`Corroborated with web search sources (${sources.length} references)`);
    }
  } else if (lead.source === 'csv_import') {
    if (lead.email && lead.email.includes('@')) {
      rawEvidenceRatio = 0.6;
      reasons.push('CSV record provided valid corporate email');
    } else {
      rawEvidenceRatio = 0.35;
      missingInformation.push('No direct source links or verified email present in CSV record');
    }
  } else {
    rawEvidenceRatio = 0.2;
    missingInformation.push('No verifiable source URL or grounding citation available');
  }
  const evidenceScore = Math.min(weights.evidenceQuality, weights.evidenceQuality * rawEvidenceRatio);

  // 5. Geography Fit
  let rawGeoRatio = 0;
  const leadLocation = `${lead.location || ''} ${lead.country || ''}`.toLowerCase();
  if (campaign.targetGeographies.length === 0 || campaign.targetGeographies.includes('Global') || campaign.targetGeographies.includes('Worldwide')) {
    rawGeoRatio = 1.0;
  } else if (leadLocation.trim() === '') {
    missingInformation.push('Location/country is unknown');
    rawGeoRatio = 0.2;
  } else {
    const geoMatched = campaign.targetGeographies.some((g) =>
      leadLocation.includes(g.toLowerCase())
    );
    if (geoMatched) {
      rawGeoRatio = 1.0;
      reasons.push(`Location aligns with target geography (${lead.country || lead.location})`);
    } else {
      rawGeoRatio = 0.3;
      reasons.push(`Geography (${lead.location || lead.country}) outside primary target regions`);
    }
  }
  const geographyScore = Math.min(weights.geographyFit, weights.geographyFit * rawGeoRatio);

  // Total calculation
  let calculatedScore = Math.round(
    companyFitScore +
    titleSeniorityScore +
    industryFitScore +
    evidenceScore +
    geographyScore
  );

  // Cap at 100
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  // If excluded, override
  if (isExcluded) {
    calculatedScore = Math.min(calculatedScore, 25); // Cap to low priority
  }

  // Determine Qualification Tier
  let tier: QualificationTier;
  if (isExcluded) {
    tier = 'Excluded by Rule';
  } else if (calculatedScore >= 80) {
    tier = 'Qualified for Review';
  } else if (calculatedScore >= 60) {
    tier = 'Review Required';
  } else {
    tier = 'Low Priority';
  }

  // Calculate confidence score (separate from fit)
  // Confidence is high if data completeness is high & sources are present
  let dataPointsPresent = 0;
  const totalDataPoints = 6;
  if (lead.fullName && lead.fullName.trim()) dataPointsPresent++;
  if (lead.jobTitle && lead.jobTitle.trim()) dataPointsPresent++;
  if (lead.companyName && lead.companyName.trim()) dataPointsPresent++;
  if (empCount > 0) dataPointsPresent++;
  if (lead.industry && lead.industry.trim()) dataPointsPresent++;
  if (lead.location || lead.country) dataPointsPresent++;

  let confidence = Math.round((dataPointsPresent / totalDataPoints) * 70);
  if (sources.length > 0) confidence += 20;
  if (lead.email && lead.email.includes('@')) confidence += 10;
  confidence = Math.min(100, Math.max(10, confidence));

  return {
    companyFit: Math.round(companyFitScore),
    titleSeniorityFit: Math.round(titleSeniorityScore),
    industryFit: Math.round(industryFitScore),
    evidenceQuality: Math.round(evidenceScore),
    geographyFit: Math.round(geographyScore),
    totalScore: calculatedScore,
    tier,
    reasons,
    missingInformation,
    exclusionWarnings,
    confidence,
    isExcluded,
  };
}
