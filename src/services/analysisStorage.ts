import { 
  db, 
  auth,
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  orderBy 
} from "../lib/firebase";
import { SavedPortfolioAudit, CareerPortfolioAuditResult, ComprehensiveInput } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveAnalysisToUser(
  userId: string,
  report: CareerPortfolioAuditResult,
  userInput?: Partial<ComprehensiveInput>
): Promise<SavedPortfolioAudit> {
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const title = userInput?.goals?.targetRole 
    ? `${userInput.goals.targetRole} Portfolio Audit` 
    : (report.executiveSummary?.verifiedPositioningStatement 
        ? `Audit: ${report.executiveSummary.verifiedPositioningStatement.slice(0, 40)}...` 
        : `Career Audit (${new Date().toLocaleDateString()})`);

  const savedAnalysis: SavedPortfolioAudit = {
    id: analysisId,
    userId,
    title,
    createdAt: new Date().toISOString(),
    overallScore: report.executiveSummary?.overallScore ?? 0,
    report,
  };

  const path = `users/${userId}/savedAnalyses/${analysisId}`;
  try {
    const analysisDocRef = doc(db, "users", userId, "savedAnalyses", analysisId);
    await setDoc(analysisDocRef, savedAnalysis);
    return savedAnalysis;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserSavedAnalyses(userId: string): Promise<SavedPortfolioAudit[]> {
  const path = `users/${userId}/savedAnalyses`;
  try {
    const collRef = collection(db, "users", userId, "savedAnalyses");
    const q = query(collRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const analyses: SavedPortfolioAudit[] = [];
    snapshot.forEach((docSnap) => {
      analyses.push(docSnap.data() as SavedPortfolioAudit);
    });
    return analyses;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteUserSavedAnalysis(userId: string, analysisId: string): Promise<void> {
  const path = `users/${userId}/savedAnalyses/${analysisId}`;
  try {
    const docRef = doc(db, "users", userId, "savedAnalyses", analysisId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
