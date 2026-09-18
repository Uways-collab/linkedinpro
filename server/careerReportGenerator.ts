import {
  CareerPortfolioAuditResult,
  ComprehensiveInput,
  PlatformDraftsCollection,
  SourceIntegrityReport,
  ExecutiveSummaryReport,
  PlatformReviewSection,
  KeepElement,
  ImproveElement,
  RemoveOrReplaceElement,
  CrossPlatformConsistencyReport,
} from "../src/types";

/**
 * Robust Markdown Report Generator conforming strictly to instructions
 */
export function generateMarkdownReport(report: CareerPortfolioAuditResult): string {
  const {
    sourceIntegrity,
    executiveSummary,
    sourceBySourceReviews,
    keep,
    improve,
    removeOrReplace,
    consistencyReport,
    drafts,
    finalStatement,
  } = report;

  let md = `# Career Portfolio Pro Audit\n\n`;

  // 1. Source Integrity Statement
  md += `## Source Integrity Statement\n\n`;
  md += `"${sourceIntegrity.statement}"\n\n`;
  md += `### Sources Successfully Analyzed\n`;
  if (sourceIntegrity.sourcesAnalyzed.length > 0) {
    sourceIntegrity.sourcesAnalyzed.forEach((s) => {
      md += `- **${s.name}** (${s.type}${s.platform ? ` - ${s.platform}` : ""}): ${s.details || "Analyzed"}\n`;
    });
  } else {
    md += `- None\n`;
  }
  md += `\n### Sources That Could Not Be Accessed\n`;
  if (sourceIntegrity.sourcesNotAccessible.length > 0) {
    sourceIntegrity.sourcesNotAccessible.forEach((s) => {
      md += `- ${s}\n`;
    });
  } else {
    md += `- None\n`;
  }
  md += `\n### Sections Found\n`;
  if (sourceIntegrity.sectionsFound.length > 0) {
    sourceIntegrity.sectionsFound.forEach((sec) => (md += `- ${sec}\n`));
  } else {
    md += `- Not provided by the connected source or uploaded document.\n`;
  }
  md += `\n### Missing Information\n`;
  if (sourceIntegrity.missingInformation.length > 0) {
    sourceIntegrity.missingInformation.forEach((item) => (md += `- ${item}\n`));
  } else {
    md += `- None identified.\n`;
  }
  md += `\n### Conflicting Information\n`;
  if (sourceIntegrity.conflictingInformation.length > 0) {
    sourceIntegrity.conflictingInformation.forEach((item) => (md += `- ${item}\n`));
  } else {
    md += `- None detected.\n`;
  }
  md += `\n---\n\n`;

  // 2. Executive Summary
  md += `## Executive Summary\n\n`;
  md += `- **Overall Presentation Score:** ${executiveSummary.overallScore} / 100\n`;
  md += `  *(${executiveSummary.scoreDisclaimer})*\n\n`;
  md += `### Three Strongest Areas\n`;
  executiveSummary.threeStrongestAreas.forEach((area) => (md += `- ${area}\n`));
  md += `\n### Three Highest-Priority Improvements\n`;
  executiveSummary.threePriorityImprovements.forEach((imp) => (md += `- ${imp}\n`));
  md += `\n### Verified Positioning Statement\n`;
  md += `> ${executiveSummary.verifiedPositioningStatement}\n\n`;
  md += `**Most Important Next Action:** ${executiveSummary.mostImportantNextAction}\n\n`;
  md += `---\n\n`;

  // 3. Source-by-Source Review
  md += `## Source-by-Source Review\n\n`;
  const reviewKeys = Object.keys(sourceBySourceReviews);
  if (reviewKeys.length === 0) {
    md += `*No specific individual platform reviews available.*\n\n`;
  } else {
    reviewKeys.forEach((key) => {
      const sec = sourceBySourceReviews[key];
      md += `### ${sec.platformName}\n\n`;
      md += `**What is working:**\n`;
      sec.whatIsWorking.forEach((w) => (md += `- ${w}\n`));
      md += `\n**What needs improvement:**\n`;
      sec.whatNeedsImprovement.forEach((w) => (md += `- ${w}\n`));
      md += `\n**What should be added:**\n`;
      sec.whatShouldBeAdded.forEach((w) => (md += `- ${w}\n`));
      md += `\n**What should be removed:**\n`;
      sec.whatShouldBeRemoved.forEach((w) => (md += `- ${w}\n`));
      md += `\n**What should be rewritten:**\n`;
      sec.whatShouldBeRewritten.forEach((w) => (md += `- ${w}\n`));
      md += `\n**Missing information:**\n`;
      sec.missingInformation.forEach((w) => (md += `- ${w}\n`));
      md += `\n**Exact copy-ready recommendations:**\n`;
      sec.copyReadyRecommendations.forEach((w) => (md += `- ${w}\n`));
      md += `\n`;
    });
  }
  md += `---\n\n`;

  // 4. Keep
  md += `## Keep\n\n`;
  if (keep.length === 0) {
    md += `*Not provided by the connected source or uploaded document.*\n\n`;
  } else {
    keep.forEach((item) => {
      md += `### ${item.element}\n`;
      md += `- **Source:** ${item.source}\n`;
      md += `- **Justification:** ${item.justification}\n\n`;
    });
  }

  // 5. Improve
  md += `## Improve\n\n`;
  if (improve.length === 0) {
    md += `*No specific improvement items identified from available sources.*\n\n`;
  } else {
    improve.forEach((item, idx) => {
      md += `### Recommendation ${idx + 1}\n`;
      md += `- **Existing wording:** "${item.existingWording}"\n`;
      md += `- **Problem:** ${item.problem}\n`;
      md += `- **Why it matters:** ${item.whyItMatters}\n`;
      md += `- **Copy-ready improvement:** "${item.copyReadyImprovement}"\n`;
      md += `- **Source supporting:** ${item.sourceSupporting}\n\n`;
    });
  }

  // 6. Remove or Replace
  md += `## Remove or Replace\n\n`;
  if (removeOrReplace.length === 0) {
    md += `*No items identified for removal from available sources.*\n\n`;
  } else {
    removeOrReplace.forEach((item, idx) => {
      md += `### Item ${idx + 1}\n`;
      md += `- **Exact original wording:** "${item.exactOriginalWording}"\n`;
      md += `- **Reason to remove or reduce it:** ${item.reason}\n`;
      md += `- **Replacement wording:** "${item.replacementWording}"\n`;
      md += `- **Fully supported by source:** ${item.isFullySupported ? "Yes" : "No"}\n\n`;
    });
  }

  // 7. Cross-Platform Consistency Report
  md += `## Cross-Platform Consistency Report\n\n`;
  md += `### Consistent Information\n`;
  if (consistencyReport.consistentInformation.length > 0) {
    consistencyReport.consistentInformation.forEach((c) => (md += `- ${c}\n`));
  } else {
    md += `- Single platform or no shared verified elements found.\n`;
  }
  md += `\n### Inconsistent Information\n`;
  if (consistencyReport.inconsistentInformation.length > 0) {
    consistencyReport.inconsistentInformation.forEach((c) => (md += `- ${c}\n`));
  } else {
    md += `- None detected across analyzed sources.\n`;
  }
  md += `\n### Conflicting Information\n`;
  if (consistencyReport.conflictingInformation.length > 0) {
    consistencyReport.conflictingInformation.forEach((c) => {
      md += `- **${c.field}:** ${c.sourceA.name} ("${c.sourceA.claim}") vs ${c.sourceB.name} ("${c.sourceB.claim}")\n`;
      md += `  *${c.statement}*\n`;
    });
  } else {
    md += `- None detected.\n`;
  }
  md += `\n---\n\n`;

  // 8. Copy-Ready Profile Updates
  md += `## Copy-Ready Profile Updates\n\n`;

  if (drafts.linkedin) {
    md += `### LinkedIn\n`;
    md += `**Headline (${drafts.linkedin.headline.charCount}/${drafts.linkedin.headline.maxChars} chars):**\n${drafts.linkedin.headline.text}\n\n`;
    md += `**About Section (${drafts.linkedin.about.charCount}/${drafts.linkedin.about.maxChars} chars):**\n${drafts.linkedin.about.text}\n\n`;
    if (drafts.linkedin.skills && drafts.linkedin.skills.length > 0) {
      md += `**Verified Skills:** ${drafts.linkedin.skills.join(", ")}\n\n`;
    }
  }

  if (drafts.instagram) {
    md += `### Instagram\n`;
    md += `**Display Name (${drafts.instagram.displayName.charCount}/${drafts.instagram.displayName.maxChars} chars):** ${drafts.instagram.displayName.text}\n`;
    md += `**Bio (${drafts.instagram.bio.charCount}/${drafts.instagram.bio.maxChars} chars):**\n${drafts.instagram.bio.text}\n`;
    md += `**Link-in-bio text:** ${drafts.instagram.linkInBioText}\n`;
    md += `**Contact Call to Action:** ${drafts.instagram.contactCta}\n\n`;
  }

  if (drafts.twitter) {
    md += `### X/Twitter\n`;
    md += `**Display Name (${drafts.twitter.displayName.charCount}/${drafts.twitter.displayName.maxChars} chars):** ${drafts.twitter.displayName.text}\n`;
    md += `**Bio (${drafts.twitter.bio.charCount}/${drafts.twitter.bio.maxChars} chars):**\n${drafts.twitter.bio.text}\n`;
    md += `**Website Text:** ${drafts.twitter.websiteText}\n`;
    md += `**Pinned Post Recommendation:** ${drafts.twitter.pinnedPostRecommendation}\n\n`;
  }

  if (drafts.facebook) {
    md += `### Facebook\n`;
    md += `**Headline:** ${drafts.facebook.headline.text}\n`;
    md += `**About:**\n${drafts.facebook.about.text}\n`;
    md += `**Contact CTA:** ${drafts.facebook.contactCta}\n\n`;
  }

  if (drafts.tiktok) {
    md += `### TikTok\n`;
    md += `**Display Name:** ${drafts.tiktok.displayName.text}\n`;
    md += `**Bio:** ${drafts.tiktok.bio.text}\n`;
    md += `**Link CTA:** ${drafts.tiktok.linkCta}\n`;
    md += `**Content Positioning:** ${drafts.tiktok.contentPositioning}\n\n`;
  }

  if (drafts.github) {
    md += `### GitHub\n`;
    md += `**Bio (${drafts.github.bio.charCount}/${drafts.github.bio.maxChars} chars):** ${drafts.github.bio.text}\n`;
    md += `**README Structure:**\n${drafts.github.profileReadmeStructure}\n\n`;
    md += `**Verified Skills Only:** ${drafts.github.verifiedSkillsOnly.join(", ")}\n\n`;
  }

  if (drafts.portfolio) {
    md += `### Portfolio or Website\n`;
    md += `**Homepage Headline:** ${drafts.portfolio.homepageHeadline}\n`;
    md += `**Introduction:** ${drafts.portfolio.introduction}\n`;
    md += `**Contact & CTA:** ${drafts.portfolio.contactSection} | ${drafts.portfolio.cta}\n\n`;
  }

  if (drafts.cvResume) {
    md += `### CV or Resume\n`;
    md += `**Professional Summary:**\n${drafts.cvResume.professionalSummary}\n\n`;
  }

  md += `---\n\n`;
  md += `## Final Verification Statement\n\n`;
  md += `> ${finalStatement}\n`;

  return md;
}

export function generatePlainTextReport(report: CareerPortfolioAuditResult): string {
  return generateMarkdownReport(report)
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/>\s+/g, "");
}
