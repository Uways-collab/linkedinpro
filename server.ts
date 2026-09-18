import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { extractDocumentText } from "./server/documentAuditor";
import { generateMarkdownReport, generatePlainTextReport } from "./server/careerReportGenerator";
import { fetchAndAnalyzeProfileUrl } from "./server/urlProfileFetcher";
import {
  ComprehensiveInput,
  CareerPortfolioAuditResult,
  PlatformType,
  ConnectedAccountState,
} from "./src/types";

const app = express();
const PORT = 3000;

// Body parser with 35mb limit
app.use(express.json({ limit: "35mb" }));
app.use(express.urlencoded({ extended: true, limit: "35mb" }));

// Lazy initialization of Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

async function callGeminiWithFallback(ai: GoogleGenAI, requestPayload: any): Promise<any> {
  let lastError: any = null;
  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const model = CANDIDATE_MODELS[i];
    try {
      return await ai.models.generateContent({
        ...requestPayload,
        model,
      });
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isUnavailable =
        errMsg.includes("503") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("Resource has been exhausted") ||
        errMsg.includes("high demand") ||
        errMsg.includes("overloaded");

      if (isUnavailable && i < CANDIDATE_MODELS.length - 1) {
        console.warn(`Model ${model} unavailable. Trying fallback model ${CANDIDATE_MODELS[i + 1]}...`);
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "Career Portfolio Pro Audit & Publishing Service",
    timestamp: new Date().toISOString(),
    strictSourceOfTruthEnforced: true,
  });
});

// Single file text extraction and validation
app.post("/api/extract-file", async (req: Request, res: Response) => {
  try {
    const { name, type, base64 } = req.body || {};
    if (!name || !base64) {
      res.status(400).json({ error: "Missing file payload." });
      return;
    }

    const buffer = Buffer.from(base64, "base64");
    if (buffer.length === 0) {
      res.status(400).json({ error: "I could not read this file. Please upload a clearer PDF, DOCX, TXT, JPG, or PNG file." });
      return;
    }

    const lowerName = (name || "").toLowerCase();
    const isImage = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png") || (type || "").startsWith("image/");
    const isPdf = lowerName.endsWith(".pdf") || type === "application/pdf";

    let extractedText = await extractDocumentText(name, type || "", buffer);

    // If it's an image or image-based PDF and text is empty, OCR via Gemini Vision
    if ((isImage || (isPdf && extractedText.trim().length < 20))) {
      try {
        const ai = getGeminiClient();
        const mime = isImage ? (type || "image/png") : "application/pdf";
        const visionResp = await callGeminiWithFallback(ai, {
          contents: [
            {
              inlineData: {
                mimeType: mime,
                data: base64,
              },
            },
            {
              text: "Transcribe all visible text from this professional profile document/screenshot verbatim. Do not interpret, summarize, or invent missing text.",
            },
          ],
        });
        const ocrText = visionResp?.text?.trim();
        if (ocrText && ocrText.length > 10) {
          extractedText = ocrText;
        }
      } catch (ocrErr: any) {
        console.warn("OCR fallback note:", ocrErr?.message);
      }
    }

    if (extractedText.trim().length < 5 && !isPdf && !isImage) {
      res.status(400).json({
        error: "I could not read this file. Please upload a clearer PDF, DOCX, TXT, JPG, or PNG file.",
      });
      return;
    }

    res.json({
      success: true,
      filename: name,
      extractedText: extractedText.trim(),
      charCount: extractedText.length,
    });
  } catch (err: any) {
    res.status(400).json({
      error: "I could not read this file. Please upload a clearer PDF, DOCX, TXT, JPG, or PNG file.",
    });
  }
});

// Inspect single profile URL endpoint for live preview/verification
app.post("/api/inspect-profile-url", async (req: Request, res: Response) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== "string" || !url.trim().startsWith("http")) {
      res.status(400).json({ error: "Please enter a valid URL starting with http:// or https://" });
      return;
    }

    const ai = getGeminiClient();
    const result = await fetchAndAnalyzeProfileUrl(ai, url.trim());
    res.json({ success: true, profileData: result });
  } catch (err: any) {
    console.error("Inspect profile URL error:", err);
    res.status(500).json({ error: err?.message || "Failed to inspect profile URL." });
  }
});

// Main Career Portfolio Pro Audit Endpoint
app.post("/api/analyze-portfolio", async (req: Request, res: Response) => {
  const payload: ComprehensiveInput = req.body;

  try {
    const { mode, uploadedFiles = [], pastedTexts = [], profileUrl, optionalProfileUrl, goals } = payload;
    const effectiveProfileUrl = (profileUrl || optionalProfileUrl || "").trim();

    // Strict Rule: At least one source must be present: uploaded document, pasted content, or profile URL
    const hasUpload = uploadedFiles.length > 0 && uploadedFiles.some((f) => (f.extractedText && f.extractedText.trim().length > 0) || f.base64);
    const hasPasted = pastedTexts.length > 0 && pastedTexts.some((p) => p.content && p.content.trim().length > 0);
    const hasProfileUrl = effectiveProfileUrl.length > 0;

    if (!hasUpload && !hasPasted && !hasProfileUrl) {
      res.status(400).json({
        error: "Please provide your profile URL, upload a document, or paste your profile content before starting the analysis.",
      });
      return;
    }

    const ai = getGeminiClient();

    // If profile URL was provided, fetch and inspect the profile live so the AI knows exactly what's on their profile
    let urlProfileResult: any = null;
    if (hasProfileUrl) {
      try {
        urlProfileResult = await fetchAndAnalyzeProfileUrl(ai, effectiveProfileUrl);
      } catch (urlErr) {
        console.warn("Failed to fetch profile URL content:", urlErr);
      }
    }

    // Build context strings from approved sources
    let sourcesListDescription = "";
    const inlineParts: any[] = [];

    // 1. Uploaded Documents
    if (uploadedFiles.length > 0) {
      sourcesListDescription += `\n### USER UPLOADED DOCUMENTS:\n`;
      for (const file of uploadedFiles) {
        sourcesListDescription += `\n--- Document: ${file.name} (Category: ${file.category}) ---\n`;
        if (file.extractedText) {
          sourcesListDescription += `${file.extractedText}\n`;
        } else if (file.base64 && file.type === "application/pdf") {
          inlineParts.push({
            inlineData: {
              mimeType: "application/pdf",
              data: file.base64,
            },
          });
        }
      }
    }

    // 2. Pasted Content
    if (pastedTexts.length > 0) {
      sourcesListDescription += `\n### USER PASTED CONTENT:\n`;
      for (const item of pastedTexts) {
        sourcesListDescription += `\n--- Pasted Item: ${item.title} (${item.category}) ---\n${item.content}\n`;
      }
    }

    // 3. User-Provided Profile URL (Inspected Live Content)
    if (hasProfileUrl) {
      sourcesListDescription += `\n### USER-PROVIDED PROFILE URL & LIVE INSPECTED CONTENT:\n`;
      sourcesListDescription += `URL: ${effectiveProfileUrl}\n`;
      if (urlProfileResult) {
        sourcesListDescription += `Platform: ${urlProfileResult.platform}\n`;
        sourcesListDescription += `Retrieval Status: ${urlProfileResult.fetchStatus} (${urlProfileResult.fetchNotes || ""})\n`;
        if (urlProfileResult.rawTextExcerpt) {
          sourcesListDescription += `Profile Content Extracted from URL:\n${urlProfileResult.rawTextExcerpt}\n`;
        }
      }
    }

    // Goal parameters
    const userGoalsDescription = `
User Goals & Context (Only use if explicitly relevant to position user's verified facts):
- Primary Goal: ${goals?.primaryGoal || "Improve professional credibility"}
${goals?.targetRole ? `- Target Role: ${goals.targetRole}` : ""}
${goals?.targetIndustry ? `- Target Industry: ${goals.targetIndustry}` : ""}
${goals?.targetAudience ? `- Target Audience: ${goals.targetAudience}` : ""}
${goals?.location ? `- Location: ${goals.location}` : ""}
${goals?.preferredTone ? `- Preferred Tone: ${goals.preferredTone}` : ""}
${goals?.brandOrCompany ? `- Brand or Company: ${goals.brandOrCompany}` : ""}
`;

    const systemInstruction = `You are the lead auditor and precision editor for "Career Portfolio Pro".
You operate under the following unbreakable policies:

==================================================
STRICT SOURCE-OF-TRUTH POLICY
==================================================
The AI must use only information from one of these approved sources:
1. The user-provided profile URL and its verified public content (LinkedIn, GitHub, Portfolio, Twitter, Instagram, etc.)
2. An uploaded document supplied by the user (CV, Resume, PDF, DOCX, Export)
3. Text manually pasted by the user
4. Information explicitly entered by the user during the current session

The AI MUST NOT use:
- Mock data
- Example profile data
- Fake names
- Fake companies
- Fake job titles
- Fake achievements
- Fake metrics
- Fake followers, likes, views, impressions
- Fake clients
- Fake projects
- Fake education
- Fake certifications
- Fake recommendations
- Guessed information
- Information from previous users
- Unrelated external search results

If a fact is not available from an approved source or the profile URL, write:
"Not provided by the provided profile URL or uploaded document."

Never invent missing information.
If a bullet point lacks measurable evidence, write: "No measurable result is included in the source document."

If two sources conflict, do not choose one automatically. Write:
"These sources contain conflicting information. Please confirm which version is accurate."
Never resolve conflicts by guessing.

Separate MODES:
1. ANALYSIS AND DRAFTING MODE (The current output)
2. CONNECTED ACCOUNT UPDATE MODE (Handled after explicit user approval)
The application must never confuse a draft recommendation with a published update.

PLATFORM CHARACTER CONSTRAINTS:
- LinkedIn Headline: max 220 chars
- LinkedIn About: max 2600 chars
- Instagram Display Name: max 30 chars
- Instagram Bio: max 150 chars
- Twitter Display Name: max 50 chars
- Twitter Bio: max 160 chars
- TikTok Display Name: max 30 chars
- TikTok Bio: max 80 chars
- GitHub Bio: max 160 chars

OUTPUT JSON SPECIFICATION:
Return valid JSON matching the exact required schema.`;

    const promptText = `Analyze and prepare copy-ready improvements for the provided profile sources adhering strictly to the Strict Source-of-Truth Policy:

${sourcesListDescription}
${userGoalsDescription}

Generate the comprehensive analysis and draft recommendations strictly based on these verified facts.`;

    const contents: any[] = [...inlineParts, { text: promptText }];

    const response = await callGeminiWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sourceIntegrity: {
              type: Type.OBJECT,
              properties: {
                statement: { type: Type.STRING },
                sourcesAnalyzed: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING },
                      platform: { type: Type.STRING },
                      status: { type: Type.STRING },
                      details: { type: Type.STRING },
                    },
                    required: ["name", "type", "status"],
                  },
                },
                sourcesNotAccessible: { type: Type.ARRAY, items: { type: Type.STRING } },
                sectionsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
                conflictingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["statement", "sourcesAnalyzed", "sectionsFound", "missingInformation", "conflictingInformation"],
            },
            executiveSummary: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.INTEGER },
                scoreDisclaimer: { type: Type.STRING },
                threeStrongestAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
                threePriorityImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
                verifiedPositioningStatement: { type: Type.STRING },
                mostImportantNextAction: { type: Type.STRING },
              },
              required: ["overallScore", "threeStrongestAreas", "threePriorityImprovements", "verifiedPositioningStatement", "mostImportantNextAction"],
            },
            sourceBySourceReviews: {
              type: Type.OBJECT,
              description: "Map of platform keys to platform reviews",
            },
            keep: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  element: { type: Type.STRING },
                  source: { type: Type.STRING },
                  justification: { type: Type.STRING },
                },
                required: ["element", "source", "justification"],
              },
            },
            improve: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  existingWording: { type: Type.STRING },
                  problem: { type: Type.STRING },
                  whyItMatters: { type: Type.STRING },
                  copyReadyImprovement: { type: Type.STRING },
                  sourceSupporting: { type: Type.STRING },
                },
                required: ["existingWording", "problem", "whyItMatters", "copyReadyImprovement", "sourceSupporting"],
              },
            },
            removeOrReplace: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  exactOriginalWording: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  replacementWording: { type: Type.STRING },
                  isFullySupported: { type: Type.BOOLEAN },
                },
                required: ["exactOriginalWording", "reason", "replacementWording", "isFullySupported"],
              },
            },
            consistencyReport: {
              type: Type.OBJECT,
              properties: {
                consistentInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
                inconsistentInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
                conflictingInformation: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      field: { type: Type.STRING },
                      sourceA: {
                        type: Type.OBJECT,
                        properties: { name: { type: Type.STRING }, claim: { type: Type.STRING } },
                        required: ["name", "claim"],
                      },
                      sourceB: {
                        type: Type.OBJECT,
                        properties: { name: { type: Type.STRING }, claim: { type: Type.STRING } },
                        required: ["name", "claim"],
                      },
                      statement: { type: Type.STRING },
                    },
                    required: ["field", "sourceA", "sourceB", "statement"],
                  },
                },
              },
              required: ["consistentInformation", "inconsistentInformation", "missingInformation", "conflictingInformation"],
            },
            drafts: {
              type: Type.OBJECT,
              description: "Drafts across supported platforms with character counts",
            },
            finalStatement: { type: Type.STRING },
          },
          required: [
            "sourceIntegrity",
            "executiveSummary",
            "sourceBySourceReviews",
            "keep",
            "improve",
            "removeOrReplace",
            "consistencyReport",
            "drafts",
            "finalStatement",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from AI model.");
    }

    const parsed = JSON.parse(text);

    // Enforce exact statement strings
    parsed.sourceIntegrity.statement =
      "This analysis uses only the uploaded documents, pasted content, user-provided information, and successfully connected official accounts. No mock data, external search data, guessed facts, or unverified information was used.";

    parsed.finalStatement =
      "Before publishing, verify every edited sentence against your real experience. This application does not add, confirm, or publish information that was not provided by you or retrieved through an authorized official account connection.";

    if (!parsed.executiveSummary.scoreDisclaimer) {
      parsed.executiveSummary.scoreDisclaimer =
        "This score evaluates writing quality, clarity, completeness, and presentation. It must not predict employment, business, or networking results.";
    }

    // Auto calculate character counts for drafts if missing
    if (parsed.drafts) {
      if (parsed.drafts.linkedin?.headline) {
        parsed.drafts.linkedin.headline.charCount = parsed.drafts.linkedin.headline.text?.length || 0;
        parsed.drafts.linkedin.headline.maxChars = 220;
      }
      if (parsed.drafts.linkedin?.about) {
        parsed.drafts.linkedin.about.charCount = parsed.drafts.linkedin.about.text?.length || 0;
        parsed.drafts.linkedin.about.maxChars = 2600;
      }
      if (parsed.drafts.instagram?.displayName) {
        parsed.drafts.instagram.displayName.charCount = parsed.drafts.instagram.displayName.text?.length || 0;
        parsed.drafts.instagram.displayName.maxChars = 30;
      }
      if (parsed.drafts.instagram?.bio) {
        parsed.drafts.instagram.bio.charCount = parsed.drafts.instagram.bio.text?.length || 0;
        parsed.drafts.instagram.bio.maxChars = 150;
      }
      if (parsed.drafts.twitter?.displayName) {
        parsed.drafts.twitter.displayName.charCount = parsed.drafts.twitter.displayName.text?.length || 0;
        parsed.drafts.twitter.displayName.maxChars = 50;
      }
      if (parsed.drafts.twitter?.bio) {
        parsed.drafts.twitter.bio.charCount = parsed.drafts.twitter.bio.text?.length || 0;
        parsed.drafts.twitter.bio.maxChars = 160;
      }
      if (parsed.drafts.tiktok?.displayName) {
        parsed.drafts.tiktok.displayName.charCount = parsed.drafts.tiktok.displayName.text?.length || 0;
        parsed.drafts.tiktok.displayName.maxChars = 30;
      }
      if (parsed.drafts.tiktok?.bio) {
        parsed.drafts.tiktok.bio.charCount = parsed.drafts.tiktok.bio.text?.length || 0;
        parsed.drafts.tiktok.bio.maxChars = 80;
      }
      if (parsed.drafts.github?.bio) {
        parsed.drafts.github.bio.charCount = parsed.drafts.github.bio.text?.length || 0;
        parsed.drafts.github.bio.maxChars = 160;
      }
    }

    const auditResult: CareerPortfolioAuditResult = {
      id: "audit_" + Date.now(),
      createdAt: new Date().toISOString(),
      ...parsed,
      markdownReport: "",
      plainTextReport: "",
    };

    auditResult.markdownReport = generateMarkdownReport(auditResult);
    auditResult.plainTextReport = generatePlainTextReport(auditResult);

    res.json(auditResult);
  } catch (err: any) {
    console.error("Analysis execution error:", err);
    res.status(500).json({
      error: err?.message || "Failed to generate portfolio audit. Please verify your uploaded sources and try again.",
    });
  }
});

// Mock OAuth/API connection status endpoint - Enforces real connection rules
app.post("/api/account-connect/:platform", async (req: Request, res: Response) => {
  const { platform } = req.params;

  // Rule: Do not show connected unless authorized
  // Return honest notice that direct automated update requires official OAuth token
  res.json({
    platform,
    status: "not_connected",
    notice: "This platform cannot be updated automatically through an authorized connection. You can upload or paste the profile content, and the application will prepare an exact copy-ready update for you.",
  });
});

// Vite & Static file handler
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Career Portfolio Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
