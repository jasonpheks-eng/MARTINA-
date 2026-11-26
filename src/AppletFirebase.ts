import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseJsonConfig from '../firebase-applet-config.json';
import type {
  HeroConfig,
  SectionCopyConfig,
  ThemeColors,
  GalleryFilterMode,
  TextAnimStyle,
  BlogPost,
  GalleryItem,
  UltraProduct,
} from './studioFormat';

const rawEnvDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID?.trim();
const resolvedDatabaseId =
  rawEnvDatabaseId && rawEnvDatabaseId !== '(default)' && rawEnvDatabaseId !== 'default'
    ? rawEnvDatabaseId
    : (firebaseJsonConfig.firestoreDatabaseId || '(default)');

export const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || firebaseJsonConfig.apiKey || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseJsonConfig.authDomain || '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseJsonConfig.projectId || '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseJsonConfig.storageBucket || '').trim(),
  messagingSenderId: (
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseJsonConfig.messagingSenderId || ''
  ).trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || firebaseJsonConfig.appId || '').trim(),
  firestoreDatabaseId: resolvedDatabaseId,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using resolved firestoreDatabaseId from configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const ADMIN_EMAIL = 'jasonpheks@gmail.com';
export const STUDIO_MEDIA_REF_PREFIX = '__studioMedia__:';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection validation check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: the client is offline.');
    }
  }
}
void testConnection();

export const FIREBASE_CONSOLE_URLS = {
  authorizedDomains: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`,
  signInProviders: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`,
  firestoreData: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`,
  projectSettings: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/settings/general`,
};

export const VERCEL_ENV_CONFIG_SNIPPET = `VITE_FIREBASE_API_KEY=${firebaseConfig.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
VITE_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
VITE_FIREBASE_APP_ID=${firebaseConfig.appId}
VITE_FIREBASE_DATABASE_ID=${firebaseConfig.firestoreDatabaseId}`;

export interface FormattedFirebaseError {
  rawMessage: string;
  code: string;
  title: string;
  description: string;
  actionableStep: string;
  actionUrl?: string;
  targetDomain?: string;
}

export function formatFirebaseError(err: unknown): FormattedFirebaseError {
  let raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      raw = String(parsed.error);
    }
  } catch {
    // plain string
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (raw.includes('auth/unauthorized-domain')) {
    return {
      rawMessage: raw,
      code: 'auth/unauthorized-domain',
      title: 'Domain Not Authorized in Firebase',
      description: `Firebase Authentication does not allow sign-in from "${hostname}" until it is added to your project's Authorized domains list.`,
      actionableStep: `Open Firebase Console → Authentication → Settings → Authorized domains, click "Add domain", and enter "${hostname}".`,
      actionUrl: FIREBASE_CONSOLE_URLS.authorizedDomains,
      targetDomain: hostname,
    };
  }

  if (raw.includes('auth/operation-not-allowed')) {
    return {
      rawMessage: raw,
      code: 'auth/operation-not-allowed',
      title: 'Google Sign-In Provider Disabled',
      description: 'The Google Sign-In method is not currently enabled in your Firebase Authentication project.',
      actionableStep: `Go to Firebase Console → Authentication → Sign-in method, click Google, toggle Enable, select "${ADMIN_EMAIL}" as support email, and save.`,
      actionUrl: FIREBASE_CONSOLE_URLS.signInProviders,
    };
  }

  if (raw.includes('auth/popup-blocked')) {
    return {
      rawMessage: raw,
      code: 'auth/popup-blocked',
      title: 'Sign-In Popup Blocked',
      description: 'Your web browser prevented the Google Sign-In popup window from opening.',
      actionableStep: 'Click the popup blocker icon in your browser address bar, select "Always allow popups from this site", and retry.',
    };
  }

  if (raw.includes('auth/popup-closed-by-user')) {
    return {
      rawMessage: raw,
      code: 'auth/popup-closed-by-user',
      title: 'Sign-In Cancelled',
      description: 'The sign-in popup was closed before Google authentication could complete.',
      actionableStep: 'Click "Sign in with Google" again and select your account to proceed.',
    };
  }

  if (raw.includes('auth/invalid-api-key') || raw.includes('API key not valid')) {
    return {
      rawMessage: raw,
      code: 'auth/invalid-api-key',
      title: 'Invalid Firebase API Key',
      description: 'The Firebase API key supplied in your environment variables does not match the project.',
      actionableStep: `Ensure VITE_FIREBASE_API_KEY is set to "${firebaseConfig.apiKey}".`,
      actionUrl: FIREBASE_CONSOLE_URLS.projectSettings,
    };
  }

  if (raw.includes('permission-denied') || raw.includes('Missing or insufficient permissions')) {
    return {
      rawMessage: raw,
      code: 'permission-denied',
      title: 'Admin Permission Denied',
      description: 'Firestore security rules require administrative privileges to write studio updates.',
      actionableStep: `Make sure you are signed in with the authorized studio admin account: ${ADMIN_EMAIL}.`,
    };
  }

  if (raw.includes('the client is offline') || raw.includes('unavailable')) {
    return {
      rawMessage: raw,
      code: 'unavailable',
      title: 'Firebase Connection Offline',
      description: 'Unable to reach the Firestore database servers or network is unavailable.',
      actionableStep: 'Check internet connectivity and verify that your Vercel deployment has access to Firebase.',
    };
  }

  if (
    raw.includes('resource-exhausted') ||
    raw.includes('maximum bandwidth for writes') ||
    raw.includes('Quota exceeded')
  ) {
    return {
      rawMessage: raw,
      code: 'resource-exhausted',
      title: 'Firestore Write Bandwidth Temporarily Exceeded',
      description: 'Firestore has temporarily throttled write requests due to recent heavy write traffic.',
      actionableStep: 'Please wait 30–60 seconds and try saving again. Unchanged items and images are skipped automatically.',
    };
  }

  return {
    rawMessage: raw,
    code: 'unknown_error',
    title: 'Firebase Authentication Notice',
    description: raw,
    actionableStep: 'Verify your Firebase Console settings and Vercel environment variables.',
    actionUrl: FIREBASE_CONSOLE_URLS.projectSettings,
  };
}

export interface FirebaseDiagnosticReport {
  timestamp: string;
  projectId: string;
  databaseId: string;
  authDomain: string;
  currentHostname: string;
  isLocalhost: boolean;
  isFirebaseDefaultDomain: boolean;
  isVercelDomain: boolean;
  domainAuthorizedStatus: 'authorized_by_default' | 'requires_firebase_console_addition';
  firestoreConnected: boolean;
  firestoreLatencyMs: number;
  firestoreMessage: string;
  authReady: boolean;
  currentUserEmail: string | null;
  isAdmin: boolean;
  consoleUrls: typeof FIREBASE_CONSOLE_URLS;
  vercelEnvSnippet: string;
}

export async function runFirebaseDiagnostics(): Promise<FirebaseDiagnosticReport> {
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLocalhost =
    currentHostname === 'localhost' ||
    currentHostname === '127.0.0.1' ||
    currentHostname === '0.0.0.0' ||
    currentHostname.endsWith('.local');
  const isFirebaseDefaultDomain =
    currentHostname === firebaseConfig.authDomain ||
    currentHostname.endsWith('.firebaseapp.com') ||
    currentHostname.endsWith('.web.app');
  const isVercelDomain = currentHostname.endsWith('.vercel.app');

  const domainAuthorizedStatus =
    isLocalhost || isFirebaseDefaultDomain
      ? 'authorized_by_default'
      : 'requires_firebase_console_addition';

  const startTime = Date.now();
  let firestoreConnected = false;
  let firestoreMessage = '';

  try {
    // Attempt a direct server read of config/settings (which is public-readable in firestore.rules)
    const testDoc = await getDocFromServer(doc(db, 'config', 'settings'));
    firestoreConnected = true;
    firestoreMessage = testDoc.exists()
      ? 'Firestore database reachable & config document loaded successfully.'
      : 'Firestore database reachable (initial config placeholder active).';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Missing or insufficient permissions') || msg.includes('permission-denied')) {
      // If rules deny read, the database is still reachable and communicating with Firebase
      firestoreConnected = true;
      firestoreMessage = 'Firestore server reachable (validated by security rules).';
    } else {
      firestoreConnected = false;
      firestoreMessage = `Firestore connection error: ${msg}`;
    }
  }

  const firestoreLatencyMs = Date.now() - startTime;
  const currentUser = auth.currentUser;
  const isAdmin = await checkUserIsAdmin(currentUser);

  return {
    timestamp: new Date().toLocaleTimeString(),
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    authDomain: firebaseConfig.authDomain,
    currentHostname,
    isLocalhost,
    isFirebaseDefaultDomain,
    isVercelDomain,
    domainAuthorizedStatus,
    firestoreConnected,
    firestoreLatencyMs,
    firestoreMessage,
    authReady: true,
    currentUserEmail: currentUser?.email || null,
    isAdmin,
    consoleUrls: FIREBASE_CONSOLE_URLS,
    vercelEnvSnippet: VERCEL_ENV_CONFIG_SNIPPET,
  };
}

export async function checkUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  const userEmail = (user.email || user.providerData?.[0]?.email || '').trim().toLowerCase();
  if (userEmail === ADMIN_EMAIL.trim().toLowerCase()) return true;
  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export async function signInAdminWithGoogle(): Promise<{ user: User; isAdmin: boolean }> {
  const result = await signInWithPopup(auth, googleProvider);
  const isAdmin = await checkUserIsAdmin(result.user);
  return { user: result.user, isAdmin };
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export function subscribeAdminAuth(
  callback: (state: { user: User | null; isAdmin: boolean; ready: boolean }) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    const isAdmin = await checkUserIsAdmin(user);
    callback({ user, isAdmin, ready: true });
  });
}

function stripUndefinedDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canonicalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : canonicalizeValue(item)));
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      const val = record[key];
      if (val !== undefined) {
        sorted[key] = canonicalizeValue(val);
      }
    }
    return sorted;
  }
  return value;
}

function stableEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonicalizeValue(a)) === JSON.stringify(canonicalizeValue(b));
}

function isTransientWriteError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: unknown } | null)?.code;
  const codeStr = typeof code === 'string' ? code : '';
  return (
    codeStr === 'resource-exhausted' ||
    codeStr === 'unavailable' ||
    codeStr === 'aborted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('maximum bandwidth for writes') ||
    msg.includes('Too Many Requests')
  );
}

async function withFirestoreWriteRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 4
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err) {
      if (!isTransientWriteError(err) || attempt >= maxRetries) {
        throw err;
      }
      const delayMs = Math.min(16000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 450);
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function clampString(val: string | undefined, maxLen: number, fallback = ''): string {
  const str = typeof val === 'string' ? val : fallback;
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function clampRequiredString(val: string | undefined, maxLen: number, fallback: string): string {
  const trimmed = typeof val === 'string' ? val.trim() : '';
  const safe = trimmed.length > 0 ? val! : fallback;
  return safe.length > maxLen ? safe.slice(0, maxLen) : safe;
}

function detectCanvasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const sampleW = Math.min(width, 96);
    const sampleH = Math.min(height, 96);
    const stepX = Math.max(1, Math.floor(width / sampleW));
    const stepY = Math.max(1, Math.floor(height / sampleH));
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        if (data[(y * width + x) * 4 + 3] < 250) {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Compresses large image data URLs (including transparent PNG cutouts) into WebP or JPEG
 * so uploaded assets fit cleanly under Firestore's 1MB per-document limit across all browsers.
 */
export async function compressDataUrlForFirestore(
  dataUrl: string,
  maxBytes = 320000
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  if (dataUrl.startsWith('data:image/svg+xml') && dataUrl.length <= maxBytes) {
    return dataUrl;
  }
  if (dataUrl.length <= maxBytes) {
    return dataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const steps = [
        { maxDim: 1200, quality: 0.85 },
        { maxDim: 960, quality: 0.78 },
        { maxDim: 760, quality: 0.70 },
        { maxDim: 580, quality: 0.60 },
        { maxDim: 440, quality: 0.50 },
        { maxDim: 340, quality: 0.42 },
      ];

      let bestResult = '';
      for (const step of steps) {
        const natW = img.naturalWidth || img.width || 800;
        const natH = img.naturalHeight || img.height || 800;
        const largestSide = Math.max(natW, natH);
        const scale = largestSide > step.maxDim ? step.maxDim / largestSide : 1;
        const width = Math.max(1, Math.round(natW * scale));
        const height = Math.max(1, Math.round(natH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) break;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const hasAlpha = detectCanvasTransparency(ctx, width, height);
        const candidates: string[] = [];

        const webpCandidate = canvas.toDataURL('image/webp', step.quality);
        if (webpCandidate.startsWith('data:image/webp')) {
          candidates.push(webpCandidate);
        }

        if (!hasAlpha) {
          const jpgCanvas = document.createElement('canvas');
          jpgCanvas.width = width;
          jpgCanvas.height = height;
          const jpgCtx = jpgCanvas.getContext('2d');
          if (jpgCtx) {
            jpgCtx.fillStyle = '#000000';
            jpgCtx.fillRect(0, 0, width, height);
            jpgCtx.drawImage(img, 0, 0, width, height);
            candidates.push(jpgCanvas.toDataURL('image/jpeg', step.quality));
          }
        } else if (!webpCandidate.startsWith('data:image/webp')) {
          candidates.push(canvas.toDataURL('image/png'));
        }

        for (const candidate of candidates) {
          if (!bestResult || candidate.length < bestResult.length) {
            bestResult = candidate;
          }
          if (candidate.length <= maxBytes) {
            resolve(candidate);
            return;
          }
        }
      }

      if (bestResult && bestResult.length <= 880000) {
        resolve(bestResult);
      } else if (dataUrl.length <= 880000) {
        resolve(dataUrl);
      } else {
        reject(new Error('Image is too large even after compression. Please use a smaller photo.'));
      }
    };
    img.onerror = () =>
      reject(
        new Error('Could not decode this image file. Please try a JPG, PNG, or WebP photo.')
      );
    img.src = dataUrl;
  });
}

export async function processImageFileForUpload(file: File, maxBytes = 320000): Promise<string> {
  if (!file) {
    throw new Error('No file selected.');
  }
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.heic') || lowerName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
    throw new Error('HEIC photos are not directly supported in browsers. Please choose JPG, PNG, or WebP.');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string' && result.startsWith('data:')) {
        resolve(result);
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the selected file from your device.'));
    reader.readAsDataURL(file);
  });

  return compressDataUrlForFirestore(rawDataUrl, maxBytes);
}

function resolveSlotOrKeep(val: string | undefined, mediaMap: Record<string, string>, fallbackSlotId?: string): string {
  if (!val) return '';
  if (val.startsWith(STUDIO_MEDIA_REF_PREFIX)) {
    const slotId = val.slice(STUDIO_MEDIA_REF_PREFIX.length);
    return slotId in mediaMap ? mediaMap[slotId] : val;
  }
  if (fallbackSlotId && val === `${STUDIO_MEDIA_REF_PREFIX}${fallbackSlotId}`) {
    return fallbackSlotId in mediaMap ? mediaMap[fallbackSlotId] : val;
  }
  return val;
}

export function resolveHeroMediaFromMap(
  heroConfig: HeroConfig,
  mediaMap: Record<string, string>
): HeroConfig {
  return {
    ...heroConfig,
    logoImage: resolveSlotOrKeep(heroConfig.logoImage, mediaMap, 'hero_logo'),
    bgImage: resolveSlotOrKeep(heroConfig.bgImage, mediaMap, 'hero_bg'),
    portraitImage: resolveSlotOrKeep(heroConfig.portraitImage, mediaMap, 'hero_portrait'),
  };
}

export function resolveProductsMediaFromMap(
  products: UltraProduct[],
  mediaMap: Record<string, string>
): UltraProduct[] {
  return products.map((prod) => ({
    ...prod,
    image: prod.image ? resolveSlotOrKeep(prod.image, mediaMap) : '',
    ...(Array.isArray(prod.additionalImages)
      ? {
          additionalImages: prod.additionalImages
            .map((u) => resolveSlotOrKeep(u, mediaMap))
            .filter(Boolean),
        }
      : {}),
  }));
}

export function resolveBlogMediaFromMap(
  posts: BlogPost[],
  mediaMap: Record<string, string>
): BlogPost[] {
  return posts.map((post) => ({
    ...post,
    image: post.image ? resolveSlotOrKeep(post.image, mediaMap) : '',
    ...(Array.isArray(post.additionalImages)
      ? {
          additionalImages: post.additionalImages
            .map((u) => resolveSlotOrKeep(u, mediaMap))
            .filter(Boolean),
        }
      : {}),
  }));
}

export function resolveGalleryMediaFromMap(
  items: GalleryItem[],
  mediaMap: Record<string, string>
): GalleryItem[] {
  return items.map((item) => ({
    ...item,
    image: item.image ? resolveSlotOrKeep(item.image, mediaMap) : '',
  }));
}

async function saveHeroMediaSlot(
  slotId: string,
  rawValue: string | undefined,
  writtenMediaSlots?: Record<string, string>,
  existingMediaMap?: Record<string, string>
): Promise<string> {
  const val = rawValue?.trim() || '';
  const slotPath = `studioMedia/${slotId}`;

  if (val.startsWith('data:image/')) {
    const existingDataUrl = existingMediaMap?.[slotId];
    if (existingDataUrl && existingDataUrl === val) {
      return `${STUDIO_MEDIA_REF_PREFIX}${slotId}`;
    }

    const compressed = await compressDataUrlForFirestore(val, 380000);
    if (compressed.length > 880000) {
      throw new Error(`Uploaded image for ${slotId} is still too large after compression. Please choose a smaller file.`);
    }

    if (existingDataUrl && existingDataUrl === compressed) {
      return `${STUDIO_MEDIA_REF_PREFIX}${slotId}`;
    }

    try {
      await withFirestoreWriteRetry(() =>
        setDoc(doc(db, 'studioMedia', slotId), {
          id: slotId,
          dataUrl: compressed,
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, slotPath);
    }
    if (writtenMediaSlots) {
      writtenMediaSlots[slotId] = compressed;
    }
    return `${STUDIO_MEDIA_REF_PREFIX}${slotId}`;
  }

  // Only clean up media slot if it actually exists in studioMedia and was replaced/cleared
  if (!val.startsWith(STUDIO_MEDIA_REF_PREFIX) && existingMediaMap && slotId in existingMediaMap) {
    try {
      await withFirestoreWriteRetry(() => deleteDoc(doc(db, 'studioMedia', slotId)));
    } catch {
      // Ignore cleanup failure when slot does not exist
    }
  }

  return val;
}

// Persistence Helper Functions for App State
export async function saveStudioConfigToFirebase(
  configData: {
    heroConfig: HeroConfig;
    sectionCopy: SectionCopyConfig;
    themeColors: ThemeColors;
    qualifierBullets: string[];
    galleryFilter: GalleryFilterMode;
    textAnimStyle: TextAnimStyle;
  },
  existingMediaMap?: Record<string, string>,
  previousRawConfig?: Record<string, unknown> | null
): Promise<{
  persistedHeroConfig: HeroConfig;
  persistedConfigBody: Record<string, unknown>;
  writtenMediaSlots: Record<string, string>;
}> {
  const path = 'config/settings';
  const writtenMediaSlots: Record<string, string> = {};

  // Offload base64 Hero assets sequentially into /studioMedia/{slotId} only when changed
  const storedLogo = await saveHeroMediaSlot(
    'hero_logo',
    configData.heroConfig.logoImage,
    writtenMediaSlots,
    existingMediaMap
  );
  const storedBg = await saveHeroMediaSlot(
    'hero_bg',
    configData.heroConfig.bgImage,
    writtenMediaSlots,
    existingMediaMap
  );
  const storedPortrait = await saveHeroMediaSlot(
    'hero_portrait',
    configData.heroConfig.portraitImage,
    writtenMediaSlots,
    existingMediaMap
  );

  const sanitizedHeroConfig = stripUndefinedDeep({
    ...configData.heroConfig,
    logoImage: storedLogo,
    bgImage: storedBg,
    portraitImage: storedPortrait,
  });

  const sanitizedBullets = configData.qualifierBullets
    .slice(0, 30)
    .map((b) => clampString(b, 300));

  const persistedConfigBody = {
    heroConfig: sanitizedHeroConfig,
    sectionCopy: stripUndefinedDeep(configData.sectionCopy),
    themeColors: stripUndefinedDeep(configData.themeColors),
    qualifierBullets: sanitizedBullets,
    galleryFilter: configData.galleryFilter,
    textAnimStyle: configData.textAnimStyle,
  };

  let previousComparable: Record<string, unknown> | null = null;
  if (previousRawConfig) {
    const { updatedAt: _ignoredUpdatedAt, ...rest } = previousRawConfig;
    previousComparable = rest;
  }

  if (!previousComparable || !stableEqual(previousComparable, persistedConfigBody)) {
    const payload = {
      ...persistedConfigBody,
      updatedAt: serverTimestamp(),
    };

    try {
      await withFirestoreWriteRetry(() => setDoc(doc(db, 'config', 'settings'), payload));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  return {
    persistedHeroConfig: sanitizedHeroConfig,
    persistedConfigBody,
    writtenMediaSlots,
  };
}

async function syncCollectionById<T extends { id: number }>(collectionName: string, items: T[]) {
  let existingSnap;
  try {
    existingSnap = await getDocs(collection(db, collectionName));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionName);
  }

  const nextIds = new Set(items.map((item) => String(item.id)));
  const existingDataById = new Map<string, unknown>();

  for (const existingDoc of existingSnap.docs) {
    if (!nextIds.has(existingDoc.id)) {
      try {
        await withFirestoreWriteRetry(() => deleteDoc(doc(db, collectionName, existingDoc.id)));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${existingDoc.id}`);
      }
    } else {
      existingDataById.set(existingDoc.id, existingDoc.data());
    }
  }

  for (const item of items) {
    const docId = String(item.id);
    const cleanItem = stripUndefinedDeep(item);
    const prevData = existingDataById.get(docId);
    if (prevData !== undefined && stableEqual(prevData, cleanItem)) {
      continue;
    }
    try {
      await withFirestoreWriteRetry(() => setDoc(doc(db, collectionName, docId), cleanItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  }
}

export async function saveBlogPostsToFirebase(
  posts: BlogPost[],
  existingMediaMap?: Record<string, string>
): Promise<{ persistedPosts: BlogPost[]; writtenMediaSlots: Record<string, string> }> {
  const writtenMediaSlots: Record<string, string> = {};
  const prepared: BlogPost[] = [];

  for (const post of posts) {
    const compressedImg = post.image?.startsWith('data:image/')
      ? await saveHeroMediaSlot(`blog_${post.id}_main`, post.image, writtenMediaSlots, existingMediaMap)
      : clampString(post.image, 880000);

    const rawExtras = Array.isArray(post.additionalImages)
      ? post.additionalImages.slice(0, 10)
      : [];
    const storedExtras: string[] = [];
    for (let idx = 0; idx < rawExtras.length; idx += 1) {
      const imgUrl = rawExtras[idx];
      if (imgUrl?.startsWith('data:image/')) {
        storedExtras.push(
          await saveHeroMediaSlot(
            `blog_${post.id}_extra_${idx}`,
            imgUrl,
            writtenMediaSlots,
            existingMediaMap
          )
        );
      } else {
        storedExtras.push(clampString(imgUrl, 880000));
      }
    }

    prepared.push({
      id: post.id,
      title: clampRequiredString(post.title, 240, 'Untitled Article'),
      ...(post.subtitle !== undefined ? { subtitle: clampString(post.subtitle, 300) } : {}),
      excerpt: clampString(post.excerpt, 1000, ''),
      ...(post.content !== undefined ? { content: clampString(post.content, 50000) } : {}),
      date: clampString(post.date, 64, ''),
      category: clampRequiredString(post.category, 100, 'Studio Notes'),
      image: compressedImg,
      ...(storedExtras.length > 0 ? { additionalImages: storedExtras } : {}),
      ...(post.imageStyle !== undefined ? { imageStyle: post.imageStyle } : {}),
      ...(post.author !== undefined ? { author: clampString(post.author, 120) } : {}),
      ...(post.readTime !== undefined ? { readTime: clampString(post.readTime, 40) } : {}),
      ...(post.featured !== undefined ? { featured: Boolean(post.featured) } : {}),
      ...(post.status !== undefined
        ? { status: post.status === 'draft' ? ('draft' as const) : ('published' as const) }
        : {}),
      ...(post.takeaways !== undefined
        ? { takeaways: post.takeaways.slice(0, 20).map((t) => clampString(t, 400)) }
        : {}),
      ...(post.pillarId !== undefined ? { pillarId: clampString(post.pillarId, 40) } : {}),
      ...(post.pillarIcon !== undefined ? { pillarIcon: clampString(post.pillarIcon, 40) } : {}),
      ...(post.pillarMeaning !== undefined
        ? { pillarMeaning: clampString(post.pillarMeaning, 400) }
        : {}),
    });
  }

  await syncCollectionById('blogPosts', prepared);
  return { persistedPosts: prepared, writtenMediaSlots };
}

export async function saveGalleryItemsToFirebase(
  items: GalleryItem[],
  existingMediaMap?: Record<string, string>
): Promise<{ persistedItems: GalleryItem[]; writtenMediaSlots: Record<string, string> }> {
  const writtenMediaSlots: Record<string, string> = {};
  const prepared: GalleryItem[] = [];

  for (const item of items) {
    const storedImg = item.image?.startsWith('data:image/')
      ? await saveHeroMediaSlot(`gallery_${item.id}_main`, item.image, writtenMediaSlots, existingMediaMap)
      : clampString(item.image, 880000);
    prepared.push({
      id: item.id,
      title: clampRequiredString(item.title, 160, 'STUDIO TILE'),
      subtitle: clampString(item.subtitle, 160, ''),
      image: storedImg,
      ...(item.imageStyle !== undefined ? { imageStyle: item.imageStyle } : {}),
      size: clampString(item.size, 100, 'col-span-1 row-span-1'),
      textPosition: clampString(item.textPosition, 40, 'bottom-left'),
    });
  }

  await syncCollectionById('galleryItems', prepared);
  return { persistedItems: prepared, writtenMediaSlots };
}

export async function saveUltraProductsToFirebase(
  products: UltraProduct[],
  existingMediaMap?: Record<string, string>
): Promise<{ persistedProducts: UltraProduct[]; writtenMediaSlots: Record<string, string> }> {
  const writtenMediaSlots: Record<string, string> = {};
  const prepared: UltraProduct[] = [];

  for (const prod of products) {
    const storedMain = prod.image?.startsWith('data:image/')
      ? await saveHeroMediaSlot(`product_${prod.id}_main`, prod.image, writtenMediaSlots, existingMediaMap)
      : clampString(prod.image, 880000);

    const rawExtras = Array.isArray(prod.additionalImages)
      ? prod.additionalImages.slice(0, 10)
      : [];
    const storedExtras: string[] = [];
    for (let idx = 0; idx < rawExtras.length; idx += 1) {
      const imgUrl = rawExtras[idx];
      if (imgUrl?.startsWith('data:image/')) {
        storedExtras.push(
          await saveHeroMediaSlot(
            `product_${prod.id}_extra_${idx}`,
            imgUrl,
            writtenMediaSlots,
            existingMediaMap
          )
        );
      } else {
        storedExtras.push(clampString(imgUrl, 880000));
      }
    }

    prepared.push({
      id: prod.id,
      title: clampRequiredString(prod.title, 160, 'Studio Product'),
      price: Number.isFinite(prod.price) ? Math.max(0, Math.min(100000, prod.price)) : 0,
      image: storedMain,
      ...(storedExtras.length > 0 ? { additionalImages: storedExtras } : {}),
      ...(prod.imageStyle !== undefined ? { imageStyle: prod.imageStyle } : {}),
      category: clampString(prod.category, 80, 'Studio Gear'),
      ...(prod.description !== undefined
        ? { description: clampString(prod.description, 1000) }
        : {}),
    });
  }

  await syncCollectionById('ultraProducts', prepared);
  return { persistedProducts: prepared, writtenMediaSlots };
}

export async function saveBookingToFirebase(bookingData: {
  name: string;
  email: string;
  session: string;
  date: string;
  time: string;
}) {
  const path = 'consultationBookings';
  try {
    const bookingsCol = collection(db, path);
    await withFirestoreWriteRetry(() =>
      addDoc(bookingsCol, {
        name: clampRequiredString(bookingData.name, 120, 'Guest'),
        email: clampRequiredString(bookingData.email, 200, 'guest@example.com'),
        session: clampRequiredString(bookingData.session, 160, 'Private Session'),
        date: clampString(bookingData.date, 40),
        time: clampString(bookingData.time, 40),
        createdAt: serverTimestamp(),
      })
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}
