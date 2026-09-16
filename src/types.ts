export interface UserInput {
  profileUrl?: string; // Reference only, never scraped
  uploadedFileName: string;
  uploadedFileType: string;
  uploadedFileSize: number;
  uploadedFileBase64?: string;
  extractedText?: string;
  targetGoal?: string;
  targetRole?: string;
  targetIndustry?: string;
}

export interface SourceIntegrity {
  statement: string; // "This analysis is based exclusively on the uploaded document. No external LinkedIn data, mock data, assumptions, or unverified information was used."
  documentFilename: string;
  documentType: string;
  successfullyRead: boolean;
  sectionsFound: string[];
  informationNotFound: string[];
  profileUrlReference?: string;
}

export interface ExecutiveSummary {
  score: number; // 0 to 100
  strengths: [string, string, string] | string[];
  improvementPriorities: [string, string, string] | string[];
  positioningStatement: string;
  scoreDisclaimer: string;
}

export interface FactsFound {
  name: string;
  headline: string;
  location: string;
  contactInformation: string;
  aboutOrSummary: string;
  companies: string[];
  jobTitles: string[];
  dates: string[];
  locations: string[];
  skills: string[];
  certifications: string[];
  education: string[];
  otherSections: string[];
}

export interface KeepItem {
  element: string;
  explanation: string;
}

export interface ImproveItem {
  existingWording: string;
  problemIdentified: string;
  whyItMatters: string;
  recommendedRevision: string;
  classification: "Directly supported by the document" | "A writing or formatting recommendation based on the document" | "Missing information that the user may optionally add later";
}

export interface RemoveOrReplaceItem {
  exactWording: string;
  reason: string;
  replacement: string;
}

export interface HeadlineRecommendations {
  options: string[];
  critique?: string;
  insufficientDataNotice?: string;
}

export interface RewrittenAbout {
  copyReadyVersion: string;
  missingDetails: string[];
}

export interface ExperienceRoleRewrite {
  companyName: string;
  jobTitle: string;
  dates: string;
  copyReadyVersion: string;
  missingInformation: string[];
}

export interface SkillsReview {
  explicitlyPresent: string[];
  unclearOrNeedVerification: string[];
  notAvailableNotice: string;
}

export interface CertificationReviewItem {
  name: string;
  issuer: string;
  date: string;
  credentialId: string;
}

export interface CertificationReview {
  certifications: CertificationReviewItem[];
  missingDetailsNote?: string;
}

export interface DocumentContentSuggestion {
  topic: string;
  sourceSubject: string;
  reasoning: string;
}

export interface AuditReport {
  sourceIntegrity: SourceIntegrity;
  executiveSummary: ExecutiveSummary;
  factsFound: FactsFound;
  keep: KeepItem[];
  improve: ImproveItem[];
  removeOrReplace: RemoveOrReplaceItem[];
  headlineRecommendations: HeadlineRecommendations;
  rewrittenAbout: RewrittenAbout;
  experienceRewrites: ExperienceRoleRewrite[];
  skillsReview: SkillsReview;
  certificationReview: CertificationReview;
  documentContentSuggestions: DocumentContentSuggestion[];
  finalAccuracyChecklist: string[];
  finalResponseStatement: string;
  markdownReport: string;
  plainTextReport: string;
}

export interface SavedAnalysis {
  analysisId: string;
  userId: string;
  title: string;
  documentFilename: string;
  score: number;
  profileUrl?: string;
  targetRole?: string;
  targetGoal?: string;
  targetIndustry?: string;
  report: AuditReport;
  createdAt: string;
  updatedAt?: string;
}
