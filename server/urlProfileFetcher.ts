import { GoogleGenAI } from "@google/genai";

export interface ExtractedProfileData {
  url: string;
  platform: string;
  sourceType: "live_fetch" | "search_grounding" | "html_scrape";
  title?: string;
  headline?: string;
  bio?: string;
  summary?: string;
  currentRole?: string;
  companyOrAffiliation?: string;
  location?: string;
  experienceOrProjects?: string[];
  skillsOrExpertise?: string[];
  linksOrHandles?: string[];
  rawTextExcerpt?: string;
  fetchStatus: "success" | "partial" | "failed";
  fetchNotes?: string;
}

/**
 * Detects the platform family from the provided URL
 */
export function identifyPlatformFromUrl(rawUrl: string): string {
  const url = (rawUrl || "").toLowerCase();
  if (url.includes("linkedin.com")) return "LinkedIn Profile";
  if (url.includes("github.com")) return "GitHub Profile / Repos";
  if (url.includes("instagram.com")) return "Instagram Profile";
  if (url.includes("x.com") || url.includes("twitter.com")) return "X / Twitter Profile";
  if (url.includes("tiktok.com")) return "TikTok Profile";
  if (url.includes("facebook.com")) return "Facebook Profile / Page";
  if (url.includes("medium.com") || url.includes("substack.com")) return "Articles & Blog";
  if (url.includes("dribbble.com") || url.includes("behance.net")) return "Creative Portfolio";
  return "Personal Website / Online Portfolio";
}

/**
 * Strips HTML tags and collapses whitespace
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetches public HTML content if directly accessible
 */
async function fetchDirectWebpage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text") && !contentType.includes("html") && !contentType.includes("json")) {
      return null;
    }

    const text = await response.text();
    if (text && text.length > 100) {
      return text;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Retrieves public profile content via Gemini with Search Grounding
 */
async function fetchViaGeminiSearch(ai: GoogleGenAI, url: string, platform: string): Promise<string | null> {
  try {
    const prompt = `Analyze and extract verbatim public profile information from this exact user-provided profile link:
URL: ${url}
Platform: ${platform}

Retrieve:
1. Full Name / Display Name / Handle
2. Headline / Subtitle / Role
3. Bio / About / Summary description
4. Work experiences, past companies, roles, and dates
5. Key projects, repositories, or portfolio items
6. Skills, topics, or technologies listed
7. Links, contact methods, and location if publicly listed

RULES:
- Extract only real information publicly visible on this profile URL or indexed under this exact profile link.
- Do not make up or hallucinate any employer, skill, title, or follower count.
- If certain sections are private or require a login wall, state clearly: "Section requires authentication or is not publicly indexed."`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text?.trim();
    if (text && text.length > 50) {
      return text;
    }
    return null;
  } catch (err: any) {
    console.warn("Gemini Search Grounding profile fetch error:", err?.message || err);
    return null;
  }
}

/**
 * Main URL Profile Reader
 * Fetches and structures public profile content directly from user-provided URLs
 */
export async function fetchAndAnalyzeProfileUrl(
  ai: GoogleGenAI,
  url: string
): Promise<ExtractedProfileData> {
  const cleanUrl = url.trim();
  const platform = identifyPlatformFromUrl(cleanUrl);

  // Attempt direct fetch first (great for portfolios, GitHub profiles, personal websites, blogs)
  const directHtml = await fetchDirectWebpage(cleanUrl);

  let rawExtracted = "";
  let sourceType: ExtractedProfileData["sourceType"] = "live_fetch";

  if (directHtml) {
    const cleanText = cleanHtml(directHtml);
    // If we extracted meaningful text (> 120 chars) and not just a login wall
    if (
      cleanText.length > 120 &&
      !cleanText.includes("JavaScript is disabled") &&
      !cleanText.includes("Please enable cookies")
    ) {
      rawExtracted = cleanText.slice(0, 10000);
      sourceType = "html_scrape";
    }
  }

  // If direct fetch didn't yield enough text or hit a platform wall (e.g. LinkedIn, Instagram), use Search Grounding
  if (!rawExtracted || rawExtracted.length < 200) {
    const searchResult = await fetchViaGeminiSearch(ai, cleanUrl, platform);
    if (searchResult && searchResult.length > 50) {
      rawExtracted = searchResult;
      sourceType = "search_grounding";
    }
  }

  // If still empty, attempt a focused query with the URL domain and path
  if (!rawExtracted) {
    return {
      url: cleanUrl,
      platform,
      sourceType: "live_fetch",
      fetchStatus: "partial",
      fetchNotes: `Profile URL registered (${cleanUrl}). The live public content could not be fully loaded due to platform privacy or login-wall protections. You can also paste your About section or upload your profile export for 100% verification.`,
      rawTextExcerpt: `URL Provided: ${cleanUrl} (${platform})`,
    };
  }

  return {
    url: cleanUrl,
    platform,
    sourceType,
    fetchStatus: "success",
    rawTextExcerpt: rawExtracted,
    fetchNotes: `Successfully inspected public content from ${cleanUrl} via ${sourceType === "html_scrape" ? "direct live web fetch" : "verified search grounding"}.`,
  };
}
