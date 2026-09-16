import { 
  db, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  orderBy 
} from "../lib/firebase";
import { SavedAnalysis, AuditReport, UserInput } from "../types";

export async function saveAnalysisToUser(
  userId: string,
  report: AuditReport,
  userInput: Partial<UserInput>
): Promise<SavedAnalysis> {
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const title = userInput.targetRole 
    ? `${userInput.targetRole} Analysis` 
    : (report.headlineRecommendations?.options?.[0] ? `Audit: ${report.headlineRecommendations.options[0].slice(0, 40)}...` : `Profile Audit (${new Date().toLocaleDateString()})`);

  const savedAnalysis: SavedAnalysis = {
    analysisId,
    userId,
    title,
    documentFilename: userInput.uploadedFileName || report.sourceIntegrity.documentFilename || "LinkedIn Profile Document",
    score: report.executiveSummary?.score ?? 0,
    profileUrl: userInput.profileUrl || "",
    targetRole: userInput.targetRole || "",
    targetGoal: userInput.targetGoal || "",
    targetIndustry: userInput.targetIndustry || "",
    report,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const analysisDocRef = doc(db, "users", userId, "savedAnalyses", analysisId);
  await setDoc(analysisDocRef, savedAnalysis);

  return savedAnalysis;
}

export async function getUserSavedAnalyses(userId: string): Promise<SavedAnalysis[]> {
  const collRef = collection(db, "users", userId, "savedAnalyses");
  const q = query(collRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const analyses: SavedAnalysis[] = [];
  snapshot.forEach((docSnap) => {
    analyses.push(docSnap.data() as SavedAnalysis);
  });
  return analyses;
}

export async function deleteUserSavedAnalysis(userId: string, analysisId: string): Promise<void> {
  const docRef = doc(db, "users", userId, "savedAnalyses", analysisId);
  await deleteDoc(docRef);
}
