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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseJsonConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseJsonConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseJsonConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseJsonConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseJsonConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseJsonConfig.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseJsonConfig.firestoreDatabaseId,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using firestoreDatabaseId from configuration
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

export async function checkUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === ADMIN_EMAIL) return true;
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
  maxBytes = 460000
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

export async function processImageFileForUpload(file: File, maxBytes = 460000): Promise<string> {
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
  writtenMediaSlots?: Record<string, string>
): Promise<string> {
  const val = rawValue?.trim() || '';
  const slotPath = `studioMedia/${slotId}`;

  if (val.startsWith('data:image/')) {
    const compressed = await compressDataUrlForFirestore(val, 680000);
    if (compressed.length > 880000) {
      throw new Error(`Uploaded image for ${slotId} is still too large after compression. Please choose a smaller file.`);
    }
    try {
      await setDoc(doc(db, 'studioMedia', slotId), {
        id: slotId,
        dataUrl: compressed,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, slotPath);
    }
    if (writtenMediaSlots) {
      writtenMediaSlots[slotId] = compressed;
    }
    return `${STUDIO_MEDIA_REF_PREFIX}${slotId}`;
  }

  // Only clean up media slot if value was explicitly cleared/replaced with a non-slot URL
  if (!val.startsWith(STUDIO_MEDIA_REF_PREFIX)) {
    try {
      await deleteDoc(doc(db, 'studioMedia', slotId));
    } catch {
      // Ignore cleanup failure when slot does not exist
    }
  }

  return val;
}

// Persistence Helper Functions for App State
export async function saveStudioConfigToFirebase(configData: {
  heroConfig: HeroConfig;
  sectionCopy: SectionCopyConfig;
  themeColors: ThemeColors;
  qualifierBullets: string[];
  galleryFilter: GalleryFilterMode;
  textAnimStyle: TextAnimStyle;
}): Promise<{ persistedHeroConfig: HeroConfig; writtenMediaSlots: Record<string, string> }> {
  const path = 'config/settings';
  const writtenMediaSlots: Record<string, string> = {};

  // Offload base64 Hero assets (logo, bg, portrait) into /studioMedia/{slotId}
  // so /config/settings stays compact regardless of uploaded image sizes.
  const [storedLogo, storedBg, storedPortrait] = await Promise.all([
    saveHeroMediaSlot('hero_logo', configData.heroConfig.logoImage, writtenMediaSlots),
    saveHeroMediaSlot('hero_bg', configData.heroConfig.bgImage, writtenMediaSlots),
    saveHeroMediaSlot('hero_portrait', configData.heroConfig.portraitImage, writtenMediaSlots),
  ]);

  const sanitizedHeroConfig = stripUndefinedDeep({
    ...configData.heroConfig,
    logoImage: storedLogo,
    bgImage: storedBg,
    portraitImage: storedPortrait,
  });

  const sanitizedBullets = configData.qualifierBullets
    .slice(0, 30)
    .map((b) => clampString(b, 300));

  const payload = {
    heroConfig: sanitizedHeroConfig,
    sectionCopy: stripUndefinedDeep(configData.sectionCopy),
    themeColors: stripUndefinedDeep(configData.themeColors),
    qualifierBullets: sanitizedBullets,
    galleryFilter: configData.galleryFilter,
    textAnimStyle: configData.textAnimStyle,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'config', 'settings'), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }

  return { persistedHeroConfig: sanitizedHeroConfig, writtenMediaSlots };
}

async function syncCollectionById<T extends { id: number }>(collectionName: string, items: T[]) {
  let existingSnap;
  try {
    existingSnap = await getDocs(collection(db, collectionName));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionName);
  }

  const nextIds = new Set(items.map((item) => String(item.id)));

  for (const existingDoc of existingSnap.docs) {
    if (!nextIds.has(existingDoc.id)) {
      try {
        await deleteDoc(doc(db, collectionName, existingDoc.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${existingDoc.id}`);
      }
    }
  }

  for (const item of items) {
    const cleanItem = stripUndefinedDeep(item);
    try {
      await setDoc(doc(db, collectionName, String(item.id)), cleanItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${String(item.id)}`);
    }
  }
}

export async function saveBlogPostsToFirebase(
  posts: BlogPost[]
): Promise<{ persistedPosts: BlogPost[]; writtenMediaSlots: Record<string, string> }> {
  const writtenMediaSlots: Record<string, string> = {};
  const prepared = await Promise.all(
    posts.map(async (post) => {
      const compressedImg = post.image?.startsWith('data:image/')
        ? await saveHeroMediaSlot(`blog_${post.id}_main`, post.image, writtenMediaSlots)
        : clampString(post.image, 880000);
      const rawExtras = Array.isArray(post.additionalImages)
        ? post.additionalImages.slice(0, 10)
        : [];
      const storedExtras = await Promise.all(
        rawExtras.map((imgUrl, idx) =>
          imgUrl?.startsWith('data:image/')
            ? saveHeroMediaSlot(`blog_${post.id}_extra_${idx}`, imgUrl, writtenMediaSlots)
            : Promise.resolve(clampString(imgUrl, 880000))
        )
      );
      return {
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
      };
    })
  );
  await syncCollectionById('blogPosts', prepared);
  return { persistedPosts: prepared, writtenMediaSlots };
}

export async function saveGalleryItemsToFirebase(
  items: GalleryItem[]
): Promise<{ persistedItems: GalleryItem[]; writtenMediaSlots: Record<string, string> }> {
  const writtenMediaSlots: Record<string, string> = {};
  const prepared = await Promise.all(
    items.map(async (item) => {
      const storedImg = item.image?.startsWith('data:image/')
        ? await saveHeroMediaSlot(`gallery_${item.id}_main`, item.image, writtenMediaSlots)
        : clampString(item.image, 880000);
      return {
        id: item.id,
        title: clampRequiredString(item.title, 160, 'STUDIO TILE'),
        subtitle: clampString(item.subtitle, 160, ''),
        image: storedImg,
        ...(item.imageStyle !== undefined ? { imageStyle: item.imageStyle } : {}),
        size: clampString(item.size, 100, 'col-span-1 row-span-1'),
        textPosition: clampString(item.textPosition, 40, 'bottom-left'),
      };
    })
  );
  await syncCollectionById('galleryItems', prepared);
  return { persistedItems: prepared, writtenMediaSlots };
}

export async function saveUltraProductsToFirebase(
  products: UltraProduct[]
): Promise<{ persistedProducts: UltraProduct[]; writtenMediaSlots: Record<string, string> }> {
  const writtenMediaSlots: Record<string, string> = {};
  const prepared = await Promise.all(
    products.map(async (prod) => {
      const storedMain = prod.image?.startsWith('data:image/')
        ? await saveHeroMediaSlot(`product_${prod.id}_main`, prod.image, writtenMediaSlots)
        : clampString(prod.image, 880000);

      const rawExtras = Array.isArray(prod.additionalImages)
        ? prod.additionalImages.slice(0, 10)
        : [];
      const storedExtras = await Promise.all(
        rawExtras.map((imgUrl, idx) =>
          imgUrl?.startsWith('data:image/')
            ? saveHeroMediaSlot(`product_${prod.id}_extra_${idx}`, imgUrl, writtenMediaSlots)
            : Promise.resolve(clampString(imgUrl, 880000))
        )
      );

      return {
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
      };
    })
  );
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
    await addDoc(bookingsCol, {
      name: clampRequiredString(bookingData.name, 120, 'Guest'),
      email: clampRequiredString(bookingData.email, 200, 'guest@example.com'),
      session: clampRequiredString(bookingData.session, 160, 'Private Session'),
      date: clampString(bookingData.date, 40),
      time: clampString(bookingData.time, 40),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}
