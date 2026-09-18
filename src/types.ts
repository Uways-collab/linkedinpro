export type PlatformType =
  | "linkedin"
  | "instagram"
  | "twitter"
  | "facebook"
  | "tiktok"
  | "github"
  | "website"
  | "portfolio"
  | "cv_resume";

export type ConnectionStatus =
  | "not_connected"
  | "connected"
  | "reading"
  | "draft_ready"
  | "update_ready"
  | "updated_successfully"
  | "update_failed";

export interface ConnectedAccountState {
  platform: PlatformType;
  status: ConnectionStatus;
  accountHandle?: string;
  connectedAt?: string;
  lastSync?: string;
  errorMessage?: string;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64?: string;
  category: "linkedin_pdf" | "cv_resume" | "portfolio_doc" | "screenshot" | "export" | "markdown_txt";
  extractedText?: string;
  status: "ready" | "reading" | "error";
  error?: string;
}

export interface PastedTextItem {
  id: string;
  category: "profile_text" | "about_bio" | "cv_text" | "portfolio_text" | "social_captions";
  title: string;
  content: string;
  platformHint?: PlatformType;
}

export interface UserGoals {
  primaryGoal: string;
  targetRole?: string;
  targetIndustry?: string;
  targetAudience?: string;
  location?: string;
  preferredTone?: string;
  brandOrCompany?: string;
}

export interface ComprehensiveInput {
  mode: "analysis_draft" | "account_update";
  uploadedFiles: UploadedFileItem[];
  pastedTexts: PastedTextItem[];
  profileUrl?: string;
  optionalProfileUrl?: string;
  goals: UserGoals;
}

export interface SourceAnalyzedItem {
  name: string;
  type: "upload" | "pasted" | "profile_url" | "connected_account";
  platform?: string;
  status: "analyzed" | "unreadable" | "not_accessible";
  details?: string;
}

export interface SourceIntegrityReport {
  statement: string; // Exactly: "This analysis uses only the uploaded documents, pasted content, user-provided information, and successfully connected official accounts. No mock data, external search data, guessed facts, or unverified information was used."
  sourcesAnalyzed: SourceAnalyzedItem[];
  sourcesNotAccessible: string[];
  sectionsFound: string[];
  missingInformation: string[];
  conflictingInformation: string[];
}

export interface ExecutiveSummaryReport {
  overallScore: number; // 0 to 100
  scoreDisclaimer: string;
  threeStrongestAreas: [string, string, string] | string[];
  threePriorityImprovements: [string, string, string] | string[];
  verifiedPositioningStatement: string;
  mostImportantNextAction: string;
}

export interface PlatformReviewSection {
  platformName: string;
  whatIsWorking: string[];
  whatNeedsImprovement: string[];
  whatShouldBeAdded: string[];
  whatShouldBeRemoved: string[];
  whatShouldBeRewritten: string[];
  missingInformation: string[];
  copyReadyRecommendations: string[];
}

export interface KeepElement {
  element: string;
  source: string;
  justification: string;
}

export interface ImproveElement {
  existingWording: string;
  problem: string;
  whyItMatters: string;
  copyReadyImprovement: string;
  sourceSupporting: string;
}

export interface RemoveOrReplaceElement {
  exactOriginalWording: string;
  reason: string;
  replacementWording: string; // Or "No factual replacement can be created without additional information."
  isFullySupported: boolean;
}

export interface CrossPlatformConsistencyReport {
  consistentInformation: string[];
  inconsistentInformation: string[];
  missingInformation: string[];
  conflictingInformation: Array<{
    field: string;
    sourceA: { name: string; claim: string };
    sourceB: { name: string; claim: string };
    statement: string; // "These sources contain conflicting information. Please confirm which version is accurate."
  }>;
}

export interface CopyReadyDraftSection {
  id: string;
  platform: PlatformType;
  sectionName: string;
  characterLimit?: number;
  currentWording?: string;
  proposedWording: string;
  changesHighlighted?: string;
  sourceOfFactualStatement: string;
  status: "draft" | "approved" | "pending_publish" | "published" | "publish_failed";
}

export interface PlatformDraftsCollection {
  linkedin?: {
    headline: { text: string; charCount: number; maxChars: number };
    about: { text: string; charCount: number; maxChars: number };
    experience: Array<{ company: string; title: string; dates: string; text: string }>;
    skills: string[];
    featuredSectionSuggestions: string[];
    customUrlSuggestion?: string;
  };
  instagram?: {
    displayName: { text: string; charCount: number; maxChars: number };
    bio: { text: string; charCount: number; maxChars: number };
    linkInBioText: string;
    contactCta: string;
    threePinnedPostRecommendations: [string, string, string] | string[];
  };
  twitter?: {
    displayName: { text: string; charCount: number; maxChars: number };
    bio: { text: string; charCount: number; maxChars: number };
    websiteText: string;
    pinnedPostRecommendation: string;
  };
  facebook?: {
    headline: { text: string; charCount: number; maxChars: number };
    about: { text: string; charCount: number; maxChars: number };
    services: string[];
    contactCta: string;
  };
  tiktok?: {
    displayName: { text: string; charCount: number; maxChars: number };
    bio: { text: string; charCount: number; maxChars: number };
    linkCta: string;
    contentPositioning: string;
  };
  github?: {
    bio: { text: string; charCount: number; maxChars: number };
    profileReadmeStructure: string;
    projectDescriptions: Array<{ name: string; description: string; tech: string }>;
    verifiedSkillsOnly: string[];
  };
  portfolio?: {
    homepageHeadline: string;
    introduction: string;
    services: string[];
    projectDescriptions: Array<{ name: string; evidence: string; description: string; questionsForUser?: string[] }>;
    contactSection: string;
    cta: string;
  };
  cvResume?: {
    professionalSummary: string;
    experienceRewrites: Array<{ company: string; title: string; dates: string; bullets: string[]; measurableNotice?: string }>;
    skillsSection: string[];
    projectsSection: string[];
    educationAndCertifications: string[];
  };
}

export interface CareerPortfolioAuditResult {
  id: string;
  createdAt: string;
  sourceIntegrity: SourceIntegrityReport;
  executiveSummary: ExecutiveSummaryReport;
  sourceBySourceReviews: Record<string, PlatformReviewSection>;
  keep: KeepElement[];
  improve: ImproveElement[];
  removeOrReplace: RemoveOrReplaceElement[];
  consistencyReport: CrossPlatformConsistencyReport;
  drafts: PlatformDraftsCollection;
  finalStatement: string; // Exactly: "Before publishing, verify every edited sentence against your real experience. This application does not add, confirm, or publish information that was not provided by you or retrieved through an authorized official account connection."
  markdownReport: string;
  plainTextReport: string;
}

export interface SavedPortfolioAudit {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  overallScore: number;
  report: CareerPortfolioAuditResult;
}
