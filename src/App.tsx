import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Calendar,
  Clock,
  User,
  Mail,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Settings,
  Image as ImageIcon,
  FileText,
  Palette,
  Plus,
  Minus,
  Trash2,
  Sliders,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Upload,
  ShoppingBag,
  Eye,
  Save,
  Code2,
  Copy,
  Download,
  Eraser,
  Cloud,
  LogIn,
  LogOut,
  AlertCircle,
  Lock,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Server,
  Globe,
  Key,
  AlertTriangle,
} from 'lucide-react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  db,
  ADMIN_EMAIL,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeAdminAuth,
  resolveHeroMediaFromMap,
  resolveProductsMediaFromMap,
  resolveBlogMediaFromMap,
  resolveGalleryMediaFromMap,
  processImageFileForUpload,
  saveStudioConfigToFirebase,
  saveBlogPostsToFirebase,
  saveGalleryItemsToFirebase,
  saveUltraProductsToFirebase,
  saveBookingToFirebase,
  firebaseConfig,
  FIREBASE_CONSOLE_URLS,
  VERCEL_ENV_CONFIG_SNIPPET,
  formatFirebaseError,
  runFirebaseDiagnostics,
  type FormattedFirebaseError,
  type FirebaseDiagnosticReport,
} from './AppletFirebase';
import {
  DEFAULT_SECTION_COPY,
  DEFAULT_STUDIO_FORMAT,
  WELLNESS_PILLARS,
  formatUltraPrice,
  generateStudioFormatCode,
  getImageStyleProps,
  migrateLegacyBlogPosts,
  migrateLegacyGalleryItems,
  migrateSectionCopy,
  migrateUltraProducts,
  resolveImageBgColor,
  BG_IMAGE_URL,
  REFERENCE_IMAGE_PATH,
  type BlogPost,
  type GalleryFilterMode,
  type GalleryItem,
  type HeroConfig,
  type SectionCopyConfig,
  type StudioFormatSnapshot,
  type TextAnimStyle,
  type ThemeColors,
  type UltraProduct,
  type WellnessPillarMeta,
} from './studioFormat';
import { JournalSection } from './components/JournalSection';
import { BlogAdminEditor } from './components/BlogAdminEditor';
import { getPillarIconComponent, resolvePostPillar } from './components/PillarIcons';
import { BackgroundRemoverModal } from './components/BackgroundRemoverModal';
import { ImageStyleControls } from './components/ImageStyleControls';

const LOCAL_FORMAT_STORAGE_KEY = 'hot_core_studio_format_v1';

function readStoredFormat(): Partial<StudioFormatSnapshot> {
  try {
    const raw = localStorage.getItem(LOCAL_FORMAT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<StudioFormatSnapshot>) : {};
  } catch {
    return {};
  }
}

function writeStoredFormat(patch: Partial<StudioFormatSnapshot>) {
  try {
    const existing = readStoredFormat();
    localStorage.setItem(LOCAL_FORMAT_STORAGE_KEY, JSON.stringify({ ...existing, ...patch }));
  } catch {
    try {
      localStorage.removeItem(LOCAL_FORMAT_STORAGE_KEY);
    } catch {
      // Ignore storage access errors
    }
  }
}

const NAV_LINKS = [
  { label: 'Wellness', href: '#transformations' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Journal', href: '#blog' },
  { label: 'Collection', href: '#ultra-collection' },
] as const;
const SOCIAL_LINKS = ['Instagram', 'TikTok', 'YouTube'] as const;

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.49 0 .14 5.35.14 11.92c0 2.1.55 4.15 1.59 5.96L0 24l6.29-1.65a11.87 11.87 0 0 0 5.77 1.47h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.47-8.42ZM12.06 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.73.98 1-3.64-.24-.37a9.84 9.84 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState('Reformer 1:1 Elite Container');
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '2026-11-18',
    time: '10:00 AM',
    goals: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Wellness Journey Node Detail Modal State
  const [selectedNode, setSelectedNode] = useState<WellnessPillarMeta | null>(null);

  // Active App Configuration (Hydrated from localStorage fallback / DEFAULT_STUDIO_FORMAT, then synced from Firebase)
  const [initialCache] = useState<Partial<StudioFormatSnapshot>>(() => readStoredFormat());
  const [heroConfig, setHeroConfig] = useState<HeroConfig>({
    ...DEFAULT_STUDIO_FORMAT.heroConfig,
    ...(initialCache.heroConfig || {}),
    portraitImage: initialCache.heroConfig?.portraitImage?.trim()
      ? initialCache.heroConfig.portraitImage
      : DEFAULT_STUDIO_FORMAT.heroConfig.portraitImage,
  });
  const [sectionCopy, setSectionCopy] = useState<SectionCopyConfig>(
    () => migrateSectionCopy(initialCache.sectionCopy)
  );
  const [qualifierBullets, setQualifierBullets] = useState<string[]>(
    initialCache.qualifierBullets || DEFAULT_STUDIO_FORMAT.qualifierBullets
  );
  const [themeColors, setThemeColors] = useState<ThemeColors>(
    initialCache.themeColors || DEFAULT_STUDIO_FORMAT.themeColors
  );

  const [ultraProducts, setUltraProducts] = useState<UltraProduct[]>(
    () => migrateUltraProducts(initialCache.ultraProducts)
  );
  const [selectedProduct, setSelectedProduct] = useState<UltraProduct | null>(null);
  const [activeProductImageIdx, setActiveProductImageIdx] = useState(0);
  const [productQty, setProductQty] = useState(1);
  const [isProductCheckoutStep, setIsProductCheckoutStep] = useState(false);
  const [checkoutCustomer, setCheckoutCustomer] = useState({ name: '', contact: '', note: '' });
  const [isProductOrderConfirmed, setIsProductOrderConfirmed] = useState(false);

  // Ultra Collection Horizontal Rail State & Handlers
  const ultraRailRef = useRef<HTMLDivElement | null>(null);
  const [ultraRailScrollPct, setUltraRailScrollPct] = useState(0);
  const [activeUltraSlideIdx, setActiveUltraSlideIdx] = useState(0);
  const [isDraggingUltraRail, setIsDraggingUltraRail] = useState(false);
  const ultraDragStateRef = useRef<{ active: boolean; startX: number; scrollLeft: number; moved: boolean }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const handleUltraRailScroll = () => {
    const el = ultraRailRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setUltraRailScrollPct(0);
      setActiveUltraSlideIdx(0);
      return;
    }
    const pct = Math.max(0, Math.min(100, (el.scrollLeft / maxScroll) * 100));
    setUltraRailScrollPct(pct);

    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
      setActiveUltraSlideIdx(Math.max(0, ultraProducts.length - 1));
      return;
    }

    const paddingLeft = parseFloat(window.getComputedStyle(el).paddingLeft || '0') || 0;
    const railLeft = el.getBoundingClientRect().left + paddingLeft;
    let closestIdx = 0;
    let minDistance = Number.POSITIVE_INFINITY;
    Array.from(el.children).forEach((child, idx) => {
      const dist = Math.abs((child as HTMLElement).getBoundingClientRect().left - railLeft);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });
    setActiveUltraSlideIdx(closestIdx);
  };

  const scrollToUltraSlide = (targetIdx: number) => {
    const el = ultraRailRef.current;
    if (!el) return;
    const clampedIdx = Math.max(0, Math.min(ultraProducts.length - 1, targetIdx));
    const child = el.children[clampedIdx] as HTMLElement | undefined;
    if (child) {
      const paddingLeft = parseFloat(window.getComputedStyle(el).paddingLeft || '0') || 0;
      const targetLeft =
        clampedIdx === 0
          ? 0
          : child.getBoundingClientRect().left -
            el.getBoundingClientRect().left +
            el.scrollLeft -
            paddingLeft;
      el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      setActiveUltraSlideIdx(clampedIdx);
    }
  };

  const scrollUltraRailByDirection = (direction: -1 | 1) => {
    const el = ultraRailRef.current;
    if (!el) return;
    const nextIdx = activeUltraSlideIdx + direction;
    if (nextIdx >= 0 && nextIdx < ultraProducts.length) {
      scrollToUltraSlide(nextIdx);
      return;
    }
    const step = Math.max(280, Math.round(el.clientWidth * 0.78));
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const handleUltraRailMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !ultraRailRef.current) return;
    ultraDragStateRef.current = {
      active: true,
      startX: e.pageX - ultraRailRef.current.offsetLeft,
      scrollLeft: ultraRailRef.current.scrollLeft,
      moved: false,
    };
    setIsDraggingUltraRail(true);
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!ultraDragStateRef.current.active || !ultraRailRef.current) return;
      const x = e.pageX - ultraRailRef.current.offsetLeft;
      const delta = x - ultraDragStateRef.current.startX;
      if (Math.abs(delta) > 6) {
        ultraDragStateRef.current.moved = true;
      }
      ultraRailRef.current.scrollLeft = ultraDragStateRef.current.scrollLeft - delta;
    };

    const handleWindowMouseUp = () => {
      if (!ultraDragStateRef.current.active) return;
      ultraDragStateRef.current.active = false;
      setIsDraggingUltraRail(false);
      window.setTimeout(() => {
        ultraDragStateRef.current.moved = false;
      }, 60);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  const [galleryFilter, setGalleryFilter] = useState<GalleryFilterMode>(
    initialCache.galleryFilter || DEFAULT_STUDIO_FORMAT.galleryFilter
  );
  const [textAnimStyle, setTextAnimStyle] = useState<TextAnimStyle>(
    initialCache.textAnimStyle || DEFAULT_STUDIO_FORMAT.textAnimStyle
  );

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(
    () => migrateLegacyGalleryItems(initialCache.galleryItems)
  );

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(
    () => migrateLegacyBlogPosts(initialCache.blogPosts)
  );
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Admin Auth & Cloud Sync States
  const [adminUser, setAdminUser] = useState<FirebaseUser | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // Admin Modal & Staging Draft States
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'hero' | 'copy' | 'blog' | 'gallery' | 'products' | 'colors' | 'code' | 'firebase'>('hero');
  const [saveToast, setSaveToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [authErrorDetail, setAuthErrorDetail] = useState<FormattedFirebaseError | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<FirebaseDiagnosticReport | null>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [envCopied, setEnvCopied] = useState(false);
  const [domainCopied, setDomainCopied] = useState(false);
  const [bgRemoverTarget, setBgRemoverTarget] = useState<{
    image: string;
    label: string;
    onApply: (url: string) => void;
  } | null>(null);

  // Refs to keep raw media references & loaded /studioMedia slots synchronized regardless of snapshot order
  const rawHeroConfigRef = useRef<HeroConfig>(heroConfig);
  const rawProductsRef = useRef<UltraProduct[]>(ultraProducts);
  const rawBlogPostsRef = useRef<BlogPost[]>(blogPosts);
  const rawGalleryItemsRef = useRef<GalleryItem[]>(galleryItems);
  const studioMediaMapRef = useRef<Record<string, string>>({});

  // Draft States (modified locally inside Admin Studio prior to pressing SAVE)
  const [draftHeroConfig, setDraftHeroConfig] = useState(heroConfig);
  const [draftSectionCopy, setDraftSectionCopy] = useState(sectionCopy);
  const [draftQualifierBullets, setDraftQualifierBullets] = useState(qualifierBullets);
  const [draftThemeColors, setDraftThemeColors] = useState(themeColors);
  const [draftBlogPosts, setDraftBlogPosts] = useState(blogPosts);
  const [draftGalleryItems, setDraftGalleryItems] = useState(galleryItems);
  const [draftUltraProducts, setDraftUltraProducts] = useState(ultraProducts);
  const [draftGalleryFilter, setDraftGalleryFilter] = useState(galleryFilter);
  const [draftTextAnimStyle, setDraftTextAnimStyle] = useState(textAnimStyle);

  const showToast = (type: 'success' | 'error', message: string, durationMs = 3600) => {
    setSaveToast({ type, message });
    window.setTimeout(() => {
      setSaveToast((curr) => (curr?.message === message ? null : curr));
    }, durationMs);
  };

  // Admin Password Protection State ('ultra1234')
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sync draft states when opening Admin Studio
  const handleOpenAdmin = () => {
    setDraftHeroConfig({ ...DEFAULT_STUDIO_FORMAT.heroConfig, ...heroConfig });
    setDraftSectionCopy({ ...DEFAULT_SECTION_COPY, ...sectionCopy });
    setDraftQualifierBullets([...qualifierBullets]);
    setDraftThemeColors({ ...themeColors });
    setDraftBlogPosts(JSON.parse(JSON.stringify(blogPosts)));
    setDraftGalleryItems(JSON.parse(JSON.stringify(galleryItems)));
    setDraftUltraProducts(JSON.parse(JSON.stringify(ultraProducts)));
    setDraftGalleryFilter(galleryFilter);
    setDraftTextAnimStyle(textAnimStyle);
    setIsAdminOpen(true);
  };

  const handleAdminAccessClick = () => {
    if (isAdminUnlocked) {
      handleOpenAdmin();
    } else {
      setAdminPasswordInput('');
      setPasswordError('');
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'ultra1234') {
      setIsAdminUnlocked(true);
      setIsPasswordModalOpen(false);
      setPasswordError('');
      handleOpenAdmin();
      showToast('success', 'Admin Studio unlocked');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  // Subscribe to Firebase Admin Authentication State
  useEffect(() => {
    return subscribeAdminAuth(({ user, isAdmin }) => {
      setAdminUser(user);
      setIsAdminVerified(isAdmin);
    });
  }, []);

  // Firebase Real-time Synchronization Listeners (live across all devices, falling back cleanly to code defaults if DB is empty)
  useEffect(() => {
    // 1. Studio Media Slots Listener (/studioMedia/{slotId})
    const unsubMedia = onSnapshot(
      collection(db, 'studioMedia'),
      (snapshot) => {
        const nextMediaMap: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as { id?: string; dataUrl?: string };
          if (typeof data?.dataUrl === 'string') {
            nextMediaMap[docSnap.id] = data.dataUrl;
          }
        });
        studioMediaMapRef.current = nextMediaMap;

        const resolvedHero = resolveHeroMediaFromMap(rawHeroConfigRef.current, nextMediaMap);
        setHeroConfig(resolvedHero);

        const resolvedProducts = migrateUltraProducts(
          resolveProductsMediaFromMap(rawProductsRef.current, nextMediaMap)
        );
        setUltraProducts(resolvedProducts);

        const resolvedBlog = migrateLegacyBlogPosts(
          resolveBlogMediaFromMap(rawBlogPostsRef.current, nextMediaMap)
        );
        setBlogPosts(resolvedBlog);

        const resolvedGallery = migrateLegacyGalleryItems(
          resolveGalleryMediaFromMap(rawGalleryItemsRef.current, nextMediaMap)
        );
        setGalleryItems(resolvedGallery);

        writeStoredFormat({
          heroConfig: resolvedHero,
          ultraProducts: resolvedProducts,
          blogPosts: resolvedBlog,
          galleryItems: resolvedGallery,
        });
      },
      (err) => console.warn('Firebase studioMedia subscription notice:', err)
    );

    // 2. Config Settings Listener (/config/settings)
    const unsubConfig = onSnapshot(
      doc(db, 'config', 'settings'),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        const cachePatch: Partial<StudioFormatSnapshot> = {};

        if (data.heroConfig) {
          const mergedRawHero: HeroConfig = {
            ...DEFAULT_STUDIO_FORMAT.heroConfig,
            ...data.heroConfig,
          };
          rawHeroConfigRef.current = mergedRawHero;
          const resolvedHero = resolveHeroMediaFromMap(mergedRawHero, studioMediaMapRef.current);
          setHeroConfig(resolvedHero);
          cachePatch.heroConfig = resolvedHero;
        }
        if (data.sectionCopy) {
          const mergedCopy = migrateSectionCopy(data.sectionCopy);
          setSectionCopy(mergedCopy);
          cachePatch.sectionCopy = mergedCopy;
        }
        if (Array.isArray(data.qualifierBullets)) {
          setQualifierBullets(data.qualifierBullets);
          cachePatch.qualifierBullets = data.qualifierBullets;
        }
        if (data.themeColors) {
          setThemeColors(data.themeColors);
          cachePatch.themeColors = data.themeColors;
        }
        if (data.galleryFilter) {
          setGalleryFilter(data.galleryFilter);
          cachePatch.galleryFilter = data.galleryFilter;
        }
        if (data.textAnimStyle) {
          setTextAnimStyle(data.textAnimStyle);
          cachePatch.textAnimStyle = data.textAnimStyle;
        }

        if (Object.keys(cachePatch).length > 0) {
          writeStoredFormat(cachePatch);
        }
      },
      (err) => console.warn('Firebase config subscription notice:', err)
    );

    // 3. Blog Posts Listener (/blogPosts)
    const unsubBlog = onSnapshot(
      collection(db, 'blogPosts'),
      (snapshot) => {
        if (snapshot.empty) return;
        const rawItems = snapshot.docs.map((docItem) => docItem.data() as BlogPost);
        rawItems.sort((a, b) => a.id - b.id);
        rawBlogPostsRef.current = rawItems;
        const resolvedPosts = migrateLegacyBlogPosts(
          resolveBlogMediaFromMap(rawItems, studioMediaMapRef.current)
        );
        setBlogPosts(resolvedPosts);
        writeStoredFormat({ blogPosts: resolvedPosts });
      },
      (err) => console.warn('Firebase blogPosts subscription notice:', err)
    );

    // 4. Gallery Items Listener (/galleryItems)
    const unsubGallery = onSnapshot(
      collection(db, 'galleryItems'),
      (snapshot) => {
        if (snapshot.empty) return;
        const rawItems = snapshot.docs.map((docItem) => docItem.data() as GalleryItem);
        rawItems.sort((a, b) => a.id - b.id);
        rawGalleryItemsRef.current = rawItems;
        const resolvedItems = migrateLegacyGalleryItems(
          resolveGalleryMediaFromMap(rawItems, studioMediaMapRef.current)
        );
        setGalleryItems(resolvedItems);
        writeStoredFormat({ galleryItems: resolvedItems });
      },
      (err) => console.warn('Firebase galleryItems subscription notice:', err)
    );

    // 5. Ultra Products Listener (/ultraProducts)
    const unsubProducts = onSnapshot(
      collection(db, 'ultraProducts'),
      (snapshot) => {
        if (snapshot.empty) return;
        const rawItems = snapshot.docs.map((docItem) => docItem.data() as UltraProduct);
        rawItems.sort((a, b) => a.id - b.id);
        rawProductsRef.current = rawItems;
        const items = migrateUltraProducts(
          resolveProductsMediaFromMap(rawItems, studioMediaMapRef.current)
        );
        setUltraProducts(items);
        writeStoredFormat({ ultraProducts: items });
      },
      (err) => console.warn('Firebase ultraProducts subscription notice:', err)
    );

    return () => {
      unsubMedia();
      unsubConfig();
      unsubBlog();
      unsubGallery();
      unsubProducts();
    };
  }, []);

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostic(true);
    try {
      const report = await runFirebaseDiagnostics();
      setDiagnosticReport(report);
      if (report.firestoreConnected) {
        showToast('success', `Firebase is reachable! Latency: ${report.firestoreLatencyMs}ms`);
      } else {
        showToast('error', `Firestore test failed: ${report.firestoreMessage}`);
      }
    } catch (err) {
      showToast('error', `Diagnostics failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const handleAdminSignIn = async () => {
    try {
      setAuthErrorDetail(null);
      const res = await signInAdminWithGoogle();
      setAdminUser(res.user);
      setIsAdminVerified(res.isAdmin);
      if (res.isAdmin) {
        showToast('success', `Connected as Studio Admin (${res.user.email})`);
      } else {
        showToast(
          'error',
          `Signed in as ${res.user.email || 'user'}, but only ${ADMIN_EMAIL} can write to Firestore.`,
          5000
        );
      }
      return res.isAdmin;
    } catch (err) {
      const formatted = formatFirebaseError(err);
      setAuthErrorDetail(formatted);
      showToast('error', `Admin Sign-In: ${formatted.actionableStep}`, 7000);
      return false;
    }
  };

  // Commit draft changes to Firestore & active app state when SAVE is pressed
  const handleSaveAndApply = async (specificTabName?: string): Promise<boolean> => {
    if (isSavingCloud) return false;
    setIsSavingCloud(true);

    try {
      // Require verified admin sign-in (triggered directly from user click so popup opens reliably)
      if (!adminUser || !isAdminVerified) {
        try {
          const authRes = await signInAdminWithGoogle();
          setAdminUser(authRes.user);
          setIsAdminVerified(authRes.isAdmin);
          if (!authRes.isAdmin) {
            showToast(
              'error',
              `Signed in as ${authRes.user.email || 'user'}, but cloud saves require studio admin (${ADMIN_EMAIL}).`,
              5500
            );
            return false;
          }
        } catch (authErr) {
          const formatted = formatFirebaseError(authErr);
          setAuthErrorDetail(formatted);
          showToast('error', `Sign-In Required: ${formatted.actionableStep}`, 7000);
          return false;
        }
      }

      // Persist everything to Firestore
      const [configRes, blogRes, galleryRes, productsRes] = await Promise.all([
        saveStudioConfigToFirebase({
          heroConfig: draftHeroConfig,
          sectionCopy: draftSectionCopy,
          themeColors: draftThemeColors,
          qualifierBullets: draftQualifierBullets,
          galleryFilter: draftGalleryFilter,
          textAnimStyle: draftTextAnimStyle,
        }),
        saveBlogPostsToFirebase(draftBlogPosts),
        saveGalleryItemsToFirebase(draftGalleryItems),
        saveUltraProductsToFirebase(draftUltraProducts),
      ]);

      // Keep local studioMedia map & raw refs synchronized immediately so snapshots never flash or drop images
      studioMediaMapRef.current = {
        ...studioMediaMapRef.current,
        ...configRes.writtenMediaSlots,
        ...blogRes.writtenMediaSlots,
        ...galleryRes.writtenMediaSlots,
        ...productsRes.writtenMediaSlots,
      };
      rawHeroConfigRef.current = configRes.persistedHeroConfig;
      rawBlogPostsRef.current = blogRes.persistedPosts;
      rawGalleryItemsRef.current = galleryRes.persistedItems;
      rawProductsRef.current = productsRes.persistedProducts;

      // Update active React state & localStorage cache after confirmed Firestore write
      setHeroConfig(draftHeroConfig);
      setSectionCopy(draftSectionCopy);
      setQualifierBullets(draftQualifierBullets);
      setThemeColors(draftThemeColors);
      setBlogPosts(draftBlogPosts);
      setGalleryItems(draftGalleryItems);
      setUltraProducts(draftUltraProducts);
      setGalleryFilter(draftGalleryFilter);
      setTextAnimStyle(draftTextAnimStyle);

      writeStoredFormat({
        heroConfig: draftHeroConfig,
        sectionCopy: draftSectionCopy,
        qualifierBullets: draftQualifierBullets,
        themeColors: draftThemeColors,
        galleryFilter: draftGalleryFilter,
        textAnimStyle: draftTextAnimStyle,
        galleryItems: draftGalleryItems,
        blogPosts: draftBlogPosts,
        ultraProducts: draftUltraProducts,
      });

      const message = specificTabName
        ? `Saved & synced ${specificTabName} to Firestore!`
        : 'All Admin Studio changes saved & synced to Firestore!';
      setAuthErrorDetail(null);
      return true;
    } catch (err) {
      const formatted = formatFirebaseError(err);
      setAuthErrorDetail(formatted);
      showToast('error', `Firestore Save Failed: ${formatted.actionableStep}`, 7000);
      return false;
    } finally {
      setIsSavingCloud(false);
    }
  };

  useEffect(() => {
    if (isDrawerOpen || isBookingOpen || isAdminOpen || selectedNode || selectedPost || selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, isBookingOpen, isAdminOpen, selectedNode, selectedPost, selectedProduct]);

  useEffect(() => {
    document.title = 'Marcus — Bennet & Hot Core Pilates';
  }, []);

  useEffect(() => {
    if (adminTab === 'firebase' && !diagnosticReport && !isRunningDiagnostic) {
      void handleRunDiagnostics();
    }
  }, [adminTab]);

  const handleOpenBooking = (sessionName?: string) => {
    if (sessionName) {
      setSelectedSession(sessionName);
    }
    setBookingStep(1);
    setIsSubmitted(false);
    setIsBookingOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveBookingToFirebase({
        name: formData.name,
        email: formData.email,
        session: selectedSession,
        date: formData.date,
        time: formData.time,
      });
      setIsSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to submit booking.';
      showToast('error', `Booking sync notice: ${msg}`, 5000);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const processedUrl = await processImageFileForUpload(file, 460000);
      callback(processedUrl);
      showToast('success', 'Image added to draft! Click "Save & Apply Live" to publish.', 3200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to process image upload.';
      showToast('error', msg, 5500);
    }
  };

  const handleMultiFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (urls: string[]) => void
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length === 0) return;

    try {
      const processedUrls: string[] = [];
      for (const file of files) {
        const processed = await processImageFileForUpload(file, 460000);
        processedUrls.push(processed);
      }
      if (processedUrls.length > 0) {
        callback(processedUrls);
        showToast(
          'success',
          `${processedUrls.length} ${processedUrls.length === 1 ? 'image' : 'images'} added to draft! Click "Save & Apply Live" to publish.`,
          3400
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to upload selected image(s).';
      showToast('error', msg, 5500);
    }
  };

  return (
    <div
      className="min-h-screen w-full font-hn selection:bg-[#ebd2d8] selection:text-[#3d111e] overflow-x-hidden relative"
      style={{ backgroundColor: themeColors.wine, color: themeColors.cream }}
    >
      {/* Toast Notification on Save / Sync */}
      {saveToast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[70] max-w-[92vw] px-5 py-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 ${
            saveToast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-[#25D366] text-black'
          }`}
        >
          {saveToast.type === 'error' ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
          <span className="truncate">{saveToast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: MARCUS BENNET PORTFOLIO HERO                                   */}
      {/* ========================================================================= */}
      <section className="relative h-[100dvh] w-full overflow-hidden bg-[#141414] font-hn text-cream select-none">
        {/* Background image */}
        {heroConfig.bgImage?.trim() && (() => {
          const bgStyled = getImageStyleProps(heroConfig.bgImageStyle, themeColors);
          return (
            <div
              className="absolute inset-0 h-full w-full overflow-hidden"
              style={{ backgroundColor: bgStyled.containerBg }}
            >
              <img
                src={heroConfig.bgImage}
                alt=""
                className={`anim-fade-in h-full w-full ${bgStyled.fitClass} ${bgStyled.roundedClass}`}
                style={bgStyled.imgStyle as React.CSSProperties}
              />
            </div>
          );
        })()}

        {/* Marquee layer */}
        <div
          className="anim-fade-up absolute inset-x-0 top-[18vh] sm:top-[14vh] z-25 overflow-hidden pointer-events-none"
          style={{ animationDelay: '500ms' }}
        >
          <div className="marquee flex w-max whitespace-nowrap font-hn text-[11vh] sm:text-[26vh] leading-none text-cream">
            <span className="shrink-0 pr-[6vw]">{heroConfig.marqueeText}&nbsp;</span>
            <span className="shrink-0 pr-[6vw]">{heroConfig.marqueeText}&nbsp;</span>
          </div>
        </div>

        {/* Horizontal cream rule */}
        <div
          className="anim-line absolute inset-x-4 sm:inset-x-10 bottom-[4.5rem] sm:bottom-28 z-10 h-0.5 bg-cream"
          style={{ animationDelay: '1200ms' }}
        />

        {/* Front portrait */}
        {heroConfig.portraitImage?.trim() && (() => {
          const pStyled = getImageStyleProps(heroConfig.portraitImageStyle, themeColors);
          return (
            <img
              src={heroConfig.portraitImage}
              alt="Portrait"
              className={`anim-rise-in pointer-events-none absolute inset-0 z-20 h-full w-full object-top sm:object-center ${pStyled.fitClass}`}
              style={{ animationDelay: '300ms', ...(pStyled.imgStyle as React.CSSProperties) }}
            />
          );
        })()}

        {/* Header chrome */}
        <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-4 px-4 pt-4 sm:px-10 sm:pt-7 text-cream">
          <a
            href="#"
            className="anim-fade-up font-hn text-base sm:text-lg tracking-wide text-cream hover:opacity-75 transition-opacity duration-300 flex items-center shrink-0"
            style={{ animationDelay: '800ms' }}
          >
            {heroConfig.logoImage?.trim() ? (
              <img
                src={heroConfig.logoImage}
                alt={heroConfig.logoText?.trim() || 'Studio Logo'}
                className={`w-auto max-w-[180px] sm:max-w-[210px] object-contain transition-all ${
                  heroConfig.logoRounded === 'full'
                    ? 'rounded-full'
                    : heroConfig.logoRounded === 'md'
                    ? 'rounded-xl'
                    : 'rounded-none'
                }`}
                style={{
                  height: `${Math.max(20, Math.round((heroConfig.logoSize ?? 40) * 0.78))}px`,
                  transform: `translate(${heroConfig.logoOffsetX ?? 0}px, ${heroConfig.logoOffsetY ?? 0}px) scale(${heroConfig.logoFlipX ? -1 : 1}, ${heroConfig.logoFlipY ? -1 : 1})`,
                  mixBlendMode: heroConfig.logoBlendMode || 'normal',
                  opacity: (heroConfig.logoOpacity ?? 100) / 100,
                  backgroundColor: resolveImageBgColor(heroConfig.logoBgColor, themeColors),
                  filter: heroConfig.logoMatchTheme ? 'contrast(1.06) saturate(0.88) sepia(0.14)' : undefined,
                }}
              />
            ) : (
              <span>{heroConfig.logoText?.trim() || 'Marcus'}</span>
            )}
          </a>

          {/* Desktop Header Buttons */}
          <div
            className="anim-fade-up hidden sm:flex items-center gap-2 lg:gap-3"
            style={{ animationDelay: '850ms' }}
          >
            <nav
              aria-label="Hero navigation"
              className="flex items-center gap-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 px-2 py-1"
            >
              <a
                href="#transformations"
                className="px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-[0.16em] text-cream/90 hover:text-cream hover:bg-white/15 transition-all whitespace-nowrap"
              >
                Wellness
              </a>
              <a
                href="#gallery"
                className="px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-[0.16em] text-cream/90 hover:text-cream hover:bg-white/15 transition-all whitespace-nowrap"
              >
                Gallery
              </a>
              <a
                href="#blog"
                className="px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-[0.16em] text-cream/90 hover:text-cream hover:bg-white/15 transition-all whitespace-nowrap"
              >
                Journal
              </a>
              <a
                href="#ultra-collection"
                className="hidden md:inline-flex px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-[0.16em] text-cream/90 hover:text-cream hover:bg-white/15 transition-all whitespace-nowrap"
              >
                Collection
              </a>
            </nav>

            <button
              type="button"
              onClick={() => handleOpenBooking('Book a Class')}
              className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] transition-all cursor-pointer shadow-lg hover:scale-[1.02] whitespace-nowrap shrink-0"
              style={{ backgroundColor: themeColors.cream, color: themeColors.wine }}
            >
              Book a Class
            </button>
          </div>

          {/* Mobile Header Actions */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsDrawerOpen((prev) => !prev)}
              aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isDrawerOpen}
              className="anim-fade-up z-50 -mr-2 h-10 w-10 flex items-center justify-center cursor-pointer focus:outline-none"
              style={{ animationDelay: '900ms' }}
            >
              <div className="h-4 w-6 relative flex flex-col justify-between">
                <span
                  className={`h-0.5 w-6 bg-cream transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] origin-center ${
                    isDrawerOpen ? 'translate-y-[7px] rotate-45' : 'translate-y-0 rotate-0'
                  }`}
                />
                <span
                  className={`h-0.5 w-6 bg-cream transition-opacity duration-300 ${
                    isDrawerOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`h-0.5 w-6 bg-cream transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] origin-center ${
                    isDrawerOpen ? '-translate-y-[7px] -rotate-45' : 'translate-y-0 rotate-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </header>

        {/* Scroll down indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 hidden sm:flex flex-col items-center gap-1 opacity-70 animate-bounce">
          <span className="text-[10px] tracking-[0.2em] uppercase font-hn">Scroll to Explore</span>
          <ChevronRight className="rotate-90" size={14} />
        </div>

        {/* Mobile Drawer */}
        <div className="sm:hidden" aria-hidden={!isDrawerOpen}>
          <div
            onClick={() => setIsDrawerOpen(false)}
            className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${
              isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          />

          <div
            className={`fixed top-0 right-0 bottom-0 z-40 w-[80%] max-w-sm bg-[#141414] px-8 py-10 flex flex-col justify-between text-cream shadow-2xl transition-transform duration-600 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close menu"
              className={`absolute right-6 top-6 p-2 text-cream transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] cursor-pointer focus:outline-none ${
                isDrawerOpen
                  ? 'rotate-0 opacity-100 delay-[300ms]'
                  : 'rotate-90 opacity-0 pointer-events-none delay-0'
              }`}
            >
              <X size={26} strokeWidth={1.5} />
            </button>

            <div className="pt-16 flex flex-col gap-10">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-cream/50 mb-6">Site Index</div>
                <nav className="flex flex-col gap-3.5">
                  {NAV_LINKS.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className="font-hn text-3xl text-cream hover:opacity-60 transition-all block"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-cream/50 mb-4">Find Me</div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-hn">
                  {SOCIAL_LINKS.map((social) => (
                    <a key={social} href="#" onClick={() => setIsDrawerOpen(false)} className="text-cream hover:opacity-60 transition-all">
                      {social}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs text-cream/40 font-hn">A homage to Marcus Holloway</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: HOT CORE PILATES EDITORIAL LANDING PAGE                        */}
      {/* ========================================================================= */}
      <div id="hot-core-pilates" className="relative w-full" style={{ backgroundColor: themeColors.wine, color: themeColors.cream }}>
        {/* EMBEDDED SECTION: WELLNESS JOURNEY — ANIMATED ICONS */}
        <section
          id="transformations"
          className="px-4 sm:px-6 lg:px-16 py-14 sm:py-28 border-t relative overflow-hidden transition-colors duration-500"
          style={{ backgroundColor: themeColors.wellnessBg, color: '#ffffff', borderColor: `${themeColors.cream}15` }}
        >
          <div className="max-w-6xl mx-auto text-center mb-6 sm:mb-12 relative z-10">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-semibold mb-2 sm:mb-3 block" style={{ color: themeColors.wellnessIcon }}>
              {sectionCopy.wellnessKicker}
            </span>
            <h2 className="text-3xl sm:text-6xl font-extrabold uppercase tracking-tight text-white mb-2.5 sm:mb-4">
              {sectionCopy.wellnessTitle}
            </h2>
            <p className="text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-light text-white/80">
              {sectionCopy.wellnessSubtitle}
            </p>
          </div>

          <div className="canvas-root max-w-4xl mx-auto grid grid-cols-2 sm:flex sm:flex-col items-center justify-center gap-x-4 gap-y-7 sm:gap-10 py-4 sm:py-8 relative z-10">
            {WELLNESS_PILLARS.map((node, index) => {
              const IconComponent = getPillarIconComponent(node.defaultIcon);
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`shape-container ${node.floatClass} transition-transform duration-300 hover:scale-110 cursor-pointer ${
                    index === WELLNESS_PILLARS.length - 1 ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                  style={{ animationDelay: node.delay }}
                >
                  <IconComponent
                    className="wellness-icon w-11 h-11 sm:w-20 sm:h-20"
                    style={{
                      color: themeColors.wellnessIcon,
                    }}
                  />
                  <span className="label text-[11px] sm:text-sm" style={{ color: '#ffffff' }}>
                    {node.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6 sm:mt-12 text-[9px] sm:text-[10px] uppercase tracking-[0.28em] sm:tracking-[0.4em] opacity-60" style={{ color: themeColors.wellnessIcon }}>
            Holistic Wellness Flow &bull; Tap Icon to Explore Meaning &amp; Blog
          </div>
        </section>

        {/* Picture Gallery Section */}
        <section id="gallery" className="px-4 sm:px-6 lg:px-16 py-14 sm:py-28 border-t" style={{ backgroundColor: themeColors.wine, color: themeColors.cream, borderColor: `${themeColors.cream}10` }}>
          <div className="max-w-7xl mx-auto mb-7 sm:mb-12 text-center">
            <h2 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight" style={{ color: themeColors.cream }}>
              {sectionCopy.galleryTitle}
            </h2>

            {/* Gallery controls removed from public view — managed exclusively in Admin Studio */}
          </div>

          <div className={`max-w-7xl mx-auto grid ${galleryFilter === 'compact' ? 'gap-2.5 sm:gap-4 grid-cols-3 sm:grid-cols-3 md:grid-cols-6 auto-rows-[110px] sm:auto-rows-[180px]' : galleryFilter === 'large' ? 'gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 auto-rows-[220px] sm:auto-rows-[420px]' : 'gap-3 sm:gap-6 grid-cols-2 md:grid-cols-4 auto-rows-[155px] sm:auto-rows-[240px] md:auto-rows-[300px]'}`}>
            {galleryItems.map((item) => {
              let posClass = 'items-start justify-start text-left';
              if (item.textPosition === 'top-right') posClass = 'items-end justify-start text-right';
              if (item.textPosition === 'bottom-left') posClass = 'items-start justify-end text-left';
              if (item.textPosition === 'bottom-right') posClass = 'items-end justify-end text-right';
              if (item.textPosition === 'top-center') posClass = 'items-start justify-center text-center';
              if (item.textPosition === 'bottom-center') posClass = 'items-end justify-center text-center';

              const itemSize = galleryFilter === 'compact' || galleryFilter === 'large' ? 'col-span-1 row-span-1' : item.size;
              const tileStyled = getImageStyleProps(item.imageStyle, themeColors);

              return (
                <div key={item.id} className={`relative rounded-none overflow-hidden border group shadow-2xl flex flex-col p-3 sm:p-6 md:p-8 ${itemSize}`} style={{ backgroundColor: tileStyled.containerBg || '#000', borderColor: `${themeColors.cream}15` }}>
                  {item.image?.trim() && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className={`absolute inset-0 w-full h-full filter brightness-90 group-hover:scale-105 transition-transform duration-700 ease-out ${
                        item.image.includes('image_706072f8') ? 'object-[center_74%]' : ''
                      } ${tileStyled.fitClass} ${tileStyled.roundedClass}`}
                      style={tileStyled.imgStyle as React.CSSProperties}
                    />
                  )}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to top, ${themeColors.wine}ee 0%, transparent 70%)` }} />

                  <div className={`relative z-10 h-full flex flex-col ${posClass} w-full overflow-hidden`}>
                    {textAnimStyle === 'marquee' ? (
                      <div className="w-full overflow-hidden whitespace-nowrap py-0.5 sm:py-1">
                        <div className="marquee-fast flex w-max gap-4 sm:gap-8 font-extrabold uppercase tracking-tight text-sm sm:text-2xl md:text-3xl text-cream drop-shadow-lg">
                          <span>{item.title}</span>
                          <span>&mdash;</span>
                          <span>{item.title}</span>
                          <span>&mdash;</span>
                        </div>
                      </div>
                    ) : textAnimStyle === 'pulse' ? (
                      <h3 className="font-extrabold uppercase tracking-tight leading-none drop-shadow-lg anim-pulse-glow text-base sm:text-2xl md:text-4xl" style={{ color: themeColors.cream }}>
                        {item.title}
                      </h3>
                    ) : textAnimStyle === 'float' ? (
                      <h3 className="font-extrabold uppercase tracking-tight leading-none drop-shadow-lg anim-float-drift text-base sm:text-2xl md:text-4xl" style={{ color: themeColors.cream }}>
                        {item.title}
                      </h3>
                    ) : textAnimStyle === 'fadeUp' ? (
                      <h3 className="font-extrabold uppercase tracking-tight leading-none drop-shadow-lg anim-fade-up text-base sm:text-2xl md:text-4xl" style={{ color: themeColors.cream }}>
                        {item.title}
                      </h3>
                    ) : (
                      <h3 className="font-extrabold uppercase tracking-tight leading-none drop-shadow-lg text-base sm:text-2xl md:text-4xl" style={{ color: themeColors.cream }}>
                        {item.title}
                      </h3>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Blog Post Section & Reader Modal */}
        <JournalSection
          blogPosts={blogPosts}
          sectionCopy={sectionCopy}
          themeColors={themeColors}
          selectedPost={selectedPost}
          onSelectPost={setSelectedPost}
        />

        {/* Ultra Collection */}
        <section
          id="ultra-collection"
          className="px-4 sm:px-6 lg:px-16 py-14 sm:py-28 border-t overflow-x-clip"
          style={{ backgroundColor: themeColors.wine, color: themeColors.cream, borderColor: `${themeColors.cream}10` }}
        >
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-6xl font-extrabold uppercase tracking-tight leading-none" style={{ color: themeColors.cream }}>
                  {sectionCopy.ultraTitle}
                </h2>
              </div>

              {/* Progress & Scroll Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-[10px] sm:text-xs uppercase tracking-[0.22em] font-bold shrink-0"
                    style={{ color: themeColors.blush }}
                  >
                    {String(activeUltraSlideIdx + 1).padStart(2, '0')} /{' '}
                    {String(ultraProducts.length).padStart(2, '0')} &bull; Swipe or Scroll Releases
                  </span>
                  <div
                    className="h-[2px] w-20 sm:w-28 overflow-hidden"
                    style={{ backgroundColor: `${themeColors.cream}18` }}
                  >
                    <div
                      className="h-full transition-all duration-200 ease-out"
                      style={{
                        width: `${Math.max(100 / Math.max(1, ultraProducts.length), ultraRailScrollPct)}%`,
                        backgroundColor: themeColors.blush,
                      }}
                    />
                  </div>
                </div>

                {ultraProducts.length > 1 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollUltraRailByDirection(-1)}
                      disabled={activeUltraSlideIdx === 0 && ultraRailScrollPct <= 1}
                      aria-label="Scroll releases left"
                      className="p-2 sm:p-2.5 border transition-all hover:opacity-80 disabled:opacity-35 cursor-pointer disabled:cursor-default"
                      style={{
                        backgroundColor: `${themeColors.cardBg}70`,
                        borderColor: `${themeColors.cream}20`,
                        color: themeColors.cream,
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollUltraRailByDirection(1)}
                      disabled={activeUltraSlideIdx >= ultraProducts.length - 1 && ultraRailScrollPct >= 99}
                      aria-label="Scroll releases right"
                      className="p-2 sm:p-2.5 border transition-all hover:opacity-80 disabled:opacity-35 cursor-pointer disabled:cursor-default"
                      style={{
                        backgroundColor: `${themeColors.cardBg}70`,
                        borderColor: `${themeColors.cream}20`,
                        color: themeColors.cream,
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Snap Rail */}
            <div
              ref={ultraRailRef}
              onScroll={handleUltraRailScroll}
              onMouseDown={handleUltraRailMouseDown}
              onDragStart={(e) => e.preventDefault()}
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && ultraRailRef.current) {
                  const el = ultraRailRef.current;
                  const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
                  const atEnd =
                    el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 && e.deltaY > 0;
                  if (!atStart && !atEnd) {
                    el.scrollLeft += e.deltaY;
                    e.preventDefault();
                  }
                }
              }}
              className={`-mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 sm:scroll-px-0 flex overflow-x-auto gap-4 sm:gap-6 lg:gap-7 pb-4 scrollbar-none snap-x snap-mandatory touch-pan-x overscroll-x-contain select-none ${
                isDraggingUltraRail ? 'cursor-grabbing snap-none' : 'cursor-grab'
              }`}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {ultraProducts.map((product, idx) => {
                const prodStyled = getImageStyleProps(product.imageStyle, themeColors);
                const isSecondaryScraperTile = idx === 1 || idx === 2;
                const tileFitClass = product.imageStyle?.fit
                  ? product.imageStyle.fit === 'contain'
                    ? 'object-contain'
                    : 'object-cover'
                  : isSecondaryScraperTile
                  ? 'object-contain'
                  : 'object-cover';
                const allPhotos = Array.from(
                  new Set([product.image, ...(product.additionalImages || [])].filter(Boolean))
                );
                const formattedPrice = formatUltraPrice(product.price);
                const directWhatsAppUrl = `https://wa.me/265994248379?text=${encodeURIComponent(
                  `Hello Hot Core Pilates! I would like to order:\n- *${product.title}* (${formattedPrice})\n• Description: ${product.description || 'Professional grade oral wellness tool'}\n• Price: ${formattedPrice}\nPlease share availability and payment/delivery details.`
                )}`;
                const openProductShowcase = () => {
                  setSelectedProduct(product);
                  setActiveProductImageIdx(0);
                  setProductQty(1);
                  setIsProductCheckoutStep(false);
                  setIsProductOrderConfirmed(false);
                };

                return (
                  <div
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (ultraDragStateRef.current.moved) return;
                      openProductShowcase();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openProductShowcase();
                      }
                    }}
                    className="w-[84vw] sm:w-[360px] md:w-[390px] lg:w-[410px] shrink-0 snap-start group flex flex-col justify-between border overflow-hidden cursor-pointer shadow-2xl transition-all hover:-translate-y-1 hover:border-[#ebd2d8]/45 focus:outline-none focus:ring-2 focus:ring-[#ebd2d8]/40"
                    style={{ backgroundColor: `${themeColors.cardBg}60`, borderColor: `${themeColors.cream}18` }}
                  >
                    <div>
                      <div
                        className="relative aspect-[4/5] sm:aspect-square overflow-hidden border-b flex items-center justify-center"
                        style={{
                          borderColor: `${themeColors.cream}15`,
                          backgroundColor:
                            prodStyled.containerBg ||
                            (isSecondaryScraperTile ? '#eae6e6' : '#f2efeb'),
                        }}
                      >
                        {product.image?.trim() && (
                          <img
                            src={product.image}
                            alt={product.title}
                            className={`w-full h-full transition-transform duration-700 ease-out group-hover:scale-105 ${tileFitClass} ${prodStyled.roundedClass}`}
                            style={prodStyled.imgStyle as React.CSSProperties}
                          />
                        )}
                        {allPhotos.length > 1 && (
                          <div className="absolute top-3.5 right-3.5 z-10">
                            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 bg-black/65 backdrop-blur-md text-white border border-white/15">
                              <ImageIcon size={11} className="text-[#ebd2d8]" />
                              <span>{allPhotos.length} Photos</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 sm:p-6 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight leading-snug" style={{ color: themeColors.cream }}>
                            {product.title}
                          </h3>
                        </div>

                        {product.description && (
                          <p className="text-xs leading-relaxed font-hn line-clamp-3" style={{ color: `${themeColors.cream}cc` }}>
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t space-y-3" style={{ borderColor: `${themeColors.cream}15` }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: themeColors.blush }}>
                          Tap card for photos
                        </span>
                        <span className="text-sm font-extrabold" style={{ color: themeColors.cream }}>
                          {formattedPrice}
                        </span>
                      </div>
                      <a
                        href={directWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-black text-[11px] sm:text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg cursor-pointer"
                      >
                        <WhatsAppIcon className="w-4 h-4 shrink-0" />
                        <span>Proceed to Checkout</span>
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clickable Horizontal Slide Dots */}
            {ultraProducts.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-1">
                {ultraProducts.map((p, dotIdx) => {
                  const isActive = dotIdx === activeUltraSlideIdx;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => scrollToUltraSlide(dotIdx)}
                      aria-label={`Jump to release ${dotIdx + 1}: ${p.title}`}
                      className="h-2 transition-all cursor-pointer rounded-full"
                      style={{
                        width: isActive ? '24px' : '8px',
                        backgroundColor: isActive ? themeColors.blush : `${themeColors.cream}35`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 lg:px-16 py-8 sm:py-12 border-t text-[11px] sm:text-xs" style={{ backgroundColor: '#1c060e', color: `${themeColors.cream}88`, borderColor: `${themeColors.cream}10` }}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-center md:text-left">
            <div>
              <span>Boutique Reformer &amp; Private Coaching Studio</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
              <a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a>
              <a href="#" className="hover:opacity-100 transition-opacity">Studio Location</a>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-3">
              <span>&copy; 2026 Hot Core Pilates. All rights reserved.</span>
              <button
                type="button"
                onClick={handleAdminAccessClick}
                className="opacity-40 hover:opacity-100 transition-opacity text-[10px] uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
                title="Studio Admin"
              >
                <Lock size={11} />
                <span>ULTRA</span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ADMIN PASSWORD PROMPT MODAL */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-[#1c060e] text-[#efeee9] border border-[#ebd2d8]/25 p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              aria-label="Close password modal"
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/40 text-white/70 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#ebd2d8]/15 border border-[#ebd2d8]/30 flex items-center justify-center text-[#ebd2d8] shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-tight text-white">Studio Admin</h3>
                <p className="text-[11px] text-[#efeee9]/70">Enter passkey to open Admin Studio</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#ebd2d8] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Enter admin password"
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/20 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ebd2d8]"
                />
                {passwordError && (
                  <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-2 text-xs uppercase tracking-wider font-semibold text-white/70 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ebd2d8] hover:bg-[#efeee9] text-[#3d111e] text-xs font-extrabold uppercase tracking-widest cursor-pointer shadow-lg transition-all"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WELLNESS PILLAR MODAL */}
      {selectedNode && (() => {
        const NodeIcon = getPillarIconComponent(selectedNode.defaultIcon);
        const linkedPost =
          blogPosts.find(
            (p) => (p.status ?? 'published') === 'published' && p.pillarId === selectedNode.id
          ) ||
          blogPosts.find((p) => p.pillarId === selectedNode.id) ||
          null;
        const linkedPillarInfo = linkedPost ? resolvePostPillar(linkedPost) : null;
        const LinkedBlogIcon = linkedPillarInfo ? linkedPillarInfo.IconComponent : NodeIcon;

        const handleViewPillarBlog = () => {
          setSelectedNode(null);
          if (linkedPost) {
            setSelectedPost(linkedPost);
          } else {
            document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' });
          }
        };

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-[#1e2714] text-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-10 border border-white/20 animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pr-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center shadow-lg shrink-0">
                <NodeIcon className="w-7 h-7 sm:w-9 sm:h-9" style={{ color: '#d1dee7' }} />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#d1dee7] font-bold block mb-0.5 sm:mb-1">
                  Pillar {selectedNode.number} &bull; {selectedNode.label}
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold uppercase tracking-tight text-white leading-tight">{selectedNode.meaning}</h2>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light mb-5 sm:mb-8">{selectedNode.description}</p>
            <div className="mb-5 sm:mb-8">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest font-bold text-[#d1dee7] block mb-2.5 sm:mb-3">Core Physiological Benefits</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {selectedNode.benefits.map((benefit, idx) => (
                  <div key={idx} className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#d1dee7] shrink-0" />
                    <span className="text-xs font-semibold text-white">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              onClick={handleViewPillarBlog}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleViewPillarBlog();
                }
              }}
              className="p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-[#d1dee7]/50 transition-all mb-5 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                {linkedPost?.image?.trim() && (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black/40">
                    <img
                      src={linkedPost.image}
                      alt={linkedPost.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#d1dee7] font-bold mb-1">
                    <LinkedBlogIcon size={12} />
                    <span>
                      {linkedPost
                        ? `Pillar ${selectedNode.number} Journal · ${linkedPillarInfo?.iconLabel || 'Studio'} Icon`
                        : `Explore ${selectedNode.label} Articles`}
                    </span>
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-1 leading-snug">
                    {linkedPost ? linkedPost.title : `${selectedNode.meaning} — Studio Journal`}
                  </h4>
                  <p className="text-xs text-white/75 line-clamp-2">
                    {linkedPost
                      ? linkedPost.excerpt
                      : `Read our journal stories illustrating the ${selectedNode.label} pillar and its benefits.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewPillarBlog();
                }}
                className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-full bg-white text-[#637341] hover:bg-[#d1dee7] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0 whitespace-nowrap"
              >
                <BookOpen size={15} />
                <span>Click to View Blog</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setSelectedNode(null)} className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold uppercase tracking-widest cursor-pointer border border-white/20">
                Close Pillar
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ULTRA PRODUCT GALLERY & CHECKOUT MODAL */}
      {selectedProduct && (() => {
        const rawGallery = Array.from(
          new Set([selectedProduct.image, ...(selectedProduct.additionalImages || [])].filter(Boolean))
        );
        const gallery = rawGallery.filter(
          (img) => !img.includes('image_8f6de05c.png') && !img.includes('3_8ce33e94.png')
        );
        const safeIdx = Math.min(activeProductImageIdx, Math.max(0, gallery.length - 1));
        const activePhoto = gallery[safeIdx] || selectedProduct.image;
        const orderTotal = selectedProduct.price * productQty;
        const formattedUnitPrice = formatUltraPrice(selectedProduct.price);
        const formattedOrderTotal = formatUltraPrice(orderTotal);
        const whatsappText = encodeURIComponent(
          `Hello Hot Core Pilates! I would like to order:\n- *${selectedProduct.title}* x${productQty} (${formattedUnitPrice} each)\n• Description: ${selectedProduct.description || 'Professional grade oral wellness tool'}\n• Price: ${formattedUnitPrice}\n*Total: ${formattedOrderTotal}*${
            checkoutCustomer.name ? `\nName: ${checkoutCustomer.name}` : ''
          }${checkoutCustomer.contact ? `\nContact: ${checkoutCustomer.contact}` : ''}${
            checkoutCustomer.note ? `\nNote: ${checkoutCustomer.note}` : ''
          }\nPlease share availability and payment/delivery details.`
        );
        const whatsappCheckoutUrl = `https://wa.me/265994248379?text=${whatsappText}`;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 border-0 sm:border shadow-2xl"
              style={{
                backgroundColor: themeColors.wine,
                color: themeColors.cream,
                borderColor: `${themeColors.cream}22`,
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                aria-label="Close product details"
                className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 border border-white/15 cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Left Column: Active Photo + Additional Uploads */}
              <div
                className="md:col-span-6 p-4 sm:p-6 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r"
                style={{ backgroundColor: '#14060b', borderColor: `${themeColors.cream}15` }}
              >
                <div className="relative h-72 sm:h-96 bg-black overflow-hidden border" style={{ borderColor: `${themeColors.cream}18` }}>
                  {activePhoto && (
                    <img
                      src={activePhoto}
                      alt={`${selectedProduct.title} — photo ${safeIdx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  )}
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveProductImageIdx((safeIdx - 1 + gallery.length) % gallery.length)}
                        aria-label="Previous photo"
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/65 text-white hover:bg-black cursor-pointer border border-white/15"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveProductImageIdx((safeIdx + 1) % gallery.length)}
                        aria-label="Next photo"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/65 text-white hover:bg-black cursor-pointer border border-white/15"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 text-[10px] font-bold uppercase tracking-widest text-[#ebd2d8] border border-white/10">
                        {safeIdx + 1} / {gallery.length}
                      </span>
                    </>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-2" style={{ color: themeColors.blush }}>
                      Uploaded Photos ({gallery.length})
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {gallery.map((imgUrl, idx) => {
                        const isActive = idx === safeIdx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveProductImageIdx(idx)}
                            className={`relative w-16 h-16 overflow-hidden border transition-all cursor-pointer ${
                              isActive ? 'ring-2 ring-[#ebd2d8] opacity-100 scale-105' : 'opacity-60 hover:opacity-100'
                            }`}
                            style={{ borderColor: isActive ? themeColors.blush : `${themeColors.cream}25` }}
                          >
                            <img src={imgUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Details & Checkout Flow */}
              <div className="md:col-span-6 p-5 sm:p-8 flex flex-col justify-between gap-6">
                {!isProductCheckoutStep ? (
                  <>
                    <div className="space-y-4">
                      <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold block" style={{ color: themeColors.blush }}>
                        {selectedProduct.category} &bull; Studio Exclusive
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight leading-tight" style={{ color: themeColors.cream }}>
                          {selectedProduct.title}
                        </h3>
                        <span className="text-xl sm:text-2xl font-extrabold shrink-0" style={{ color: themeColors.cream }}>
                          {formattedUnitPrice}
                        </span>
                      </div>
                      {selectedProduct.description && (
                        <p className="text-xs sm:text-sm leading-relaxed font-hn" style={{ color: `${themeColors.cream}cc` }}>
                          {selectedProduct.description}
                        </p>
                      )}

                      <div className="pt-2 space-y-2">
                        <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: themeColors.blush }}>
                          Quantity
                        </span>
                        <div className="inline-flex items-center border" style={{ borderColor: `${themeColors.cream}25` }}>
                          <button
                            type="button"
                            onClick={() => setProductQty((q) => Math.max(1, q - 1))}
                            aria-label="Decrease quantity"
                            className="p-3 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-5 text-sm font-extrabold">{productQty}</span>
                          <button
                            type="button"
                            onClick={() => setProductQty((q) => Math.min(20, q + 1))}
                            aria-label="Increase quantity"
                            className="p-3 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-3" style={{ borderColor: `${themeColors.cream}18` }}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="uppercase tracking-wider font-semibold" style={{ color: `${themeColors.cream}aa` }}>
                          Total
                        </span>
                        <span className="text-xl font-extrabold" style={{ color: themeColors.cream }}>
                          {formattedOrderTotal}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProductCheckoutStep(true)}
                        className="w-full py-4 bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                      >
                        <WhatsAppIcon className="w-4 h-4 shrink-0" />
                        <span>Proceed to Checkout</span>
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col justify-between h-full gap-5">
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProductCheckoutStep(false);
                          setIsProductOrderConfirmed(false);
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold opacity-75 hover:opacity-100 cursor-pointer"
                        style={{ color: themeColors.blush }}
                      >
                        <ChevronLeft size={14} />
                        <span>Back to Photos &amp; Details</span>
                      </button>

                      <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold block mb-1" style={{ color: themeColors.blush }}>
                          Order Checkout
                        </span>
                        <h4 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight">
                          {selectedProduct.title}
                        </h4>
                      </div>

                      <div className="p-3.5 border flex items-center justify-between text-xs" style={{ backgroundColor: `${themeColors.cardBg}70`, borderColor: `${themeColors.cream}18` }}>
                        <div>
                          <span className="font-bold block">{selectedProduct.title} &times; {productQty}</span>
                          <span className="text-[11px] opacity-70">{formattedUnitPrice} each</span>
                        </div>
                        <span className="text-base font-extrabold">{formattedOrderTotal}</span>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-75">Your Name</label>
                          <input
                            type="text"
                            value={checkoutCustomer.name}
                            onChange={(e) => setCheckoutCustomer({ ...checkoutCustomer, name: e.target.value })}
                            placeholder="Full name"
                            className="w-full px-3.5 py-2.5 bg-black/35 border border-white/15 text-xs text-white focus:outline-none focus:border-[#ebd2d8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-75">Phone or Email</label>
                          <input
                            type="text"
                            value={checkoutCustomer.contact}
                            onChange={(e) => setCheckoutCustomer({ ...checkoutCustomer, contact: e.target.value })}
                            placeholder="Email or WhatsApp number"
                            className="w-full px-3.5 py-2.5 bg-black/35 border border-white/15 text-xs text-white focus:outline-none focus:border-[#ebd2d8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-75">Delivery / Pickup Note (Optional)</label>
                          <input
                            type="text"
                            value={checkoutCustomer.note}
                            onChange={(e) => setCheckoutCustomer({ ...checkoutCustomer, note: e.target.value })}
                            placeholder="Studio pickup or shipping address note"
                            className="w-full px-3.5 py-2.5 bg-black/35 border border-white/15 text-xs text-white focus:outline-none focus:border-[#ebd2d8]"
                          />
                        </div>
                      </div>

                      {isProductOrderConfirmed && (
                        <div className="p-3 bg-[#25D366]/15 border border-[#25D366]/40 text-xs text-[#d6ffe4] flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-[#25D366] shrink-0 mt-0.5" />
                          <span>Order summary opened for WhatsApp checkout. Thank you for choosing Hot Core Studio!</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t space-y-2.5" style={{ borderColor: `${themeColors.cream}18` }}>
                      <a
                        href={whatsappCheckoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsProductOrderConfirmed(true)}
                        className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                      >
                        <WhatsAppIcon className="w-4 h-4 shrink-0" />
                        <span>Complete Checkout via WhatsApp ({formattedOrderTotal})</span>
                        <ArrowUpRight size={15} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADMIN STUDIO SETTINGS MODAL */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[92vh] bg-[#1a1a1a] text-[#efeee9] rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border-0 sm:border border-white/15">
            {/* Header */}
            <div className="px-4 py-3.5 sm:px-8 sm:py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#141414]">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#ebd2d8] text-[#3d111e] flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">AS</div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold uppercase tracking-wider text-white truncate">Admin Studio</h3>
                  <p className="hidden sm:block text-xs text-white/50">Modify drafts locally &bull; Save to sync live on all devices via Firestore</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {adminUser && isAdminVerified ? (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[11px] font-semibold text-emerald-200">
                    <Cloud size={13} className="text-emerald-300" />
                    <span className="max-w-[160px] truncate">{adminUser.email}</span>
                    <button
                      type="button"
                      onClick={() => void signOutAdmin()}
                      className="text-white/60 hover:text-white cursor-pointer ml-1"
                      title="Sign out admin session"
                    >
                      <LogOut size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleAdminSignIn()}
                    className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold uppercase tracking-wider text-[#ebd2d8] flex items-center gap-1.5 cursor-pointer"
                    title={`Sign in as ${ADMIN_EMAIL} to save changes to Firestore`}
                  >
                    <LogIn size={13} />
                    <span className="hidden sm:inline">Sign In Google</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSavingCloud}
                  onClick={() => void handleSaveAndApply()}
                  className="px-3.5 py-2 sm:px-5 sm:py-2 rounded-full bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] disabled:opacity-60 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all cursor-pointer disabled:cursor-wait"
                >
                  <Save size={14} />
                  <span className="sm:hidden">{isSavingCloud ? 'Saving...' : 'Save'}</span>
                  <span className="hidden sm:inline">{isSavingCloud ? 'Syncing Firestore...' : 'Save & Apply Live'}</span>
                </button>
                <button onClick={() => setIsAdminOpen(false)} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs Bar */}
            <div className="flex border-b border-white/10 bg-[#161616] px-3 sm:px-8 gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'hero', label: 'Hero Visuals', icon: ImageIcon },
                { id: 'copy', label: 'Titles & Copy', icon: FileText },
                { id: 'blog', label: 'Blog Posts', icon: Plus },
                { id: 'gallery', label: 'Picture Gallery', icon: ImageIcon },
                { id: 'products', label: 'Ultra Collection', icon: ShoppingBag },
                { id: 'colors', label: 'Theme Colors', icon: Palette },
                { id: 'code', label: 'Format Code', icon: Code2 },
                { id: 'firebase', label: 'Firebase & Auth', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id as any)}
                    className={`flex items-center gap-1.5 sm:gap-2 py-3 px-3 sm:py-4 sm:px-5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      adminTab === tab.id ? 'border-[#ebd2d8] text-[#ebd2d8]' : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-5 sm:space-y-6">
              {/* Contextual Auth / Domain Error Callout */}
              {authErrorDetail && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="text-amber-400 shrink-0" size={18} />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                          {authErrorDetail.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-amber-200/90 mt-0.5">
                          {authErrorDetail.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAuthErrorDetail(null)}
                      className="p-1 rounded-lg text-amber-400/70 hover:text-amber-200 hover:bg-amber-900/40 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 text-xs text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="font-mono text-[11px] text-amber-300/90">
                      <span className="text-white/60">Required Action: </span>
                      {authErrorDetail.actionableStep}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {authErrorDetail.targetDomain && (
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(authErrorDetail.targetDomain || '');
                              setDomainCopied(true);
                              setTimeout(() => setDomainCopied(false), 2000);
                            } catch {
                              // Ignore
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          {domainCopied ? <Check size={12} className="text-[#25D366]" /> : <Copy size={12} />}
                          <span>{domainCopied ? 'Copied Domain' : 'Copy Domain'}</span>
                        </button>
                      )}
                      {authErrorDetail.actionUrl && (
                        <a
                          href={authErrorDetail.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Firebase</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <button
                        onClick={() => setAdminTab('firebase')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Diagnostic Hub
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: HERO VISUALS */}
              {adminTab === 'hero' && (
                <div className="space-y-6">
                  {/* Local Live Preview Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-black/80 to-[#282828] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase text-[#ebd2d8] tracking-wider">
                      <span className="flex items-center gap-2"><Eye size={16} /> Local Live Preview (Hero)</span>
                      <span className="text-[10px] text-white/50">Uncommitted changes until saved</span>
                    </div>
                    <div className="relative h-44 rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                      {draftHeroConfig.bgImage?.trim() && (
                        <img src={draftHeroConfig.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      )}
                      {draftHeroConfig.portraitImage?.trim() && (
                        <img src={draftHeroConfig.portraitImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      )}
                      <div className="absolute top-3 left-3 z-10 flex items-center">
                        {draftHeroConfig.logoImage?.trim() ? (
                          <img
                            src={draftHeroConfig.logoImage}
                            alt={draftHeroConfig.logoText?.trim() || 'Studio Logo'}
                            className={`w-auto max-w-[180px] object-contain drop-shadow ${
                              draftHeroConfig.logoRounded === 'full'
                                ? 'rounded-full'
                                : draftHeroConfig.logoRounded === 'md'
                                ? 'rounded-lg'
                                : 'rounded-none'
                            }`}
                            style={{
                              height: `${Math.max(18, Math.round((draftHeroConfig.logoSize ?? 40) * 0.7))}px`,
                              transform: `translate(${Math.round((draftHeroConfig.logoOffsetX ?? 0) * 0.5)}px, ${Math.round((draftHeroConfig.logoOffsetY ?? 0) * 0.5)}px)`,
                              mixBlendMode: draftHeroConfig.logoBlendMode || 'normal',
                              opacity: (draftHeroConfig.logoOpacity ?? 100) / 100,
                            }}
                          />
                        ) : (
                          <span className="text-xs font-hn tracking-wide text-white/90 drop-shadow">
                            {draftHeroConfig.logoText?.trim() || 'Marcus'}
                          </span>
                        )}
                      </div>
                      <div className="relative z-10 text-center px-4">
                        <div className="text-xl font-extrabold text-white tracking-widest uppercase drop-shadow-md">{draftHeroConfig.marqueeText}</div>
                        <div className="text-xs text-[#ebd2d8] mt-1 font-serif italic">{draftHeroConfig.subheadline}</div>
                      </div>
                    </div>
                  </div>

                  {/* Header Logo Image Upload */}
                  <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white">Header Brand Logo Image</label>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          Upload your studio logo image to replace the top-left text in the hero header.
                        </p>
                      </div>
                      {draftHeroConfig.logoImage?.trim() && (
                        <button
                          type="button"
                          onClick={() => setDraftHeroConfig({ ...draftHeroConfig, logoImage: '' })}
                          className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 text-[11px] font-bold uppercase tracking-wider cursor-pointer self-start sm:self-auto"
                        >
                          Remove Logo Image
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-28 h-16 rounded-xl bg-black/60 border border-white/15 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                        {draftHeroConfig.logoImage?.trim() ? (
                          <img
                            src={draftHeroConfig.logoImage}
                            alt="Header Logo Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-white/40 font-hn truncate">
                            {draftHeroConfig.logoText?.trim() || 'Marcus'}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Logo Image URL</label>
                            <input
                              type="text"
                              value={draftHeroConfig.logoImage || ''}
                              placeholder="Paste logo URL or upload below..."
                              onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, logoImage: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Fallback Text (When No Image)</label>
                            <input
                              type="text"
                              value={draftHeroConfig.logoText ?? 'Marcus'}
                              placeholder="Marcus"
                              onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, logoText: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] text-xs font-bold cursor-pointer transition-all shadow">
                              <Upload size={14} />
                              <span>Upload Logo Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, (url) => setDraftHeroConfig((prev) => ({ ...prev, logoImage: url })))}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setBgRemoverTarget({
                                  image: draftHeroConfig.logoImage || '',
                                  label: 'Header Logo',
                                  onApply: (url) => setDraftHeroConfig((prev) => ({ ...prev, logoImage: url })),
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[#ebd2d8] cursor-pointer transition-all border border-[#ebd2d8]/30"
                            >
                              <Eraser size={14} />
                              <span>Custom BG Remover</span>
                            </button>
                          </div>
                          <span className="text-[10px] text-white/40">Transparent PNG / SVG / WebP recommended</span>
                        </div>
                      </div>
                    </div>

                    {/* Logo Background Remover Choice, Size & Positioning Controls */}
                    <div className="pt-3 border-t border-white/10 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#ebd2d8]">
                          Background Removal Choice, Size &amp; Positioning
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftHeroConfig({
                              ...draftHeroConfig,
                              logoSize: 40,
                              logoOffsetX: 0,
                              logoOffsetY: 0,
                              logoFlipX: false,
                              logoFlipY: false,
                              logoBgColor: 'transparent',
                              logoMatchTheme: false,
                              logoBlendMode: 'normal',
                              logoRounded: 'none',
                              logoOpacity: 100,
                            })
                          }
                          className="text-[10px] uppercase font-bold text-white/60 hover:text-white underline cursor-pointer"
                        >
                          Reset Logo Style
                        </button>
                      </div>

                      {/* Flip & Match Theme Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDraftHeroConfig({ ...draftHeroConfig, logoFlipX: !draftHeroConfig.logoFlipX })}
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase cursor-pointer ${
                            draftHeroConfig.logoFlipX
                              ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8]'
                              : 'bg-black/40 text-white/75 border-white/15 hover:border-white/35'
                          }`}
                        >
                          Flip H
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraftHeroConfig({ ...draftHeroConfig, logoFlipY: !draftHeroConfig.logoFlipY })}
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase cursor-pointer ${
                            draftHeroConfig.logoFlipY
                              ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8]'
                              : 'bg-black/40 text-white/75 border-white/15 hover:border-white/35'
                          }`}
                        >
                          Flip V
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftHeroConfig({
                              ...draftHeroConfig,
                              logoMatchTheme: !draftHeroConfig.logoMatchTheme,
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase cursor-pointer ${
                            draftHeroConfig.logoMatchTheme
                              ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8]'
                              : 'bg-black/40 text-white/75 border-white/15 hover:border-white/35'
                          }`}
                        >
                          Match Theme
                        </button>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-[10px] uppercase font-bold text-white/55">BG:</span>
                          {[
                            { id: 'transparent', label: 'None', color: '#222' },
                            { id: 'theme-wine', label: 'Wine', color: draftThemeColors.wine },
                            { id: 'theme-blush', label: 'Blush', color: draftThemeColors.blush },
                            { id: 'theme-cream', label: 'Cream', color: draftThemeColors.cream },
                          ].map((sw) => (
                            <button
                              key={sw.id}
                              type="button"
                              onClick={() => setDraftHeroConfig({ ...draftHeroConfig, logoBgColor: sw.id })}
                              title={`Logo BG: ${sw.label}`}
                              className={`w-5 h-5 rounded-full border cursor-pointer ${
                                (draftHeroConfig.logoBgColor || 'transparent') === sw.id
                                  ? 'border-[#ebd2d8] scale-110'
                                  : 'border-white/30'
                              }`}
                              style={{ backgroundColor: sw.color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Background Removal Mode Choice */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-white/60 mb-1.5">
                          Background Removal Mode
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'normal', label: 'Normal / Cutout PNG' },
                            { id: 'screen', label: 'Remove Black BG' },
                            { id: 'multiply', label: 'Remove White BG' },
                            { id: 'lighten', label: 'Soften Dark BG' },
                          ].map((opt) => {
                            const active = (draftHeroConfig.logoBlendMode || 'normal') === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setDraftHeroConfig({
                                    ...draftHeroConfig,
                                    logoBlendMode: opt.id as HeroConfig['logoBlendMode'],
                                  })
                                }
                                className={`px-2.5 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                                  active
                                    ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8]'
                                    : 'bg-black/40 text-white/75 border-white/15 hover:border-white/35'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Size & X/Y Positioning Sliders */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/70">
                            <span>Logo Size</span>
                            <span className="font-mono text-[#ebd2d8]">{draftHeroConfig.logoSize ?? 40}px</span>
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={120}
                            value={draftHeroConfig.logoSize ?? 40}
                            onChange={(e) =>
                              setDraftHeroConfig({ ...draftHeroConfig, logoSize: Number(e.target.value) })
                            }
                            className="w-full accent-[#ebd2d8] cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/70">
                            <span>Horizontal (X)</span>
                            <span className="font-mono text-[#ebd2d8]">{draftHeroConfig.logoOffsetX ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min={-40}
                            max={120}
                            value={draftHeroConfig.logoOffsetX ?? 0}
                            onChange={(e) =>
                              setDraftHeroConfig({ ...draftHeroConfig, logoOffsetX: Number(e.target.value) })
                            }
                            className="w-full accent-[#ebd2d8] cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/70">
                            <span>Vertical (Y)</span>
                            <span className="font-mono text-[#ebd2d8]">{draftHeroConfig.logoOffsetY ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min={-24}
                            max={60}
                            value={draftHeroConfig.logoOffsetY ?? 0}
                            onChange={(e) =>
                              setDraftHeroConfig({ ...draftHeroConfig, logoOffsetY: Number(e.target.value) })
                            }
                            className="w-full accent-[#ebd2d8] cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Shape & Opacity */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-white/60 mb-1.5">
                            Logo Corner Shape
                          </label>
                          <div className="flex items-center gap-2">
                            {[
                              { id: 'none', label: 'Sharp' },
                              { id: 'md', label: 'Rounded' },
                              { id: 'full', label: 'Circle' },
                            ].map((shape) => {
                              const active = (draftHeroConfig.logoRounded || 'none') === shape.id;
                              return (
                                <button
                                  key={shape.id}
                                  type="button"
                                  onClick={() =>
                                    setDraftHeroConfig({
                                      ...draftHeroConfig,
                                      logoRounded: shape.id as HeroConfig['logoRounded'],
                                    })
                                  }
                                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                                    active
                                      ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8]'
                                      : 'bg-black/40 text-white/70 border-white/15 hover:border-white/35'
                                  }`}
                                >
                                  {shape.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/70">
                            <span>Opacity</span>
                            <span className="font-mono text-[#ebd2d8]">{draftHeroConfig.logoOpacity ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min={30}
                            max={100}
                            value={draftHeroConfig.logoOpacity ?? 100}
                            onChange={(e) =>
                              setDraftHeroConfig({ ...draftHeroConfig, logoOpacity: Number(e.target.value) })
                            }
                            className="w-full accent-[#ebd2d8] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-white">Background Image URL</label>
                      <input
                        type="text"
                        value={draftHeroConfig.bgImage}
                        onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, bgImage: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono"
                      />
                      <div className="flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer transition-all">
                          <Upload size={14} />
                          <span>Upload File From Device</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, (url) => setDraftHeroConfig((prev) => ({ ...prev, bgImage: url })))}
                          />
                        </label>
                        <span className="text-[10px] text-white/40">Base64 / WebP / JPG</span>
                      </div>
                      <ImageStyleControls
                        style={draftHeroConfig.bgImageStyle}
                        onChange={(nextStyle) => setDraftHeroConfig({ ...draftHeroConfig, bgImageStyle: nextStyle })}
                        themeColors={draftThemeColors}
                        onOpenBgRemover={() =>
                          setBgRemoverTarget({
                            image: draftHeroConfig.bgImage || '',
                            label: 'Hero Background',
                            onApply: (url) => setDraftHeroConfig((prev) => ({ ...prev, bgImage: url })),
                          })
                        }
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-white">Portrait Overlay Image URL</label>
                      <input
                        type="text"
                        value={draftHeroConfig.portraitImage}
                        onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, portraitImage: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-mono"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer transition-all">
                          <Upload size={14} />
                          <span>Upload File From Device</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, (url) => setDraftHeroConfig((prev) => ({ ...prev, portraitImage: url })))}
                          />
                        </label>
                        <span className="text-[10px] text-white/40">PNG cutout recommended</span>
                      </div>
                      <ImageStyleControls
                        style={draftHeroConfig.portraitImageStyle}
                        onChange={(nextStyle) => setDraftHeroConfig({ ...draftHeroConfig, portraitImageStyle: nextStyle })}
                        themeColors={draftThemeColors}
                        onOpenBgRemover={() =>
                          setBgRemoverTarget({
                            image: draftHeroConfig.portraitImage || '',
                            label: 'Portrait Overlay',
                            onApply: (url) => setDraftHeroConfig((prev) => ({ ...prev, portraitImage: url })),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#141414] border border-white/10">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">Private Reformer Subheadline</label>
                    <textarea
                      rows={2}
                      value={draftHeroConfig.subheadline}
                      onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, subheadline: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveAndApply('Hero Visuals')}
                      className="px-6 py-3 rounded-full bg-[#ebd2d8] text-[#3d111e] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:bg-[#efeee9]"
                    >
                      <Save size={14} /> <span>Save &amp; Confirm Hero Visuals</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TITLES & COPY */}
              {adminTab === 'copy' && (
                <div className="space-y-6">
                  {/* Local Live Preview Banner */}
                  <div className="p-5 rounded-2xl bg-[#141414] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase text-[#ebd2d8] tracking-wider">
                      <span className="flex items-center gap-2"><Eye size={16} /> Local Live Preview (Headline &amp; Section Copy)</span>
                    </div>
                    <div className="p-6 rounded-xl bg-black/60 border border-white/10 text-center space-y-2">
                      <div className="text-[#ebd2d8] text-[10px] font-bold uppercase tracking-[0.25em]">
                        {draftHeroConfig.kicker || 'Private Studio & 1:1 Coaching'}
                      </div>
                      <h2 className="text-2xl font-extrabold uppercase text-white tracking-tight">
                        {draftHeroConfig.headlinePart1}{' '}
                        <span className="font-serif italic font-normal text-[#ebd2d8]">{draftHeroConfig.headlineAccent}</span>{' '}
                        {draftHeroConfig.headlinePart2}
                      </h2>
                      <p className="text-xs text-white/70 max-w-lg mx-auto">{draftHeroConfig.subheadline}</p>
                    </div>
                  </div>

                  {/* Hero Headline & Marquee */}
                  <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#ebd2d8]">Hero Headlines &amp; Kicker</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1">Moving Text Marquee (Hero Name)</label>
                        <input
                          type="text"
                          value={draftHeroConfig.marqueeText}
                          onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, marqueeText: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1">Hero Studio Kicker (Subtitle Tag)</label>
                        <input
                          type="text"
                          value={draftHeroConfig.kicker || ''}
                          onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, kicker: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-white/80 mb-1">Headline Part 1</label>
                        <input
                          type="text"
                          value={draftHeroConfig.headlinePart1}
                          onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, headlinePart1: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-white/80 mb-1">Accent Word (Italic)</label>
                        <input
                          type="text"
                          value={draftHeroConfig.headlineAccent}
                          onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, headlineAccent: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-white/80 mb-1">Headline Part 2</label>
                        <input
                          type="text"
                          value={draftHeroConfig.headlinePart2}
                          onChange={(e) => setDraftHeroConfig({ ...draftHeroConfig, headlinePart2: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* All Section Titles, Subtitles & Intro Copy */}
                  <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-5">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-[#ebd2d8] mb-1">Section Titles, Subtitles &amp; Intro Text</h5>
                      <p className="text-[11px] text-white/55">Edit the kicker eyebrow, main title, and subtitle/description for every landing page section.</p>
                    </div>

                    {[
                      {
                        label: 'About / Qualifier Section',
                        kickerKey: 'qualifierKicker' as const,
                        titleKey: 'qualifierTitle' as const,
                        subtitleKey: 'qualifierSubtitle' as const,
                      },
                      {
                        label: 'Wellness Journey Section',
                        kickerKey: 'wellnessKicker' as const,
                        titleKey: 'wellnessTitle' as const,
                        subtitleKey: 'wellnessSubtitle' as const,
                      },
                      {
                        label: 'Studio Gallery Section',
                        kickerKey: 'galleryKicker' as const,
                        titleKey: 'galleryTitle' as const,
                        subtitleKey: 'gallerySubtitle' as const,
                      },
                      {
                        label: 'Journal & Blog Section',
                        kickerKey: 'blogKicker' as const,
                        titleKey: 'blogTitle' as const,
                        subtitleKey: 'blogSubtitle' as const,
                      },
                      {
                        label: 'Ultra Collection Section',
                        kickerKey: 'ultraKicker' as const,
                        titleKey: 'ultraTitle' as const,
                        subtitleKey: 'ultraSubtitle' as const,
                      },
                    ].map((section) => (
                      <div key={section.titleKey} className="p-4 rounded-xl bg-black/35 border border-white/10 space-y-3">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-[#ebd2d8]">{section.label}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Eyebrow / Subtitle Tag</label>
                            <input
                              type="text"
                              value={draftSectionCopy[section.kickerKey]}
                              onChange={(e) => setDraftSectionCopy({ ...draftSectionCopy, [section.kickerKey]: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Section Title</label>
                            <input
                              type="text"
                              value={draftSectionCopy[section.titleKey]}
                              onChange={(e) => setDraftSectionCopy({ ...draftSectionCopy, [section.titleKey]: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-bold"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Section Description / Intro Text</label>
                          <textarea
                            rows={2}
                            value={draftSectionCopy[section.subtitleKey]}
                            onChange={(e) => setDraftSectionCopy({ ...draftSectionCopy, [section.subtitleKey]: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Qualifier Bullets */}
                  <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-white">"Who is this for?" Target Audience Points</label>
                      <button
                        onClick={() => setDraftQualifierBullets([...draftQualifierBullets, 'New targeted assessment point'])}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} /> <span>Add Bullet Point</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {draftQualifierBullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => {
                              const updated = [...draftQualifierBullets];
                              updated[idx] = e.target.value;
                              setDraftQualifierBullets(updated);
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white"
                          />
                          <button
                            onClick={() => setDraftQualifierBullets(draftQualifierBullets.filter((_, i) => i !== idx))}
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveAndApply('Titles & Copy')}
                      className="px-6 py-3 rounded-full bg-[#ebd2d8] text-[#3d111e] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:bg-[#efeee9]"
                    >
                      <Save size={14} /> <span>Save &amp; Confirm Titles &amp; Copy</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: BLOG POSTS EDITORIAL STUDIO */}
              {adminTab === 'blog' && (
                <BlogAdminEditor
                  draftBlogPosts={draftBlogPosts}
                  setDraftBlogPosts={setDraftBlogPosts}
                  draftSectionCopy={draftSectionCopy}
                  setDraftSectionCopy={setDraftSectionCopy}
                  draftThemeColors={draftThemeColors}
                  onFileUpload={handleFileUpload}
                  onMultiFileUpload={handleMultiFileUpload}
                  onOpenBgRemover={(image, label, onApply) =>
                    setBgRemoverTarget({ image, label, onApply })
                  }
                  onSaveAndApply={handleSaveAndApply}
                />
              )}

              {/* TAB 4: PICTURE GALLERY */}
              {adminTab === 'gallery' && (
                <div className="space-y-6">
                  {/* Gallery Layout & Animation Settings Bar */}
                  <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#ebd2d8]">Public Gallery Display Settings</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-white/70 mb-2">Default Layout Mode</label>
                        <div className="flex flex-wrap gap-1.5 p-1.5 bg-black/40 border border-white/10 rounded-xl">
                          {[
                            { id: 'all', label: 'All Tiles' },
                            { id: 'compact', label: 'Compact Grid' },
                            { id: 'large', label: 'Featured View' },
                            { id: 'minimal', label: 'Clean Tiles' },
                          ].map((option) => (
                            <button
                              key={option.id}
                              onClick={() => setDraftGalleryFilter(option.id as any)}
                              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                                draftGalleryFilter === option.id
                                  ? 'bg-[#ebd2d8] text-[#3d111e] shadow-md'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-white/70 mb-2">Overlapping Text Animation</label>
                        <div className="flex flex-wrap gap-1.5 p-1.5 bg-black/40 border border-[#ebd2d8]/30 rounded-xl">
                          {[
                            { id: 'marquee', label: 'Hero Marquee' },
                            { id: 'pulse', label: 'Pulse Glow' },
                            { id: 'float', label: 'Float Drift' },
                            { id: 'fadeUp', label: 'Rise Up' },
                            { id: 'none', label: 'Static' },
                          ].map((anim) => (
                            <button
                              key={anim.id}
                              onClick={() => setDraftTextAnimStyle(anim.id as any)}
                              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                                draftTextAnimStyle === anim.id
                                  ? 'bg-[#efeee9] text-[#3d111e] shadow-md'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {anim.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">Studio Picture Gallery Tiles</h4>
                      <p className="text-xs text-white/60">Upload custom images, set tile grid sizes, position overlapping titles, and customize text layout.</p>
                    </div>
                    <button
                      onClick={() => {
                        const newItem = {
                          id: Date.now(),
                          title: 'NEW STUDIO SNAP',
                          subtitle: `0${draftGalleryItems.length + 1} / ATMOSPHERE`,
                          image: BG_IMAGE_URL,
                          size: 'col-span-1 row-span-1',
                          textPosition: 'bottom-left',
                        };
                        setDraftGalleryItems([...draftGalleryItems, newItem]);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#ebd2d8] text-[#3d111e] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Plus size={16} /> <span>Add Tile</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {draftGalleryItems.map((item) => (
                      <div key={item.id} className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-3 relative flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-white/60 mb-0.5">Overlapping Title</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDraftGalleryItems(draftGalleryItems.map((g) => (g.id === item.id ? { ...g, title: val } : g)));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-bold uppercase"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-white/60 mb-0.5">Tile Grid Size</label>
                                <select
                                  value={item.size}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftGalleryItems(draftGalleryItems.map((g) => (g.id === item.id ? { ...g, size: val } : g)));
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
                                >
                                  <option value="col-span-1 row-span-1">1x1 Standard Tile</option>
                                  <option value="col-span-1 md:col-span-2 row-span-1">2x1 Wide Banner Tile</option>
                                  <option value="col-span-1 row-span-2">1x2 Tall Portrait Tile</option>
                                  <option value="col-span-1 md:col-span-2 row-span-2">2x2 Large Featured Tile</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] uppercase font-bold text-white/60 mb-0.5">Text Alignment</label>
                                <select
                                  value={item.textPosition}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftGalleryItems(draftGalleryItems.map((g) => (g.id === item.id ? { ...g, textPosition: val } : g)));
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
                                >
                                  <option value="top-left">Top Left</option>
                                  <option value="top-center">Top Center</option>
                                  <option value="top-right">Top Right</option>
                                  <option value="bottom-left">Bottom Left</option>
                                  <option value="bottom-center">Bottom Center</option>
                                  <option value="bottom-right">Bottom Right</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setDraftGalleryItems(draftGalleryItems.filter((g) => g.id !== item.id))}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                            title="Delete Tile"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Image Preview & Upload */}
                        <div className="flex items-center gap-3 pt-2">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black flex items-center justify-center">
                            {item.image?.trim() ? (
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-white/30" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer w-full justify-center">
                              <Upload size={14} />
                              <span>Upload Image File</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const targetId = item.id;
                                  handleFileUpload(e, (url) =>
                                    setDraftGalleryItems((prev) =>
                                      prev.map((g) => (g.id === targetId ? { ...g, image: url } : g))
                                    )
                                  );
                                }}
                              />
                            </label>
                            <input
                              type="text"
                              value={item.image}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftGalleryItems(draftGalleryItems.map((g) => (g.id === item.id ? { ...g, image: val } : g)));
                              }}
                              className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-[10px] text-white/70 font-mono truncate"
                            />
                          </div>
                        </div>

                        <ImageStyleControls
                          compact
                          style={item.imageStyle}
                          onChange={(nextStyle) =>
                            setDraftGalleryItems(
                              draftGalleryItems.map((g) => (g.id === item.id ? { ...g, imageStyle: nextStyle } : g))
                            )
                          }
                          themeColors={draftThemeColors}
                          onOpenBgRemover={() =>
                            setBgRemoverTarget({
                              image: item.image || '',
                              label: `Gallery: ${item.title}`,
                              onApply: (url) =>
                                setDraftGalleryItems((prev) =>
                                  prev.map((g) => (g.id === item.id ? { ...g, image: url } : g))
                                ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveAndApply('Gallery Tiles')}
                      className="px-6 py-3 rounded-full bg-[#ebd2d8] text-[#3d111e] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:bg-[#efeee9]"
                    >
                      <Save size={14} /> <span>Save &amp; Confirm Gallery Tiles</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: ULTRA COLLECTION PRODUCT */}
              {adminTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">Ultra Collection Products</h4>
                      <p className="text-xs text-white/60">Manage your Ultra Tongue Scraper products, MWK prices, descriptions, and photo uploads.</p>
                    </div>
                    {draftUltraProducts.length < 3 && (
                      <button
                        onClick={() => {
                          setDraftUltraProducts(JSON.parse(JSON.stringify(DEFAULT_STUDIO_FORMAT.ultraProducts)));
                        }}
                        className="px-4 py-2 rounded-xl bg-[#ebd2d8] text-[#3d111e] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <RotateCcw size={14} /> <span>Restore 3 ULTRA Products</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {draftUltraProducts.map((prod) => (
                      <div key={prod.id} className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-white/60 mb-0.5">Product Title</label>
                              <input
                                type="text"
                                value={prod.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDraftUltraProducts(draftUltraProducts.map((p) => (p.id === prod.id ? { ...p, title: val } : p)));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-bold"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-white/60 mb-0.5">Price (MWK)</label>
                                <input
                                  type="number"
                                  value={prod.price}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setDraftUltraProducts(draftUltraProducts.map((p) => (p.id === prod.id ? { ...p, price: val } : p)));
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-white/60 mb-0.5">Category</label>
                                <input
                                  type="text"
                                  value={prod.category}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftUltraProducts(draftUltraProducts.map((p) => (p.id === prod.id ? { ...p, category: val } : p)));
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-white/60 mb-0.5">Product Description</label>
                              <textarea
                                rows={2}
                                value={prod.description || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDraftUltraProducts(draftUltraProducts.map((p) => (p.id === prod.id ? { ...p, description: val } : p)));
                                }}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black flex items-center justify-center">
                            {prod.image?.trim() ? (
                              <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={18} className="text-white/30" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <span className="block text-[10px] uppercase font-bold text-white/60">Primary Cover Photo</span>
                            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer w-full justify-center">
                              <Upload size={14} />
                              <span>Upload Cover Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const targetId = prod.id;
                                  handleFileUpload(e, (url) =>
                                    setDraftUltraProducts((prev) =>
                                      prev.map((p) => (p.id === targetId ? { ...p, image: url } : p))
                                    )
                                  );
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Additional Uploads */}
                        <div className="p-3.5 rounded-xl bg-black/35 border border-white/10 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#ebd2d8]">
                                Additional Uploads ({(prod.additionalImages || []).length}/10)
                              </span>
                              <span className="text-[10px] text-white/50">Shown inside the gallery when a visitor clicks the product.</span>
                            </div>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] text-[11px] font-bold uppercase tracking-wider cursor-pointer shrink-0">
                              <Plus size={13} />
                              <span>Add Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const targetId = prod.id;
                                  handleMultiFileUpload(e, (urls) =>
                                    setDraftUltraProducts((prev) =>
                                      prev.map((p) =>
                                        p.id === targetId
                                          ? {
                                              ...p,
                                              additionalImages: [...(p.additionalImages || []), ...urls].slice(0, 10),
                                            }
                                          : p
                                      )
                                    )
                                  );
                                }}
                              />
                            </label>
                          </div>

                          {(prod.additionalImages || []).length > 0 && (
                            <div className="flex flex-wrap gap-2.5">
                              {(prod.additionalImages || []).map((extraUrl, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/15 bg-black group">
                                  <img src={extraUrl} alt={`Additional ${idx + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraftUltraProducts((prev) =>
                                        prev.map((p) =>
                                          p.id === prod.id
                                            ? {
                                                ...p,
                                                additionalImages: (p.additionalImages || []).filter((_, i) => i !== idx),
                                              }
                                            : p
                                        )
                                      )
                                    }
                                    className="absolute top-1 right-1 p-1 rounded bg-black/75 text-red-400 hover:text-red-300 opacity-90 cursor-pointer"
                                    title="Remove photo"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <ImageStyleControls
                          compact
                          style={prod.imageStyle}
                          onChange={(nextStyle) =>
                            setDraftUltraProducts(
                              draftUltraProducts.map((p) => (p.id === prod.id ? { ...p, imageStyle: nextStyle } : p))
                            )
                          }
                          themeColors={draftThemeColors}
                          onOpenBgRemover={() =>
                            setBgRemoverTarget({
                              image: prod.image || '',
                              label: `Product: ${prod.title}`,
                              onApply: (url) =>
                                setDraftUltraProducts((prev) =>
                                  prev.map((p) => (p.id === prod.id ? { ...p, image: url } : p))
                                ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveAndApply('Ultra Collection')}
                      className="px-6 py-3 rounded-full bg-[#ebd2d8] text-[#3d111e] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:bg-[#efeee9]"
                    >
                      <Save size={14} /> <span>Save &amp; Confirm Product</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 6: THEME COLORS */}
              {adminTab === 'colors' && (
                <div className="space-y-6">
                  {/* Local Live Preview Banner */}
                  <div className="p-5 rounded-2xl bg-[#141414] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase text-[#ebd2d8] tracking-wider">
                      <span className="flex items-center gap-2"><Eye size={16} /> Local Palette Preview</span>
                    </div>
                    <div className="p-4 rounded-xl flex items-center justify-between border border-white/10" style={{ backgroundColor: draftThemeColors.wine, color: draftThemeColors.cream }}>
                      <div>
                        <span className="font-bold text-sm block">Theme Palette Live Test</span>
                        <span className="text-xs italic" style={{ color: draftThemeColors.blush }}>Blush Accent Subtitle</span>
                      </div>
                      <div className="px-4 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: draftThemeColors.wellnessBg, color: draftThemeColors.wellnessIcon }}>
                        Wellness Icon Tag
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">Theme Colors &amp; Preset Palettes</h4>
                    <p className="text-xs text-white/60">Choose from 10 curated editorial palettes or customize individual section and icon colors.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    {[
                      { name: 'Wine & Sage', wine: '#3d111e', blush: '#ebd2d8', cardBg: '#52192b', cream: '#efeee9', wellnessBg: '#637341', wellnessIcon: '#d1dee7' },
                      { name: 'Obsidian & Gold', wine: '#0f0f0f', blush: '#d4af37', cardBg: '#1a1a1a', cream: '#fcfbfa', wellnessBg: '#1c2419', wellnessIcon: '#e5c158' },
                      { name: 'Nordic Sage', wine: '#2f3e35', blush: '#a3b19a', cardBg: '#3a4d40', cream: '#f4f6f4', wellnessBg: '#243329', wellnessIcon: '#c1d0c4' },
                      { name: 'Navy & Copper', wine: '#0b1329', blush: '#b87333', cardBg: '#131f3d', cream: '#ffffff', wellnessBg: '#142838', wellnessIcon: '#e8a87c' },
                      { name: 'Terracotta & Ochre', wine: '#4a2c2a', blush: '#e3bc9a', cardBg: '#5c3835', cream: '#fbf7f4', wellnessBg: '#3b2321', wellnessIcon: '#f2d1b3' },
                      { name: 'Emerald & Champ.', wine: '#113222', blush: '#e6d5b8', cardBg: '#1b4d36', cream: '#f9f6f0', wellnessBg: '#0e291b', wellnessIcon: '#ebd2b2' },
                      { name: 'Charcoal & Rose', wine: '#1c1c1e', blush: '#d4a5a5', cardBg: '#2c2c2e', cream: '#f2f2f7', wellnessBg: '#282428', wellnessIcon: '#f2c4c4' },
                      { name: 'Plum & Lavender', wine: '#301934', blush: '#b57edc', cardBg: '#432448', cream: '#f9f5fa', wellnessBg: '#241228', wellnessIcon: '#d8b4e2' },
                      { name: 'Espresso & Caramel', wine: '#2b1d16', blush: '#c68b59', cardBg: '#3d281f', cream: '#fdfbf7', wellnessBg: '#211611', wellnessIcon: '#e5b892' },
                      { name: 'Minimalist Mono', wine: '#111111', blush: '#ffffff', cardBg: '#222222', cream: '#ffffff', wellnessBg: '#1a1a1a', wellnessIcon: '#e0e0e0' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() =>
                          setDraftThemeColors({
                            wine: preset.wine,
                            blush: preset.blush,
                            cardBg: preset.cardBg,
                            cream: preset.cream,
                            wellnessBg: preset.wellnessBg,
                            wellnessIcon: preset.wellnessIcon,
                          })
                        }
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                          draftThemeColors.wine === preset.wine && draftThemeColors.wellnessBg === preset.wellnessBg
                            ? 'border-[#ebd2d8] bg-white/10 ring-2 ring-[#ebd2d8]'
                            : 'border-white/10 bg-[#141414]'
                        }`}
                      >
                        <span className="text-[11px] font-bold uppercase text-white truncate">{preset.name}</span>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.wine }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.blush }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.wellnessBg }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.wellnessIcon }} />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Individual Section Color Controls */}
                  <div className="border-t border-white/10 pt-6">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Section &amp; Icon Color Customization</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold uppercase text-white">Primary Page BG</span>
                          <span className="text-[10px] text-white/50">{draftThemeColors.wine}</span>
                        </div>
                        <input
                          type="color"
                          value={draftThemeColors.wine}
                          onChange={(e) => setDraftThemeColors({ ...draftThemeColors, wine: e.target.value })}
                          className="w-8 h-8 rounded-md cursor-pointer bg-transparent border-0"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold uppercase text-white">Blush Accent</span>
                          <span className="text-[10px] text-white/50">{draftThemeColors.blush}</span>
                        </div>
                        <input
                          type="color"
                          value={draftThemeColors.blush}
                          onChange={(e) => setDraftThemeColors({ ...draftThemeColors, blush: e.target.value })}
                          className="w-8 h-8 rounded-md cursor-pointer bg-transparent border-0"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold uppercase text-white">Wellness Section BG</span>
                          <span className="text-[10px] text-white/50">{draftThemeColors.wellnessBg}</span>
                        </div>
                        <input
                          type="color"
                          value={draftThemeColors.wellnessBg}
                          onChange={(e) => setDraftThemeColors({ ...draftThemeColors, wellnessBg: e.target.value })}
                          className="w-8 h-8 rounded-md cursor-pointer bg-transparent border-0"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold uppercase text-white">Wellness Icon Tint</span>
                          <span className="text-[10px] text-white/50">{draftThemeColors.wellnessIcon}</span>
                        </div>
                        <input
                          type="color"
                          value={draftThemeColors.wellnessIcon}
                          onChange={(e) => setDraftThemeColors({ ...draftThemeColors, wellnessIcon: e.target.value })}
                          className="w-8 h-8 rounded-md cursor-pointer bg-transparent border-0"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold uppercase text-white">Card Background</span>
                          <span className="text-[10px] text-white/50">{draftThemeColors.cardBg}</span>
                        </div>
                        <input
                          type="color"
                          value={draftThemeColors.cardBg}
                          onChange={(e) => setDraftThemeColors({ ...draftThemeColors, cardBg: e.target.value })}
                          className="w-8 h-8 rounded-md cursor-pointer bg-transparent border-0"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold uppercase text-white">Cream Text</span>
                          <span className="text-[10px] text-white/50">{draftThemeColors.cream}</span>
                        </div>
                        <input
                          type="color"
                          value={draftThemeColors.cream}
                          onChange={(e) => setDraftThemeColors({ ...draftThemeColors, cream: e.target.value })}
                          className="w-8 h-8 rounded-md cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveAndApply('Theme Colors')}
                      className="px-6 py-3 rounded-full bg-[#ebd2d8] text-[#3d111e] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:bg-[#efeee9]"
                    >
                      <Save size={14} /> <span>Save &amp; Confirm Theme Colors</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 7: SAVED FORMAT CODE SNAPSHOT */}
              {adminTab === 'code' && (() => {
                const draftSnapshot: StudioFormatSnapshot = {
                  heroConfig: draftHeroConfig,
                  sectionCopy: draftSectionCopy,
                  qualifierBullets: draftQualifierBullets,
                  themeColors: draftThemeColors,
                  galleryFilter: draftGalleryFilter,
                  textAnimStyle: draftTextAnimStyle,
                  galleryItems: draftGalleryItems,
                  blogPosts: draftBlogPosts,
                  ultraProducts: draftUltraProducts,
                };
                const formattedCode = generateStudioFormatCode(draftSnapshot);
                return (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">Current Studio Format Code</h4>
                        <p className="text-xs text-white/60">
                          All layout presets, palette colors, animations, gallery tiles, journal posts, and gear captured as TypeScript code.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(formattedCode);
                              setCodeCopied(true);
                              setTimeout(() => setCodeCopied(false), 2000);
                            } catch {
                              // Fallback ignored
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          {codeCopied ? <Check size={14} className="text-[#25D366]" /> : <Copy size={14} />}
                          <span>{codeCopied ? 'Copied' : 'Copy Code'}</span>
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([formattedCode], { type: 'text/typescript' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'studioFormat.ts';
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Download size={14} />
                          <span>Download .ts</span>
                        </button>
                        <button
                          onClick={() => {
                            setDraftHeroConfig({ ...DEFAULT_STUDIO_FORMAT.heroConfig });
                            setDraftSectionCopy({ ...DEFAULT_STUDIO_FORMAT.sectionCopy });
                            setDraftQualifierBullets([...DEFAULT_STUDIO_FORMAT.qualifierBullets]);
                            setDraftThemeColors({ ...DEFAULT_STUDIO_FORMAT.themeColors });
                            setDraftGalleryFilter(DEFAULT_STUDIO_FORMAT.galleryFilter);
                            setDraftTextAnimStyle(DEFAULT_STUDIO_FORMAT.textAnimStyle);
                            setDraftGalleryItems(JSON.parse(JSON.stringify(DEFAULT_STUDIO_FORMAT.galleryItems)));
                            setDraftBlogPosts(JSON.parse(JSON.stringify(DEFAULT_STUDIO_FORMAT.blogPosts)));
                            setDraftUltraProducts(JSON.parse(JSON.stringify(DEFAULT_STUDIO_FORMAT.ultraProducts)));
                          }}
                          className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw size={14} />
                          <span>Reset to Code Defaults</span>
                        </button>
                      </div>
                    </div>

                    <pre className="p-4 sm:p-5 rounded-2xl bg-black/70 border border-white/15 text-[11px] sm:text-xs font-mono text-[#ebd2d8] overflow-x-auto max-h-[50vh] leading-relaxed">
                      {formattedCode}
                    </pre>
                  </div>
                );
              })()}

              {/* TAB 8: FIREBASE & AUTHENTICATION DIAGNOSTIC CENTER */}
              {adminTab === 'firebase' && (
                <div className="space-y-6">
                  {/* Top Diagnostic Header & Trigger */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-black/80 via-[#202020] to-[#151515] border border-white/15 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ebd2d8]">
                          <ShieldCheck size={16} />
                          <span>Firebase & Auth Diagnostic Center</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          Live Health Check & Domain Configuration
                        </h4>
                        <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
                          Verify Firestore database connectivity, troubleshoot domain authorization for Vercel/custom hosting, verify the Google sign-in provider, and export verified environment variables.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isRunningDiagnostic}
                          onClick={() => void handleRunDiagnostics()}
                          className="px-4 py-2.5 rounded-xl bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-60"
                        >
                          <RefreshCw size={14} className={isRunningDiagnostic ? 'animate-spin' : ''} />
                          <span>{isRunningDiagnostic ? 'Testing Connection...' : 'Run Diagnostics'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Diagnostic Summary Bar */}
                    {diagnosticReport && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                          <Server className={diagnosticReport.firestoreConnected ? 'text-[#25D366]' : 'text-red-400'} size={20} />
                          <div>
                            <div className="text-[10px] uppercase font-bold text-white/50">Firestore DB</div>
                            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                              <span>{diagnosticReport.firestoreConnected ? 'Connected' : 'Offline / Error'}</span>
                              {diagnosticReport.firestoreConnected && (
                                <span className="text-[10px] text-[#25D366] font-mono">({diagnosticReport.firestoreLatencyMs}ms)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                          <Globe className={diagnosticReport.domainAuthorizedStatus === 'authorized_by_default' ? 'text-[#25D366]' : 'text-amber-400'} size={20} />
                          <div>
                            <div className="text-[10px] uppercase font-bold text-white/50">Current Domain</div>
                            <div className="text-xs font-semibold text-white truncate max-w-[180px]">
                              {diagnosticReport.currentHostname}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                          <User className={diagnosticReport.isAdmin ? 'text-[#25D366]' : 'text-amber-400'} size={20} />
                          <div>
                            <div className="text-[10px] uppercase font-bold text-white/50">Admin Session</div>
                            <div className="text-xs font-semibold text-white truncate max-w-[180px]">
                              {diagnosticReport.currentUserEmail || 'Not Signed In'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 1: DOMAIN AUTHORIZATION HELPER (Fixes auth/unauthorized-domain) */}
                  <div className="p-5 rounded-2xl bg-black/50 border border-white/15 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ebd2d8]">
                          <Globe size={15} />
                          <span>1. Authorized Domains Setup (Fixes "auth/unauthorized-domain")</span>
                        </div>
                        <p className="text-xs text-white/70 mt-1 leading-relaxed">
                          Firebase Authentication strictly blocks Google Sign-In popups on any domain that is not registered in your project's Authorized domains list.
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.endsWith('.firebaseapp.com'))
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.endsWith('.firebaseapp.com'))
                          ? 'Localhost / Default'
                          : 'Live / Custom Domain'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#181818] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/50 block font-bold">Detected Hostname</span>
                        <code className="text-sm font-mono text-[#ebd2d8] font-bold">
                          {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.hostname : '');
                              setDomainCopied(true);
                              setTimeout(() => setDomainCopied(false), 2000);
                            } catch {
                              // Ignore
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          {domainCopied ? <Check size={14} className="text-[#25D366]" /> : <Copy size={14} />}
                          <span>{domainCopied ? 'Copied Hostname' : 'Copy Hostname'}</span>
                        </button>
                        <a
                          href={FIREBASE_CONSOLE_URLS.authorizedDomains}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <span>Open Authorized Domains</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>

                    <div className="text-xs text-white/60 space-y-1.5 pl-2 border-l-2 border-[#ebd2d8]/40">
                      <p className="font-semibold text-white/80">3-Step Resolution for Vercel or Custom Domains:</p>
                      <ol className="list-decimal list-inside space-y-1 text-white/70">
                        <li>Click <strong>Copy Hostname</strong> above to copy your domain.</li>
                        <li>Click <strong>Open Authorized Domains</strong> to go directly to <em>Firebase Console → Authentication → Settings</em>.</li>
                        <li>Under <em>Authorized domains</em>, click <strong>Add domain</strong>, paste the copied hostname (without <code>https://</code> or trailing slashes), and click <strong>Save</strong>.</li>
                      </ol>
                    </div>
                  </div>

                  {/* SECTION 2: GOOGLE SIGN-IN PROVIDER VERIFICATION (Fixes auth/operation-not-allowed) */}
                  <div className="p-5 rounded-2xl bg-black/50 border border-white/15 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ebd2d8]">
                          <Key size={15} />
                          <span>2. Google Sign-In Provider (Fixes "auth/operation-not-allowed")</span>
                        </div>
                        <p className="text-xs text-white/70 mt-1 leading-relaxed">
                          In Firebase Authentication, Google must be enabled as a sign-in provider with a project support email set.
                        </p>
                      </div>
                      <a
                        href={FIREBASE_CONSOLE_URLS.signInProviders}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Open Sign-In Methods</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-[#181818] border border-white/10 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-white/50 block">Authorized Studio Admin Email</span>
                        <div className="text-sm font-mono text-[#ebd2d8] font-bold">{ADMIN_EMAIL}</div>
                        <p className="text-[11px] text-white/60">
                          Firestore rules grant write permissions exclusively to this email or verified admins.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#181818] border border-white/10 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-white/50 block">Current Google Authentication</span>
                        {adminUser ? (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-white truncate">{adminUser.email}</div>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isAdminVerified ? 'text-[#25D366]' : 'text-amber-400'}`}>
                                {isAdminVerified ? 'Verified Studio Admin ✓' : 'Unprivileged User Account'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => void signOutAdmin()}
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Sign Out
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-white/50 italic">No admin signed in</span>
                            <button
                              type="button"
                              onClick={() => void handleAdminSignIn()}
                              className="px-3.5 py-1.5 rounded-lg bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow"
                            >
                              Sign In with Google
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-white/60 space-y-1.5 pl-2 border-l-2 border-[#ebd2d8]/40">
                      <p className="font-semibold text-white/80">How to Enable Google Provider:</p>
                      <ol className="list-decimal list-inside space-y-1 text-white/70">
                        <li>Go to <em>Firebase Console → Authentication → Sign-in method</em>.</li>
                        <li>Click <strong>Google</strong> in the provider list.</li>
                        <li>Switch <strong>Enable</strong> toggle to ON.</li>
                        <li>Select <code>{ADMIN_EMAIL}</code> as Project support email and click <strong>Save</strong>.</li>
                      </ol>
                    </div>
                  </div>

                  {/* SECTION 3: VERCEL ENVIRONMENT VARIABLES */}
                  <div className="p-5 rounded-2xl bg-black/50 border border-white/15 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ebd2d8]">
                          <Server size={15} />
                          <span>3. Vercel & Production Environment Variables</span>
                        </div>
                        <p className="text-xs text-white/70 mt-1 leading-relaxed">
                          If your git repository contains <code>firebase-applet-config.json</code>, Vercel bundles it automatically without extra environment variables. If you configure env vars in Vercel, they must match these exact keys:
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(VERCEL_ENV_CONFIG_SNIPPET);
                            setEnvCopied(true);
                            setTimeout(() => setEnvCopied(false), 2000);
                          } catch {
                            // Ignore
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {envCopied ? <Check size={14} className="text-[#25D366]" /> : <Copy size={14} />}
                        <span>{envCopied ? 'Copied Env Vars' : 'Copy All 7 Env Vars'}</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-black border border-white/10 font-mono text-[11px] sm:text-xs text-[#ebd2d8] leading-relaxed overflow-x-auto">
                      {VERCEL_ENV_CONFIG_SNIPPET}
                    </pre>

                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                      <strong>Critical Note on Database ID:</strong> Do not set <code>VITE_FIREBASE_DATABASE_ID</code> to <code>(default)</code> in Vercel. This project uses the named database <code>{firebaseConfig.firestoreDatabaseId}</code>.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 sm:px-8 sm:py-4 border-t border-white/10 bg-[#141414] flex items-center justify-between gap-3">
              <span className="hidden sm:inline text-xs text-white/50">
                {adminUser && isAdminVerified
                  ? `Connected to Firestore as ${adminUser.email} • Live sync active`
                  : `Draft edits preview locally • Sign in (${ADMIN_EMAIL}) when saving to sync across all devices`}
              </span>
              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsAdminOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 sm:px-5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isSavingCloud}
                  onClick={async () => {
                    const ok = await handleSaveAndApply();
                    if (ok) setIsAdminOpen(false);
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 sm:px-6 rounded-full bg-[#ebd2d8] text-[#3d111e] text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-[#efeee9] disabled:opacity-60 transition-all cursor-pointer disabled:cursor-wait flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{isSavingCloud ? 'Syncing...' : 'Save & Close'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1:1 CONSULTATION BOOKING MODAL */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-[#f6f1ea] text-[#3d111e] rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-10">
            <button onClick={() => setIsBookingOpen(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-[#3d111e]/5 text-[#3d111e] hover:bg-[#3d111e]/10 cursor-pointer">
              <X size={18} />
            </button>
            {!isSubmitted ? (
              <form onSubmit={handleBookingSubmit} className="space-y-4 sm:space-y-6">
                <div className="pr-8">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#3d111e]/60 font-semibold block mb-1">Step {bookingStep} of 2</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#3d111e]">
                    {bookingStep === 1 ? 'Select Your Session Type' : 'Client Intake & Schedule'}
                  </h3>
                </div>
                {bookingStep === 1 ? (
                  <div className="space-y-2.5 sm:space-y-3">
                    {[
                      { title: 'Reformer 1:1 Elite Container', desc: '60 minutes private reformer session.', price: '$150 / session' },
                      { title: 'Posture & Core Sculpt', desc: 'Targeted spine decompression & stability.', price: '$175 / session' },
                      { title: 'Milestone Preparation Container', desc: 'Intensive 4-week private coaching block.', price: '$650 / package' },
                    ].map((item) => (
                      <div key={item.title} onClick={() => setSelectedSession(item.title)} className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer ${selectedSession === item.title ? 'bg-[#ebd2d8] border-[#3d111e]' : 'bg-white/80 border-[#3d111e]/10'}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-xs sm:text-sm">{item.title}</span>
                          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-[#3d111e] text-[#efeee9] shrink-0">{item.price}</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#3d111e]/70">{item.desc}</p>
                      </div>
                    ))}
                    <button type="button" onClick={() => setBookingStep(2)} className="w-full mt-3 sm:mt-4 py-3.5 sm:py-4 rounded-full bg-[#3d111e] text-[#efeee9] text-xs font-bold tracking-widest uppercase shadow-lg cursor-pointer">
                      Continue to Schedule
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-[#3d111e]/80">Full Name</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Marcus Holloway" className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white border border-[#3d111e]/15 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-[#3d111e]/80">Email Address</label>
                        <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="marcus@example.com" className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white border border-[#3d111e]/15 text-sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3 pt-2">
                      <button type="button" onClick={() => setBookingStep(1)} className="px-5 py-3.5 sm:px-6 sm:py-4 rounded-full bg-white border border-[#3d111e]/20 text-[#3d111e] text-xs font-bold uppercase cursor-pointer">Back</button>
                      <button type="submit" className="flex-1 py-3.5 sm:py-4 rounded-full bg-[#3d111e] text-[#efeee9] text-xs font-bold uppercase shadow-lg cursor-pointer">Confirm Request</button>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="text-center py-6 sm:py-8 space-y-4 sm:space-y-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#3d111e] text-[#efeee9] flex items-center justify-center mx-auto text-xl sm:text-2xl shadow-xl">✓</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#3d111e]">We'll See You in Studio</h3>
                <p className="text-xs sm:text-sm text-[#3d111e]/80 max-w-sm mx-auto">Thank you, {formData.name}. Your consultation for {selectedSession} on {formData.date} at {formData.time} has been reserved.</p>
                <button onClick={() => setIsBookingOpen(false)} className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-[#3d111e] text-[#efeee9] text-xs font-bold uppercase shadow-lg cursor-pointer">Return to Portfolio</button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* BACKGROUND REMOVER MODAL */}
      <BackgroundRemoverModal
        isOpen={Boolean(bgRemoverTarget)}
        initialImage={bgRemoverTarget?.image}
        targetLabel={bgRemoverTarget?.label}
        onClose={() => setBgRemoverTarget(null)}
        onApply={(url) => bgRemoverTarget?.onApply(url)}
      />
    </div>
  );
}
