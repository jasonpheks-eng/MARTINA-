import workoutBlogImg from './assets/images/workout_reformer_blog_1795354781369.jpg';
import peaceBlogImg from './assets/images/peace_breath_blog_1795354780936.jpg';
import loveBlogImg from './assets/images/love_connection_blog_1795354781077.jpg';

export type GalleryFilterMode = 'all' | 'compact' | 'large' | 'minimal';
export type TextAnimStyle = 'marquee' | 'pulse' | 'float' | 'fadeUp' | 'none';

export type WellnessPillarId = 'healthy' | 'workout' | 'food' | 'peace' | 'love';

export type PillarIconName =
  | 'Sprout'
  | 'Dumbbell'
  | 'Utensils'
  | 'Wind'
  | 'Heart'
  | 'Sparkles'
  | 'Sun'
  | 'Flame'
  | 'Compass'
  | 'Feather'
  | 'Activity';

export interface WellnessPillarMeta {
  id: WellnessPillarId;
  number: string;
  label: string;
  meaning: string;
  description: string;
  benefits: string[];
  defaultIcon: PillarIconName;
  floatClass: string;
  delay: string;
}

export const WELLNESS_PILLARS: WellnessPillarMeta[] = [
  {
    id: 'healthy',
    number: '01',
    label: 'HEALTHY',
    meaning: 'Vitality & Organic Growth',
    description:
      'Nurture your physical body with mindful daily habits, spinal alignment, and natural vitality routines.',
    benefits: ['Cellular Regeneration', 'Spinal Decompression', 'Immune System Boost'],
    defaultIcon: 'Sprout',
    floatClass: 'float-1',
    delay: '0s',
  },
  {
    id: 'workout',
    number: '02',
    label: 'WORK OUT',
    meaning: 'Strength & Dynamic Movement',
    description:
      'Engage deep core stabilization, reformer resistance flows, and functional athletic endurance.',
    benefits: ['Increased Muscular Tone', 'Core Stability', 'Enhanced Metabolic Rate'],
    defaultIcon: 'Dumbbell',
    floatClass: 'float-2',
    delay: '-1s',
  },
  {
    id: 'food',
    number: '03',
    label: 'FOOD',
    meaning: 'Nourishment & Vital Fuel',
    description:
      'Fuel your journey with high-vibrational, anti-inflammatory whole foods and conscious hydration.',
    benefits: ['Sustained Energy Levels', 'Improved Gut Microbiome', 'Clarity of Focus'],
    defaultIcon: 'Utensils',
    floatClass: 'float-3',
    delay: '-2.5s',
  },
  {
    id: 'peace',
    number: '04',
    label: 'PEACE',
    meaning: 'Stillness & Breath Flow',
    description:
      'Calm the nervous system with diaphragmatic breathwork, thermal relaxation, and silent meditation.',
    benefits: ['Reduced Cortisol Levels', 'Mental Clarity', 'Restorative Sleep Quality'],
    defaultIcon: 'Wind',
    floatClass: 'float-4',
    delay: '-0.5s',
  },
  {
    id: 'love',
    number: '05',
    label: 'LOVE',
    meaning: 'Connection & Self-Compassion',
    description:
      'Cultivate deep gratitude, emotional resilience, and compassionate presence with self and others.',
    benefits: ['Heart Rate Variability Sync', 'Emotional Balance', 'Deeper Relationships'],
    defaultIcon: 'Heart',
    floatClass: 'float-5',
    delay: '-3.2s',
  },
];

export interface ImageStyleConfig {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  flipX?: boolean;
  flipY?: boolean;
  blendMode?: 'normal' | 'screen' | 'multiply' | 'lighten';
  bgColor?: string;
  matchTheme?: boolean;
  fit?: 'cover' | 'contain';
  rounded?: 'none' | 'md' | 'full';
  opacity?: number;
}

export interface HeroConfig {
  logoImage?: string;
  logoText?: string;
  logoSize?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
  logoFlipX?: boolean;
  logoFlipY?: boolean;
  logoBgColor?: string;
  logoMatchTheme?: boolean;
  logoBlendMode?: 'normal' | 'screen' | 'multiply' | 'lighten';
  logoRounded?: 'none' | 'md' | 'full';
  logoOpacity?: number;
  bgImage: string;
  bgImageStyle?: ImageStyleConfig;
  portraitImage: string;
  portraitImageStyle?: ImageStyleConfig;
  marqueeText: string;
  kicker?: string;
  headlinePart1: string;
  headlineAccent: string;
  headlinePart2: string;
  subheadline: string;
}

export interface SectionCopyConfig {
  qualifierKicker: string;
  qualifierTitle: string;
  qualifierSubtitle: string;
  wellnessKicker: string;
  wellnessTitle: string;
  wellnessSubtitle: string;
  galleryKicker: string;
  galleryTitle: string;
  gallerySubtitle: string;
  blogKicker: string;
  blogTitle: string;
  blogSubtitle: string;
  ultraKicker: string;
  ultraTitle: string;
  ultraSubtitle: string;
}

export interface ThemeColors {
  wine: string;
  blush: string;
  cardBg: string;
  cream: string;
  wellnessBg: string;
  wellnessIcon: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  imageStyle?: ImageStyleConfig;
  size: string;
  textPosition: string;
}

export interface BlogPost {
  id: number;
  title: string;
  subtitle?: string;
  excerpt: string;
  content?: string;
  date: string;
  category: string;
  image: string;
  additionalImages?: string[];
  imageStyle?: ImageStyleConfig;
  author?: string;
  readTime?: string;
  featured?: boolean;
  status?: 'published' | 'draft';
  takeaways?: string[];
  pillarId?: WellnessPillarId | string;
  pillarIcon?: PillarIconName | string;
  pillarMeaning?: string;
}

export interface UltraProduct {
  id: number;
  title: string;
  price: number;
  image: string;
  additionalImages?: string[];
  imageStyle?: ImageStyleConfig;
  category: string;
  description?: string;
}

export interface StudioFormatSnapshot {
  heroConfig: HeroConfig;
  sectionCopy: SectionCopyConfig;
  qualifierBullets: string[];
  themeColors: ThemeColors;
  galleryFilter: GalleryFilterMode;
  textAnimStyle: TextAnimStyle;
  galleryItems: GalleryItem[];
  blogPosts: BlogPost[];
  ultraProducts: UltraProduct[];
}

export const BG_IMAGE_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260729_022513_486985a2-ac8c-4278-91a8-071dcd9fcaff.png&w=1280&q=85';

export const HERO_IMAGE_URL = '/assets/aistudio/IMG_2315_2_7e376714.jpg';

export const PORTRAIT_IMAGE_URL = '';

export const REFERENCE_IMAGE_PATH = '/public/assets/aistudio/LANDING_PAGE_IDEA_a310be9f.jpg';

export const DEFAULT_SECTION_COPY: SectionCopyConfig = {
  qualifierKicker: 'Targeted Assessment',
  qualifierTitle: 'Who is this for?',
  qualifierSubtitle:
    '1:1 sessions are meticulously structured for individuals seeking dedicated, transformative guidance before group integration.',
  wellnessKicker: 'Holistic Flow Pillars',
  wellnessTitle: 'Wellness Journey',
  wellnessSubtitle:
    'Interactive organic floating pillars. Tap any animated icon to explore its meaning, benefits, and dedicated journal story.',
  galleryKicker: 'Visual Atmosphere',
  galleryTitle: 'The Studio Gallery',
  gallerySubtitle: 'Immersive editorial moments across our private reformer suites.',
  blogKicker: 'The Journal',
  blogTitle: 'ULTRA JOURNALS',
  blogSubtitle:
    'Short, visual studio reads paired directly with our five Wellness Journey icons.',
  ultraKicker: 'Curated Boutique Gear',
  ultraTitle: 'Ultra Collection',
  ultraSubtitle:
    'Professional grade reformer accessories and apparel. Swipe left-to-right, add to your studio basket, and check out directly via WhatsApp.',
};

export const DEFAULT_STUDIO_FORMAT: StudioFormatSnapshot = {
  heroConfig: {
    logoImage: '',
    logoText: 'ULTRA',
    logoSize: 40,
    logoOffsetX: 0,
    logoOffsetY: 0,
    logoBlendMode: 'normal',
    logoRounded: 'none',
    logoOpacity: 100,
    bgImage: HERO_IMAGE_URL,
    portraitImage: PORTRAIT_IMAGE_URL,
    marqueeText: 'ULTRA',
    kicker: 'Private Studio & 1:1 Coaching',
    headlinePart1: 'Stronger. Sculpted.',
    headlineAccent: 'Personally',
    headlinePart2: 'Guided.',
    subheadline: 'Private reformer coaching designed around your body, your goals, and your pace.',
  },
  sectionCopy: DEFAULT_SECTION_COPY,
  qualifierBullets: [
    'Beginners who want confidence before joining group classes',
    'Clients returning after injury (with medical clearance)',
    'Women wanting targeted sculpting results',
    'Busy professionals who value high efficiency',
    'Brides, events, or milestone preparation',
    'Anyone craving personalised attention',
  ],
  themeColors: {
    wine: '#3d111e',
    blush: '#ebd2d8',
    cardBg: '#52192b',
    cream: '#efeee9',
    wellnessBg: '#637341',
    wellnessIcon: '#d1dee7',
  },
  galleryFilter: 'all',
  textAnimStyle: 'marquee',
  galleryItems: [
    {
      id: 1,
      title: 'INTO THE CORE',
      subtitle: '01 / REFORMER DYNAMICS',
      image: REFERENCE_IMAGE_PATH,
      size: 'col-span-1 md:col-span-2 row-span-2',
      textPosition: 'bottom-left',
    },
    {
      id: 2,
      title: 'STUDIO SILENCE',
      subtitle: '02 / ALIGNMENT',
      image: '/assets/aistudio/image_cc7cdae4.png',
      size: 'col-span-1 row-span-1',
      textPosition: 'top-right',
    },
    {
      id: 3,
      title: 'INFRARED WARMTH',
      subtitle: '03 / FLOW',
      image: '/assets/aistudio/7_99768df9.png',
      size: 'col-span-1 row-span-2',
      textPosition: 'bottom-right',
    },
    {
      id: 4,
      title: 'PRECISION',
      subtitle: '04 / CONTROL',
      image: '/assets/aistudio/2_64ef2d00.png',
      imageStyle: { scale: 118 },
      size: 'col-span-1 md:col-span-2 row-span-1',
      textPosition: 'top-left',
    },
    {
      id: 5,
      title: 'BREATHE DEEP',
      subtitle: '05 / MINDSET',
      image: '/assets/aistudio/6_33d7af51.png',
      imageStyle: { scale: 118 },
      size: 'col-span-1 row-span-1',
      textPosition: 'bottom-center',
    },
    {
      id: 6,
      title: 'ELEVATED FORM',
      subtitle: '06 / SCULPT',
      image: '/assets/aistudio/image_706072f8.png',
      size: 'col-span-1 md:col-span-2 row-span-1',
      textPosition: 'top-center',
    },
  ],
  blogPosts: [
    {
      id: 1,
      title: 'Morning Spine & Sprout: Cultivating Daily Vitality',
      subtitle: 'Linked to the Sprout Icon — Vitality & Organic Growth',
      excerpt:
        'Tall posture starts before you step onto the reformer. Two minutes of morning spinal articulation awakens cellular circulation and sets a grounded tone for your day.',
      content: `Like a sprout rising through sunlit soil, lasting vitality is built through quiet consistency rather than strain. Decompressing your vertebrae each morning creates effortless space between joints before load is ever added.

> "True vitality grows daily—small alignment habits compound into resilient strength."

- Roll slowly through ten standing spinal roll-downs upon waking
- Pair gentle ribcage expansion with a full glass of mineral water`,
      date: 'Nov 2026',
      category: 'Vitality & Growth',
      image: '/assets/aistudio/1_9a57f70a.png',
      additionalImages: [
        '/assets/aistudio/1_9a57f70a.png',
        '/assets/aistudio/2_64ef2d00.png',
      ],
      author: 'ULTRA',
      readTime: '1 min read',
      featured: true,
      status: 'published',
      pillarId: 'healthy',
      pillarIcon: 'Sprout',
      pillarMeaning: 'Vitality & Organic Growth — Rooted spinal alignment, cellular renewal, and daily energy',
      takeaways: [
        'Decompress the spine before loading to protect joint longevity.',
        'Small daily posture rituals build sustainable energy.',
      ],
    },
    {
      id: 2,
      title: 'Precision Over Load: Deep Reformer Strength',
      subtitle: 'Linked to the Dumbbell Icon — Strength & Dynamic Movement',
      excerpt:
        'Controlled spring resistance targets deep postural stabilizers far more effectively than rushing heavy weights. Discover why slower carriage returns sculpt faster.',
      content: `Dynamic strength begins from your deep transverse core outward. On the reformer, lighter calibrated springs often expose subtle imbalances and demand cleaner stabilization than heavier resistance.

> "Strength without control is momentum; strength with precision becomes lasting form."

- Anchor your breath into the back and sides of your ribs before every press-out
- Count three full seconds on the carriage return to ignite deep core endurance`,
      date: 'Nov 2026',
      category: 'Reformer Mechanics',
      image: workoutBlogImg,
      author: 'ULTRA',
      readTime: '1 min read',
      featured: false,
      status: 'published',
      pillarId: 'workout',
      pillarIcon: 'Dumbbell',
      pillarMeaning: 'Strength & Dynamic Movement — Deep core control, spring resistance, and sculpted tone',
      takeaways: [
        'Slowing the eccentric return deepens muscular engagement.',
        'Precision spring tension builds athletic posture without bulk.',
      ],
    },
    {
      id: 3,
      title: 'Real Plates, Steady Energy: Three Studio Fuel Meals',
      subtitle: 'Linked to the Utensils Icon — Matcha Mornings, Harvest Pancakes & Spicy Chicken Wraps',
      excerpt:
        'Clean nourishment starts with food you genuinely enjoy. See three real plates—from spinach omelette and iced matcha to warm harvest pancakes and crispy spicy chicken avocado wraps.',
      content: `Great movement deserves food you genuinely look forward to eating. Rather than rigid meal rules, building balanced plates around protein, crisp vegetables, and satisfying carbs keeps your core responsive before and after every session.

## Morning Savory Plate & Iced Matcha
A folded spinach-and-herb omelette served alongside toasted brioche slices, glazed breakfast sausages, and a cold-whisked iced matcha delivers calm, steady alertness for early studio hours.

## Warm Protein Pancakes & Harvest Greens
Heavy training mornings pair three golden drizzled pancakes with sautéed mushrooms, pan-wilted spinach, sweet halved cherry tomatoes, crispy smoky bacon, and a double-walled iced coffee latte.

> "Nourishment works best when vibrant greens, satisfying protein, and real enjoyment share the same plate."

## Midday Spicy Chicken & Avocado Wrap
Between afternoon sessions, a char-toasted wrap packed with crispy spiced chicken, creamy avocado, shredded lettuce, crisp red peppers, ripe tomato, and light mayo keeps recovery sharp:

- Spicy seasoned chicken strips for post-session protein repair
- Smashed avocado, crisp lettuce, sweet red peppers, and tomato for hydration and crunch`,
      date: 'Nov 2026',
      category: 'Nourishment & Fuel',
      image: '/assets/aistudio/7_99768df9.png',
      additionalImages: [
        '/assets/aistudio/7_99768df9.png',
        '/assets/aistudio/6_33d7af51.png',
        '/assets/aistudio/5_d1decef2.png',
      ],
      author: 'ULTRA',
      readTime: '2 min read',
      featured: false,
      status: 'published',
      pillarId: 'food',
      pillarIcon: 'Utensils',
      pillarMeaning: 'Nourishment & Vital Fuel — Whole-food plates balanced for core energy, recovery, and joy',
      takeaways: [
        'Anchor mornings with protein and greens—from spinach omelettes and iced matcha to warm harvest pancakes.',
        'Balance afternoon wraps with crispy spiced chicken, creamy avocado, peppers, and fresh tomato.',
      ],
    },
    {
      id: 4,
      title: 'Three Slow Exhales: Resetting in Infrared Calm',
      subtitle: 'Linked to the Wind Icon — Stillness & Breath Flow',
      excerpt:
        'Your nervous system sets the ceiling for your physical recovery. Slow, extended exhales soften neck and hip gripping while restoring deep calm between flows.',
      content: `Just as warm air drifts effortlessly through an open window, unhurried breath clears physical tension. Extending each exhale slightly longer than your inhale invites your nervous system back into stillness.

> "Every slow exhale releases effort you no longer need to carry."

- Pause for three unhurried nasal breaths during reformer spring transitions
- Take two quiet minutes in studio warmth post-session to lower cortisol`,
      date: 'Oct 2026',
      category: 'Breath & Peace',
      image: peaceBlogImg,
      author: 'ULTRA',
      readTime: '1 min read',
      featured: false,
      status: 'published',
      pillarId: 'peace',
      pillarIcon: 'Wind',
      pillarMeaning: 'Stillness & Breath Flow — Diaphragmatic breathwork, lower cortisol, and calm focus',
      takeaways: [
        'Longer exhales immediately down-regulate jaw and hip tension.',
        'Brief post-session stillness improves sleep and recovery.',
      ],
    },
    {
      id: 5,
      title: 'Your Pace, Your Posture: The Heart of 1:1 Practice',
      subtitle: 'Linked to the Heart Icon — Connection & Self-Compassion',
      excerpt:
        'Progress thrives where comparison disappears. Dedicated 1:1 coaching adapts every spring setting and verbal cue around your unique anatomy and season of life.',
      content: `Self-compassion turns movement into a sustainable relationship rather than a chore. In a private container, every headrest angle and spring choice meets your body exactly where it is today.

> "When you honor your own pace, confidence and sculpted results arrive naturally."

- Celebrate clean spinal alignment over heavier spring settings
- Build unshakeable movement confidence in a calm, distraction-free space`,
      date: 'Oct 2026',
      category: 'Private Practice',
      image: loveBlogImg,
      author: 'ULTRA',
      readTime: '1 min read',
      featured: false,
      status: 'published',
      pillarId: 'love',
      pillarIcon: 'Heart',
      pillarMeaning: 'Connection & Self-Compassion — Personalized pace, body awareness, and emotional balance',
      takeaways: [
        'Private sessions honor your unique proportions and energy.',
        'Practicing without comparison builds lasting consistency.',
      ],
    },
  ],
  ultraProducts: [
    {
      id: 7,
      title: 'ULTRA Soft-Grip Tongue Scraper',
      price: 26000,
      image: '/assets/aistudio/4_e70af030.png',
      additionalImages: [],
      category: 'Oral Wellness',
      description:
        'Ergonomic stainless steel spoon scraper with a cushioned ribbed white grip. Promotes oral hygiene, reduces harmful bacteria, and enhances your sense of taste.',
    },
    {
      id: 8,
      title: 'ULTRA Classic Solid Tongue Scraper',
      price: 24000,
      image: '/assets/aistudio/ultra_scraper_solid.png',
      additionalImages: [],
      category: 'Oral Wellness',
      description:
        'Sleek full-metal stainless steel spoon tongue scraper with a slim precision handle and hanging loop. Promotes oral hygiene, reduces harmful bacteria, and enhances taste.',
    },
    {
      id: 9,
      title: 'ULTRA U-Curve Arch Tongue Scraper',
      price: 28000,
      image: '/assets/aistudio/ultra_scraper_arch.png',
      additionalImages: [],
      category: 'Oral Wellness',
      description:
        'Dual-handle flexible U-curve stainless steel arch scraper engineered for full-width surface coverage. Promotes oral hygiene, reduces harmful bacteria, and enhances taste.',
    },
  ],
};

export const LEGACY_UNSOLD_PRODUCT_TITLES = new Set([
  'Signature Pilates Grip Socks',
  'Pro Reformer Resistance Band Set',
  'Infrared Wellness Mat',
  'Core Sculpting Ball Set',
  'Silk Eye Pillow & Recovery Kit',
  'Organic Cotton Studio Crop Tank',
  'ULTRA Tongue Scraper Collection',
]);

export function normalizeUltraProductPrice(price: number): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  const rounded = Math.round(price);
  // Migrate legacy USD prices (e.g., 24, 26, 28) to MWK thousands (24000, 26000, 28000)
  return rounded < 500 ? rounded * 1000 : rounded;
}

export function migrateUltraProducts(products: UltraProduct[] | undefined | null): UltraProduct[] {
  if (!products || products.length === 0) {
    return DEFAULT_STUDIO_FORMAT.ultraProducts;
  }

  const activeProducts = products.filter(
    (p) => !LEGACY_UNSOLD_PRODUCT_TITLES.has(p.title)
  );

  if (activeProducts.length === 0) {
    return DEFAULT_STUDIO_FORMAT.ultraProducts;
  }

  const isLegacySingleScraper =
    activeProducts.length === 1 &&
    (activeProducts[0].id === 7 || /tongue\s*scraper/i.test(activeProducts[0].title)) &&
    activeProducts[0].price < 1000;

  if (isLegacySingleScraper) {
    return DEFAULT_STUDIO_FORMAT.ultraProducts;
  }

  return activeProducts.map((p) => {
    const cleanExtras = (p.additionalImages || []).filter(
      (img) => !img.includes('image_8f6de05c.png') && !img.includes('3_8ce33e94.png')
    );
    const normalizedPrice = normalizeUltraProductPrice(p.price);
    const nextTitle =
      p.title === 'ULTRA Stainless Tongue Scraper' && p.id === 7
        ? DEFAULT_STUDIO_FORMAT.ultraProducts[0].title
        : p.title;
    return {
      ...p,
      title: nextTitle,
      price: normalizedPrice,
      additionalImages: cleanExtras,
    };
  });
}

export const PREVIOUS_DEFAULT_BLOG_TITLES = new Set([
  'The Science of Deep Core Engagement in Reformer Pilates',
  'Why 1:1 Private Coaching Outperforms Group Classes for Beginners',
  'Vitality & Organic Growth: Cultivating Cellular & Spinal Longevity',
  'Nourishment & Vital Fuel: Anti-Inflammatory Eating for Recovery',
  'Stillness & Breath Flow: Resetting the Nervous System',
  'Connection & Self-Compassion: Why 1:1 Private Coaching Works',
]);

export function hasPreviousDefaultBlogs(posts: BlogPost[] | undefined | null): boolean {
  if (!posts || posts.length === 0) return true;
  return posts.some((p) => PREVIOUS_DEFAULT_BLOG_TITLES.has(p.title));
}

/**
 * Replaces old default blog datasets with the short picture-paired Wellness Journey pillar blogs
 * while preserving user-created custom articles edited after the refresh.
 */
export function migrateLegacyBlogPosts(posts: BlogPost[] | undefined | null): BlogPost[] {
  if (!posts || posts.length === 0) {
    return DEFAULT_STUDIO_FORMAT.blogPosts;
  }

  if (hasPreviousDefaultBlogs(posts)) {
    return DEFAULT_STUDIO_FORMAT.blogPosts;
  }

  return posts.map((post) => {
    let nextPost = post;
    if (
      post.id === 1 &&
      typeof post.image === 'string' &&
      !post.image.startsWith('data:image/') &&
      (post.image.includes('healthy_sprout_blog') ||
        post.image.includes('ultra_featured_cover') ||
        post.image.includes('LANDING_PAGE_IDEA') ||
        (post.image.includes('2_64ef2d00.png') &&
          (!Array.isArray(post.additionalImages) ||
            !post.additionalImages.includes('/assets/aistudio/1_9a57f70a.png'))))
    ) {
      nextPost = {
        ...nextPost,
        image: '/assets/aistudio/1_9a57f70a.png',
        additionalImages: [
          '/assets/aistudio/1_9a57f70a.png',
          '/assets/aistudio/2_64ef2d00.png',
        ],
        imageStyle: undefined,
      };
    } else if (
      post.id === 3 &&
      (post.title === 'Light Fuel, Clean Energy: Studio Plate Rituals' ||
        (typeof post.image === 'string' && post.image.includes('food_nourishment_blog')))
    ) {
      nextPost = DEFAULT_STUDIO_FORMAT.blogPosts[2];
    }

    if (typeof nextPost.author === 'string' && /marcus/i.test(nextPost.author)) {
      nextPost = {
        ...nextPost,
        author: nextPost.author.replace(/marcus(\s*[—\-]?\s*(bennet|holloway))?/gi, 'ULTRA'),
      };
    }

    return nextPost;
  });
}

export function migrateLegacyGalleryItems(
  items: GalleryItem[] | undefined | null
): GalleryItem[] {
  if (!items || items.length === 0) {
    return DEFAULT_STUDIO_FORMAT.galleryItems;
  }

  const slotReplacements: Record<number, { image: string; imageStyle?: ImageStyleConfig }> = {
    2: { image: '/assets/aistudio/image_cc7cdae4.png' },
    3: { image: '/assets/aistudio/7_99768df9.png' },
    4: { image: '/assets/aistudio/2_64ef2d00.png', imageStyle: { scale: 118 } },
    5: { image: '/assets/aistudio/6_33d7af51.png', imageStyle: { scale: 118 } },
    6: { image: '/assets/aistudio/image_706072f8.png' },
  };

  return items.map((item) => {
    const replacement = slotReplacements[item.id];
    if (!replacement) return item;
    const img = item.image || '';
    const isLegacyDefault =
      !img.trim() ||
      img === REFERENCE_IMAGE_PATH ||
      img.includes('LANDING_PAGE_IDEA') ||
      img === BG_IMAGE_URL ||
      img.includes('images.higgs.ai') ||
      (item.id === 6 && img.includes('1_9a57f70a.png'));

    if (item.id === 3 && img.includes('7_99768df9.png') && item.imageStyle?.scale === 118) {
      return {
        ...item,
        imageStyle: undefined,
      };
    }

    if (!isLegacyDefault) return item;
    return {
      ...item,
      image: replacement.image,
      imageStyle: replacement.imageStyle,
    };
  });
}

export function migrateHeroConfig(
  hero: Partial<HeroConfig> | undefined | null
): HeroConfig {
  const rawBg = hero?.bgImage?.trim() || '';
  const shouldReplaceBg =
    !rawBg || rawBg === BG_IMAGE_URL || rawBg.includes('images.higgs.ai');

  const rawPortrait = hero?.portraitImage?.trim() || '';
  const shouldClearPortrait =
    rawPortrait.includes('Screenshot_2026-11-25_at_01.18.48_b4a6afd0.png');

  const merged: HeroConfig = {
    ...DEFAULT_STUDIO_FORMAT.heroConfig,
    ...(hero || {}),
    bgImage: shouldReplaceBg ? HERO_IMAGE_URL : rawBg,
    portraitImage: shouldClearPortrait ? '' : rawPortrait,
  };
  if (typeof merged.logoText === 'string' && /marcus/i.test(merged.logoText)) {
    merged.logoText = 'ULTRA';
  }
  if (typeof merged.marqueeText === 'string' && /marcus/i.test(merged.marqueeText)) {
    merged.marqueeText = 'ULTRA';
  }
  return merged;
}

export function migrateSectionCopy(
  copy: Partial<SectionCopyConfig> | undefined | null
): SectionCopyConfig {
  const merged = { ...DEFAULT_SECTION_COPY, ...(copy || {}) };
  if (merged.blogTitle === 'Insights & Practice') {
    merged.blogTitle = 'ULTRA JOURNALS';
  }
  return merged;
}

export function resolveImageBgColor(bgColor: string | undefined, themeColors: ThemeColors): string | undefined {
  if (!bgColor || bgColor === 'transparent') return undefined;
  if (bgColor === 'theme-wine') return themeColors.wine;
  if (bgColor === 'theme-blush') return themeColors.blush;
  if (bgColor === 'theme-card') return themeColors.cardBg;
  if (bgColor === 'theme-cream') return themeColors.cream;
  if (bgColor === 'theme-wellness') return themeColors.wellnessBg;
  return bgColor;
}

export function getImageStyleProps(
  style: ImageStyleConfig | undefined,
  themeColors: ThemeColors
): {
  imgStyle: Record<string, string | number | undefined>;
  containerBg?: string;
  fitClass: string;
  roundedClass: string;
} {
  const s = style || {};
  const scale = (s.scale ?? 100) / 100;
  const flipX = s.flipX ? -1 : 1;
  const flipY = s.flipY ? -1 : 1;
  const ox = s.offsetX ?? 0;
  const oy = s.offsetY ?? 0;

  const transforms: string[] = [];
  if (ox !== 0 || oy !== 0) transforms.push(`translate(${ox}px, ${oy}px)`);
  if (scale !== 1 || flipX !== 1 || flipY !== 1) {
    transforms.push(`scale(${scale * flipX}, ${scale * flipY})`);
  }

  const imgStyle: Record<string, string | number | undefined> = {
    transform: transforms.length > 0 ? transforms.join(' ') : undefined,
    mixBlendMode: s.blendMode && s.blendMode !== 'normal' ? s.blendMode : undefined,
    opacity: s.opacity !== undefined && s.opacity !== 100 ? s.opacity / 100 : undefined,
    filter: s.matchTheme ? 'contrast(1.06) saturate(0.88) sepia(0.14)' : undefined,
  };

  const containerBg =
    resolveImageBgColor(s.bgColor, themeColors) ||
    (s.matchTheme ? themeColors.cardBg : undefined);

  const fitClass = s.fit === 'contain' ? 'object-contain' : 'object-cover';
  const roundedClass =
    s.rounded === 'full' ? 'rounded-full' : s.rounded === 'md' ? 'rounded-xl' : '';

  return { imgStyle, containerBg, fitClass, roundedClass };
}

export function formatUltraPrice(price: number): string {
  const safePrice = normalizeUltraProductPrice(price);
  return `MWK ${safePrice.toLocaleString('en-US')}`;
}

export function buildUltraProductWebUrl(product: UltraProduct): string {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(`${window.location.origin}${window.location.pathname}`);
    url.searchParams.set('product', String(product.id));
    url.hash = 'ultra-collection';
    return url.toString();
  } catch {
    return `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(String(product.id))}#ultra-collection`;
  }
}

export function buildUltraWhatsAppOrderUrl(params: {
  product: UltraProduct;
  quantity?: number;
  customer?: { name?: string; contact?: string; note?: string };
}): string {
  const { product, quantity = 1, customer } = params;
  const qty = Math.max(1, Math.round(quantity));
  const unitPriceNum = normalizeUltraProductPrice(product.price);
  const unitPrice = formatUltraPrice(unitPriceNum);
  const totalPrice = formatUltraPrice(unitPriceNum * qty);
  const productUrl = buildUltraProductWebUrl(product);

  const lines = [
    'Hello ULTRA! I would like to order:',
    `• Product: *${product.title}*`,
    ...(qty > 1
      ? [`• Quantity: ${qty}`, `• Unit Price: ${unitPrice}`, `• *Total: ${totalPrice}*`]
      : [`• Price: *${unitPrice}*`]),
    ...(productUrl ? [`• Product Link: ${productUrl}`] : []),
  ];

  if (customer?.name?.trim()) lines.push(`• Name: ${customer.name.trim()}`);
  if (customer?.contact?.trim()) lines.push(`• Contact: ${customer.contact.trim()}`);
  if (customer?.note?.trim()) lines.push(`• Note: ${customer.note.trim()}`);

  lines.push('Please share availability and payment/delivery details.');

  return `https://wa.me/265994248379?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function calculateReadTime(text?: string, fallbackExcerpt?: string): string {
  const combined = `${text || ''} ${fallbackExcerpt || ''}`.trim();
  const words = combined ? combined.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min read`;
}

export function generateStudioFormatCode(snapshot: StudioFormatSnapshot): string {
  return `import type { StudioFormatSnapshot } from './studioFormat';

export const SAVED_STUDIO_FORMAT: StudioFormatSnapshot = ${JSON.stringify(snapshot, null, 2)};
`;
}
