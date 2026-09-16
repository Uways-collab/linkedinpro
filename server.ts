import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import {
  extractDocumentText,
  buildMarkdownReport,
  buildPlainTextReport,
  generateStrictHeuristicAudit,
} from "./server/documentAuditor";
import { AuditReport } from "./src/types";

const app = express();
const PORT = 3000;

// Body parser with 30mb limit for PDF/document uploads
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

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

// Model candidates in order of preference
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
      const response = await ai.models.generateContent({
        ...requestPayload,
        model,
      });
      return response;
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
    service: "LinkedIn Profile Pro Audit Service",
    timestamp: new Date().toISOString(),
    primarySourceOfTruth: "Uploaded document exclusively",
  });
});

// Document verification endpoint
app.post("/api/verify-document", async (req: Request, res: Response) => {
  try {
    const { uploadedFileName, uploadedFileType, uploadedFileBase64 } = req.body || {};

    if (!uploadedFileName || !uploadedFileBase64) {
      res.status(400).json({
        valid: false,
        error: "Please upload your LinkedIn profile document before starting the analysis. This application analyzes only the information contained in the uploaded document.",
      });
      return;
    }

    const buffer = Buffer.from(uploadedFileBase64, "base64");
    if (buffer.length === 0) {
      res.status(400).json({
        valid: false,
        error: "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile.",
      });
      return;
    }

    const extractedText = await extractDocumentText(
      uploadedFileName,
      uploadedFileType || "",
      buffer
    );

    const isPdf = /\.pdf$/i.test(uploadedFileName) || uploadedFileType === "application/pdf";
    const readable = extractedText.trim().length > 10 || isPdf;

    if (!readable) {
      res.status(400).json({
        valid: false,
        error: "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile.",
      });
      return;
    }

    const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;

    res.json({
      valid: true,
      filename: uploadedFileName,
      fileType: uploadedFileType || (isPdf ? "application/pdf" : "text/plain"),
      fileSize: buffer.length,
      wordCount,
      preview: extractedText.slice(0, 300),
      message: "Document successfully read and validated against the source-of-truth requirement.",
    });
  } catch (err: any) {
    res.status(400).json({
      valid: false,
      error: "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile.",
    });
  }
});

// Main Analysis Endpoint
app.post("/api/analyze-profile", async (req: Request, res: Response) => {
  const input = req.body || {};

  try {
    const {
      profileUrl,
      uploadedFileName,
      uploadedFileType,
      uploadedFileBase64,
      targetGoal,
      targetRole,
      targetIndustry,
    } = input;

    // STRICT RULE 1: If no document has been uploaded, do not generate an analysis.
    if (!uploadedFileName || !uploadedFileBase64) {
      res.status(400).json({
        error: "Please upload your LinkedIn profile document before starting the analysis. This application analyzes only the information contained in the uploaded document.",
      });
      return;
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(uploadedFileBase64, "base64");
      if (buffer.length === 0) {
        throw new Error("Empty buffer");
      }
    } catch {
      res.status(400).json({
        error: "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile.",
      });
      return;
    }

    // STRICT RULE 2: If the uploaded document cannot be read, display specific message
    const isPdf = /\.pdf$/i.test(uploadedFileName) || uploadedFileType === "application/pdf";
    const extractedFileText = await extractDocumentText(uploadedFileName, uploadedFileType || "", buffer);

    if (!isPdf && extractedFileText.trim().length < 5) {
      res.status(400).json({
        error: "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile.",
      });
      return;
    }

    const ai = getGeminiClient();

    // Prepare PDF inline part if it's a PDF
    let pdfInlinePart: { inlineData: { mimeType: string; data: string } } | null = null;
    if (isPdf) {
      pdfInlinePart = {
        inlineData: {
          mimeType: "application/pdf",
          data: uploadedFileBase64,
        },
      };
    }

    const systemInstruction = `You are the lead auditor for "LinkedIn Profile Pro".
You analyze an uploaded LinkedIn profile document with 100% adherence to the STRICT SOURCE-OF-TRUTH RULE:

STRICT SOURCE-OF-TRUTH RULE:
The uploaded document is the ONLY permitted source of information.
You must use exactly and only the information contained in the uploaded document. You MUST NOT use:
- Mock data
- Example data
- Placeholder facts presented as real facts
- External websites
- LinkedIn profile scraping
- Search engines
- Public LinkedIn profile information
- Information from the user's URL that is not present in the uploaded document
- Assumptions about the user
- Guessed job responsibilities
- Guessed achievements
- Guessed dates
- Guessed employers
- Guessed education
- Guessed certifications
- Guessed skills
- Guessed metrics
- Guessed clients, customers, users, revenue, results, or partnerships
- Any information from previous analyses or previous users

The uploaded document must be treated as the complete and authoritative profile record.
If a LinkedIn profile URL is provided, display it only as a reference. Do not open it, scrape it, analyze it, or use any information from it. The analysis must still be based exclusively on the uploaded document.

If the document is incomplete, analyze only the available information and clearly state what is missing. Never fill missing information with invented or sample content.

FACTUAL ACCURACY RULES:
Every factual statement in the analysis must be directly traceable to text in the uploaded document.
Before displaying any recommendation, classify it internally as one of the following:
1. "Directly supported by the document"
2. "A writing or formatting recommendation based on the document"
3. "Missing information that the user may optionally add later"

Only categories 1 and 2 may be written as current profile facts.
Category 3 must be clearly labeled as missing information. Do not present it as true.
For example, if the uploaded document does not contain a number of customers, never write "Managed 500 customers." Instead write: "No customer count is provided in the uploaded document. Add one only if it is accurate."
Do not create realistic-looking examples using the user's name, company, job title, or industry. Do not use fake sample achievements in the final analysis.

OUTPUT REQUIREMENTS:
Follow the exact sections requested:
1. sourceIntegrity: statement must be: "This analysis is based exclusively on the uploaded document. No external LinkedIn data, mock data, assumptions, or unverified information was used." Include documentFilename, documentType, whether successfully read, sections found, information not found.
2. executiveSummary: score (0-100 evaluating writing quality, clarity, completeness, presentation, not predicting employment or networking results), exactly 3 strengths supported by doc, exactly 3 improvement priorities, one concise positioning statement using only doc info, scoreDisclaimer: "This score evaluates writing quality, clarity, completeness, and presentation. It must not predict employment, business, or networking results."
3. factsFound: Name, Headline, Location, Contact information, About or Summary, Companies, Job titles, Dates, Locations, Skills, Certifications, Education, Other sections. If missing write: "Not provided in the uploaded document."
4. keep: List only elements that should remain because they are clear, relevant, or useful according to the document.
5. improve: For every recommendation include: existingWording, problemIdentified, whyItMatters, recommendedRevision, classification.
6. removeOrReplace: Exact wording from doc, reason, replacement wording (or "No replacement can be created without additional information from the user.")
7. headlineRecommendations: Up to 3 options using ONLY facts explicitly found in doc. If not enough info state: "The uploaded document does not contain enough verified information to create three distinct headline options."
8. rewrittenAbout: Copy-ready About using only info from doc. Do not add new achievements, metrics, responsibilities, or claims. Missing details listed as "Information not provided in the uploaded document."
9. experienceRewrites: For every role found: exact company name, exact job title, exact dates, copy-ready version rewriting only supported info, missingInformation listing details not included. Never invent missing details.
10. skillsReview: Skills explicitly present in document, skills unclear or need verification, notAvailableNotice: "No additional skills can be recommended unless they are supported by the uploaded document."
11. certificationReview: List only certifications shown. Missing issuer/date/credential: "Not provided in the uploaded document."
12. documentContentSuggestions: Up to 3 topics using only subjects, roles, skills, or experiences in document. Do not invent events, opinions, or achievements.
13. finalAccuracyChecklist: Verify Name, Job titles, Company names, Dates, Locations, Skills, Certifications, Contact details, Claims, Grammar edits, Any suggested wording.
14. finalResponseStatement: "Before publishing, verify every edited sentence against your real experience. This report does not add or confirm information that was not present in the uploaded document."`;

    const userPromptText = `Audit this uploaded LinkedIn profile document.

DOCUMENT METADATA:
- Filename: ${uploadedFileName}
- Type: ${uploadedFileType || "Document"}
${profileUrl ? `- LinkedIn Profile URL (REFERENCE ONLY - DO NOT SCRAPE OR USE FOR ANALYSIS): ${profileUrl}` : ""}
${targetGoal ? `- User's optimization target: ${targetGoal}` : ""}
${targetRole ? `- User's target role context: ${targetRole}` : ""}
${targetIndustry ? `- User's target industry context: ${targetIndustry}` : ""}

EXTRACTED DOCUMENT TEXT:
${extractedFileText || "(Attached as inline PDF document)"}

Perform the full audit with 100% adherence to the STRICT SOURCE-OF-TRUTH RULE.`;

    const contents: any[] = [];
    if (pdfInlinePart) {
      contents.push(pdfInlinePart);
    }
    contents.push({ text: userPromptText });

    const response = await callGeminiWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.1, // Zero creativity/hallucination
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sourceIntegrity: {
              type: Type.OBJECT,
              properties: {
                statement: { type: Type.STRING },
                documentFilename: { type: Type.STRING },
                documentType: { type: Type.STRING },
                successfullyRead: { type: Type.BOOLEAN },
                sectionsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
                informationNotFound: { type: Type.ARRAY, items: { type: Type.STRING } },
                profileUrlReference: { type: Type.STRING },
              },
              required: [
                "statement",
                "documentFilename",
                "documentType",
                "successfullyRead",
                "sectionsFound",
                "informationNotFound",
              ],
            },
            executiveSummary: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvementPriorities: { type: Type.ARRAY, items: { type: Type.STRING } },
                positioningStatement: { type: Type.STRING },
                scoreDisclaimer: { type: Type.STRING },
              },
              required: [
                "score",
                "strengths",
                "improvementPriorities",
                "positioningStatement",
                "scoreDisclaimer",
              ],
            },
            factsFound: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                headline: { type: Type.STRING },
                location: { type: Type.STRING },
                contactInformation: { type: Type.STRING },
                aboutOrSummary: { type: Type.STRING },
                companies: { type: Type.ARRAY, items: { type: Type.STRING } },
                jobTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
                dates: { type: Type.ARRAY, items: { type: Type.STRING } },
                locations: { type: Type.ARRAY, items: { type: Type.STRING } },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
                education: { type: Type.ARRAY, items: { type: Type.STRING } },
                otherSections: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                "name",
                "headline",
                "location",
                "contactInformation",
                "aboutOrSummary",
                "companies",
                "jobTitles",
                "dates",
                "locations",
                "skills",
                "certifications",
                "education",
                "otherSections",
              ],
            },
            keep: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  element: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["element", "explanation"],
              },
            },
            improve: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  existingWording: { type: Type.STRING },
                  problemIdentified: { type: Type.STRING },
                  whyItMatters: { type: Type.STRING },
                  recommendedRevision: { type: Type.STRING },
                  classification: { type: Type.STRING },
                },
                required: [
                  "existingWording",
                  "problemIdentified",
                  "whyItMatters",
                  "recommendedRevision",
                  "classification",
                ],
              },
            },
            removeOrReplace: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  exactWording: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  replacement: { type: Type.STRING },
                },
                required: ["exactWording", "reason", "replacement"],
              },
            },
            headlineRecommendations: {
              type: Type.OBJECT,
              properties: {
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                critique: { type: Type.STRING },
                insufficientDataNotice: { type: Type.STRING },
              },
              required: ["options"],
            },
            rewrittenAbout: {
              type: Type.OBJECT,
              properties: {
                copyReadyVersion: { type: Type.STRING },
                missingDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["copyReadyVersion", "missingDetails"],
            },
            experienceRewrites: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  companyName: { type: Type.STRING },
                  jobTitle: { type: Type.STRING },
                  dates: { type: Type.STRING },
                  copyReadyVersion: { type: Type.STRING },
                  missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  "companyName",
                  "jobTitle",
                  "dates",
                  "copyReadyVersion",
                  "missingInformation",
                ],
              },
            },
            skillsReview: {
              type: Type.OBJECT,
              properties: {
                explicitlyPresent: { type: Type.ARRAY, items: { type: Type.STRING } },
                unclearOrNeedVerification: { type: Type.ARRAY, items: { type: Type.STRING } },
                notAvailableNotice: { type: Type.STRING },
              },
              required: ["explicitlyPresent", "unclearOrNeedVerification", "notAvailableNotice"],
            },
            certificationReview: {
              type: Type.OBJECT,
              properties: {
                certifications: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      issuer: { type: Type.STRING },
                      date: { type: Type.STRING },
                      credentialId: { type: Type.STRING },
                    },
                    required: ["name", "issuer", "date", "credentialId"],
                  },
                },
                missingDetailsNote: { type: Type.STRING },
              },
              required: ["certifications"],
            },
            documentContentSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  sourceSubject: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                },
                required: ["topic", "sourceSubject", "reasoning"],
              },
            },
            finalAccuracyChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            finalResponseStatement: { type: Type.STRING },
          },
          required: [
            "sourceIntegrity",
            "executiveSummary",
            "factsFound",
            "keep",
            "improve",
            "removeOrReplace",
            "headlineRecommendations",
            "rewrittenAbout",
            "experienceRewrites",
            "skillsReview",
            "certificationReview",
            "documentContentSuggestions",
            "finalAccuracyChecklist",
            "finalResponseStatement",
          ],
        },
      },
    });

    let auditData: AuditReport | null = null;
    try {
      let rawText = response?.text || "{}";
      rawText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      auditData = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("Could not parse LLM response as JSON, falling back to strict heuristic audit:", parseErr);
      auditData = generateStrictHeuristicAudit(input, extractedFileText);
    }

    if (!auditData || !auditData.executiveSummary) {
      auditData = generateStrictHeuristicAudit(input, extractedFileText);
    }

    // Ensure sourceIntegrity document fields match actual upload
    auditData.sourceIntegrity.documentFilename = uploadedFileName;
    auditData.sourceIntegrity.documentType = uploadedFileType || (isPdf ? "PDF Document" : "Text Document");
    auditData.sourceIntegrity.successfullyRead = true;
    if (profileUrl) {
      auditData.sourceIntegrity.profileUrlReference = profileUrl;
    }

    // Generate markdown and plain text representations
    auditData.markdownReport = buildMarkdownReport(auditData);
    auditData.plainTextReport = buildPlainTextReport(auditData);

    res.json(auditData);
  } catch (err: any) {
    const errorDetail = typeof err === "object" ? (err?.message || JSON.stringify(err)) : String(err);
    console.warn("Upstream model saturated or error encountered. Generating strict heuristic audit fallback:", errorDetail.slice(0, 150));
    try {
      const extractedFileText = await extractDocumentText(
        input.uploadedFileName || "",
        input.uploadedFileType || "",
        Buffer.from(input.uploadedFileBase64 || "", "base64")
      );
      const fallbackAudit = generateStrictHeuristicAudit(input, extractedFileText);
      res.json(fallbackAudit);
    } catch (fallbackErr: any) {
      res.status(500).json({
        error: "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile.",
      });
    }
  }
});

// Start Express server and mount Vite
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
    console.log(`LinkedIn Profile Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
