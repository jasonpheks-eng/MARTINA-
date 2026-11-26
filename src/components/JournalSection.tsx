import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Share2,
  X,
} from 'lucide-react';
import {
  calculateReadTime,
  getImageStyleProps,
  type BlogPost,
  type ImageStyleConfig,
  type SectionCopyConfig,
  type ThemeColors,
} from '../studioFormat';
import { resolvePostPillar } from './PillarIcons';
import { JournalSectionSkeleton, SkeletonImage } from './Skeleton';

interface ArticleBodyRendererProps {
  content: string;
  themeColors: ThemeColors;
}

export function ArticleBodyRenderer({ content, themeColors }: ArticleBodyRendererProps) {
  const blocks = useMemo(() => {
    const lines = content.split('\n');
    const parsed: Array<
      | { type: 'heading'; text: string }
      | { type: 'quote'; text: string }
      | { type: 'divider' }
      | { type: 'list'; items: string[] }
      | { type: 'paragraph'; text: string }
    > = [];

    let currentList: string[] = [];
    const flushList = () => {
      if (currentList.length > 0) {
        parsed.push({ type: 'list', items: currentList });
        currentList = [];
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushList();
        continue;
      }
      if (line === '---' || line === '***') {
        flushList();
        parsed.push({ type: 'divider' });
      } else if (line.startsWith('## ')) {
        flushList();
        parsed.push({ type: 'heading', text: line.slice(3).trim() });
      } else if (line.startsWith('> ')) {
        flushList();
        parsed.push({ type: 'quote', text: line.slice(2).trim().replace(/^"|"$/g, '') });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        currentList.push(line.slice(2).trim());
      } else {
        flushList();
        parsed.push({ type: 'paragraph', text: line });
      }
    }
    flushList();
    return parsed;
  }, [content]);

  return (
    <div className="space-y-5 max-w-[65ch]">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h3
              key={index}
              className="pt-3 text-lg sm:text-2xl font-extrabold uppercase tracking-tight leading-snug"
              style={{ color: themeColors.cream }}
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote
              key={index}
              className="my-6 py-4 border-y font-serif italic text-base sm:text-xl leading-relaxed"
              style={{
                borderColor: `${themeColors.blush}35`,
                color: themeColors.blush,
              }}
            >
              &ldquo;{block.text}&rdquo;
            </blockquote>
          );
        }
        if (block.type === 'divider') {
          return (
            <hr
              key={index}
              className="my-6 border-0 h-px"
              style={{ backgroundColor: `${themeColors.cream}20` }}
            />
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={index} className="space-y-2.5 pl-1">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-3 text-sm sm:text-base leading-relaxed"
                  style={{ color: `${themeColors.cream}e6` }}
                >
                  <span
                    className="mt-2 w-1.5 h-1.5 shrink-0"
                    style={{ backgroundColor: themeColors.blush }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={index}
            className="text-sm sm:text-base leading-[1.7] font-hn"
            style={{ color: `${themeColors.cream}e6` }}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

interface CoverImageProps {
  src?: string;
  alt: string;
  themeColors: ThemeColors;
  imageStyle?: ImageStyleConfig;
  className?: string;
  parallaxY?: number;
}

function ArticleCoverImage({
  src,
  alt,
  themeColors,
  imageStyle,
  className = '',
  parallaxY = 0,
}: CoverImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src?.trim() || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-6 text-center ${className}`}
        style={{
          background: `radial-gradient(circle at top right, ${themeColors.cardBg}, ${themeColors.wine})`,
        }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2"
          style={{ color: themeColors.blush }}
        >
          Hot Core Journal
        </span>
        <span
          className="font-serif italic text-base sm:text-xl max-w-xs leading-snug opacity-80"
          style={{ color: themeColors.cream }}
        >
          {alt}
        </span>
      </div>
    );
  }

  const styled = getImageStyleProps(imageStyle, themeColors);
  const existingTransform =
    typeof styled.imgStyle.transform === 'string' ? styled.imgStyle.transform : undefined;
  const combinedTransform =
    parallaxY !== 0
      ? `${existingTransform ? `${existingTransform} ` : ''}translateY(${parallaxY}px) scale(1.06)`
      : existingTransform;

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{ backgroundColor: styled.containerBg }}
    >
      <SkeletonImage
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onImageError={() => setHasError(true)}
        className={`${className} ${styled.fitClass} ${styled.roundedClass}`}
        style={{
          ...(styled.imgStyle as React.CSSProperties),
          transform: combinedTransform,
          willChange: parallaxY !== 0 ? 'transform' : undefined,
        }}
      />
    </div>
  );
}

interface JournalCardMediaProps {
  photos: string[];
  title: string;
  themeColors: ThemeColors;
  imageStyle?: ImageStyleConfig;
  isHovered: boolean;
}

function JournalCardMedia({
  photos,
  title,
  themeColors,
  imageStyle,
  isHovered,
}: JournalCardMediaProps) {
  const [hoverSlideIdx, setHoverSlideIdx] = useState(0);

  useEffect(() => {
    if (!isHovered || photos.length <= 1) {
      setHoverSlideIdx(0);
      return;
    }

    setHoverSlideIdx(1);
    if (photos.length <= 2) return;

    const timer = window.setInterval(() => {
      setHoverSlideIdx((prev) => (prev + 1) % photos.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [isHovered, photos.length]);

  if (photos.length <= 1) {
    const singleSrc = photos[0];
    const isUltraPortrait = singleSrc?.includes('1_9a57f70a');
    const isMatchaLetterbox = singleSrc?.includes('2_64ef2d00');
    return (
      <ArticleCoverImage
        src={singleSrc}
        alt={title}
        themeColors={themeColors}
        imageStyle={imageStyle}
        className={`w-full h-full filter brightness-95 transition-transform duration-700 ease-out ${
          isUltraPortrait ? 'object-[center_28%]' : 'object-center'
        } ${isMatchaLetterbox ? 'scale-[1.16] group-hover:scale-[1.2]' : 'group-hover:scale-105'}`}
      />
    );
  }

  return (
    <div
      className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
      style={{ transform: `translateX(-${hoverSlideIdx * 100}%)` }}
    >
      {photos.map((photoSrc, photoIdx) => {
        const isUltraPortrait = photoSrc?.includes('1_9a57f70a');
        const isMatchaLetterbox = photoSrc?.includes('2_64ef2d00');
        return (
          <div key={`${photoSrc}-${photoIdx}`} className="w-full h-full shrink-0 overflow-hidden">
            <ArticleCoverImage
              src={photoSrc}
              alt={`${title}${photoIdx > 0 ? ` (${photoIdx + 1})` : ''}`}
              themeColors={themeColors}
              imageStyle={imageStyle}
              className={`w-full h-full filter brightness-95 transition-transform duration-700 ease-out ${
                isUltraPortrait ? 'object-[center_28%]' : 'object-center'
              } ${isMatchaLetterbox ? 'scale-[1.16]' : ''}`}
            />
          </div>
        );
      })}
    </div>
  );
}

interface JournalSectionProps {
  blogPosts: BlogPost[];
  sectionCopy: SectionCopyConfig;
  themeColors: ThemeColors;
  selectedPost: BlogPost | null;
  onSelectPost: (post: BlogPost | null) => void;
  isLoading?: boolean;
}

export function JournalSection({
  blogPosts,
  sectionCopy,
  themeColors,
  selectedPost,
  onSelectPost,
  isLoading = false,
}: JournalSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [readProgress, setReadProgress] = useState(0);
  const [readerScrollY, setReaderScrollY] = useState(0);
  const [copiedArticleId, setCopiedArticleId] = useState<number | null>(null);
  const [sectionInView, setSectionInView] = useState(false);
  const [railScrollPct, setRailScrollPct] = useState(0);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isDraggingRail, setIsDraggingRail] = useState(false);
  const [hoveredPostId, setHoveredPostId] = useState<number | null>(null);
  const [activeReaderGalleryIdx, setActiveReaderGalleryIdx] = useState(0);

  const sectionRef = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ active: boolean; startX: number; scrollLeft: number; moved: boolean }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const readerScrollRef = useRef<HTMLDivElement | null>(null);
  const readerGalleryRailRef = useRef<HTMLDivElement | null>(null);

  const publishedPosts = useMemo(
    () => blogPosts.filter((post) => (post.status ?? 'published') === 'published'),
    [blogPosts]
  );

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const post of publishedPosts) {
      if (post.category?.trim()) unique.add(post.category.trim());
    }
    return ['All', ...Array.from(unique)];
  }, [publishedPosts]);

  useEffect(() => {
    if (activeCategory !== 'All' && !categories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [categories, activeCategory]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'All') return publishedPosts;
    return publishedPosts.filter((post) => post.category?.trim() === activeCategory);
  }, [publishedPosts, activeCategory]);

  const railPosts = useMemo(() => {
    const featured = filteredPosts.filter((p) => p.featured);
    const others = filteredPosts.filter((p) => !p.featured);
    return [...featured, ...others];
  }, [filteredPosts]);

  const selectedIndex = useMemo(() => {
    if (!selectedPost) return -1;
    return publishedPosts.findIndex((p) => p.id === selectedPost.id);
  }, [publishedPosts, selectedPost]);

  const prevPost = selectedIndex > 0 ? publishedPosts[selectedIndex - 1] : null;
  const nextPost =
    selectedIndex >= 0 && selectedIndex < publishedPosts.length - 1
      ? publishedPosts[selectedIndex + 1]
      : null;

  // Scroll-reveal for #blog
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setSectionInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSectionInView(true);
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Reset horizontal rail progress when filter changes
  useEffect(() => {
    setRailScrollPct(0);
    setActiveSlideIdx(0);
    if (railRef.current) {
      railRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeCategory, railPosts.length]);

  const handleRailScroll = () => {
    const el = railRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setRailScrollPct(0);
      setActiveSlideIdx(0);
      return;
    }
    const pct = Math.max(0, Math.min(100, (el.scrollLeft / maxScroll) * 100));
    setRailScrollPct(pct);

    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
      setActiveSlideIdx(Math.max(0, railPosts.length - 1));
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
    setActiveSlideIdx(closestIdx);
  };

  const scrollToSlide = (targetIdx: number) => {
    const el = railRef.current;
    if (!el) return;
    const clampedIdx = Math.max(0, Math.min(railPosts.length - 1, targetIdx));
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
      setActiveSlideIdx(clampedIdx);
    }
  };

  const scrollRailByDirection = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const nextIdx = activeSlideIdx + direction;
    if (nextIdx >= 0 && nextIdx < railPosts.length) {
      scrollToSlide(nextIdx);
      return;
    }
    const step = Math.max(280, Math.round(el.clientWidth * 0.78));
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const handleRailMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !railRef.current) return;
    dragStateRef.current = {
      active: true,
      startX: e.pageX - railRef.current.offsetLeft,
      scrollLeft: railRef.current.scrollLeft,
      moved: false,
    };
    setIsDraggingRail(true);
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.active || !railRef.current) return;
      const x = e.pageX - railRef.current.offsetLeft;
      const delta = x - dragStateRef.current.startX;
      if (Math.abs(delta) > 6) {
        dragStateRef.current.moved = true;
      }
      railRef.current.scrollLeft = dragStateRef.current.scrollLeft - delta;
    };

    const handleWindowMouseUp = () => {
      if (!dragStateRef.current.active) return;
      dragStateRef.current.active = false;
      setIsDraggingRail(false);
      window.setTimeout(() => {
        dragStateRef.current.moved = false;
      }, 60);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!selectedPost) return;
    setReadProgress(0);
    setReaderScrollY(0);
    setActiveReaderGalleryIdx(0);
    if (readerScrollRef.current) {
      readerScrollRef.current.scrollTop = 0;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSelectPost(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost, onSelectPost]);

  const handleReaderScroll = () => {
    const el = readerScrollRef.current;
    if (!el) return;
    setReaderScrollY(el.scrollTop);
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setReadProgress(100);
      return;
    }
    setReadProgress(Math.min(100, Math.round((el.scrollTop / maxScroll) * 100)));
  };

  const handleCopyShareLink = async (post: BlogPost) => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}#blog`;
      await navigator.clipboard.writeText(`${post.title} — ${shareUrl}`);
      setCopiedArticleId(post.id);
      setTimeout(() => setCopiedArticleId(null), 2000);
    } catch {
      // Clipboard access unavailable
    }
  };

  return (
    <>
      <section
        ref={sectionRef}
        id="blog"
        className="px-4 sm:px-6 lg:px-16 py-14 sm:py-28 border-t overflow-x-clip"
        style={{
          backgroundColor: themeColors.wine,
          color: themeColors.cream,
          borderColor: `${themeColors.cream}10`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <JournalSectionSkeleton themeColors={themeColors} />
          ) : (
            <>
          {/* Header + Category Filter Controls */}
          <div
            className={`mb-8 sm:mb-14 space-y-6 transition-all duration-700 ease-out ${
              sectionInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-6">
              <div>
                <h2
                  className="text-3xl sm:text-6xl font-extrabold uppercase tracking-tight leading-none text-balance"
                  style={{ color: themeColors.cream }}
                >
                  {sectionCopy.blogTitle}
                </h2>
              </div>
            </div>

            {categories.length > 2 && (
              <div
                className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b"
                style={{ borderColor: `${themeColors.cream}15` }}
                role="tablist"
                aria-label="Filter journal articles by category"
              >
                {categories.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategory(cat)}
                      className="px-3.5 py-2.5 text-[11px] sm:text-xs uppercase tracking-widest font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 -mb-px"
                      style={{
                        borderColor: isActive ? themeColors.blush : 'transparent',
                        color: isActive ? themeColors.blush : `${themeColors.cream}99`,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {publishedPosts.length === 0 ? (
            <div
              className="border p-8 sm:p-12 text-center"
              style={{
                backgroundColor: `${themeColors.cardBg}40`,
                borderColor: `${themeColors.cream}15`,
              }}
            >
              <span
                className="text-xs uppercase tracking-[0.25em] font-semibold block mb-2"
                style={{ color: themeColors.blush }}
              >
                Journal Archive
              </span>
              <p className="text-sm sm:text-base" style={{ color: `${themeColors.cream}cc` }}>
                New studio articles are currently being prepared. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Top Horizontal Scroll Controls & Progress Indicator */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className="text-[10px] sm:text-xs uppercase tracking-[0.22em] font-bold shrink-0"
                    style={{ color: themeColors.blush }}
                  >
                    {String(activeSlideIdx + 1).padStart(2, '0')} /{' '}
                    {String(railPosts.length).padStart(2, '0')} &bull; Swipe or Scroll Stories
                  </span>
                  <div
                    className="h-[2px] flex-1 max-w-xs overflow-hidden"
                    style={{ backgroundColor: `${themeColors.cream}18` }}
                  >
                    <div
                      className="h-full transition-all duration-200 ease-out"
                      style={{
                        width: `${Math.max(100 / Math.max(1, railPosts.length), railScrollPct)}%`,
                        backgroundColor: themeColors.blush,
                      }}
                    />
                  </div>
                </div>

                {railPosts.length > 1 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollRailByDirection(-1)}
                      disabled={activeSlideIdx === 0 && railScrollPct <= 1}
                      aria-label="Scroll articles left"
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
                      onClick={() => scrollRailByDirection(1)}
                      disabled={activeSlideIdx >= railPosts.length - 1 && railScrollPct >= 99}
                      aria-label="Scroll articles right"
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

              {/* Unified Cross-Device Horizontal Snap-Scroll Journal Rail */}
              <div
                ref={railRef}
                onScroll={handleRailScroll}
                onMouseDown={handleRailMouseDown}
                onDragStart={(e) => e.preventDefault()}
                onWheel={(e) => {
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && railRef.current) {
                    const el = railRef.current;
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
                  isDraggingRail ? 'cursor-grabbing snap-none' : 'cursor-grab'
                }`}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {railPosts.map((post, idx) => {
                  const postPillar = resolvePostPillar(post);
                  const PostPillarIcon = postPillar.IconComponent;
                  const allPostPhotos = Array.from(
                    new Set([post.image, ...(post.additionalImages || [])].filter(Boolean))
                  );

                  return (
                    <article
                      key={post.id}
                      onMouseEnter={() => {
                        if (allPostPhotos.length > 1) {
                          setHoveredPostId(post.id);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredPostId((curr) => (curr === post.id ? null : curr));
                      }}
                      onClick={() => {
                        if (dragStateRef.current.moved) return;
                        onSelectPost(post);
                      }}
                      className={`group shrink-0 snap-start flex flex-col justify-between rounded-none border overflow-hidden p-4 sm:p-7 transition-all duration-700 ease-out shadow-2xl hover:-translate-y-1 hover:border-[#ebd2d8]/45 cursor-pointer w-[82vw] sm:w-[400px] lg:w-[445px] ${
                        sectionInView
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-8'
                      }`}
                      style={{
                        backgroundColor: `${themeColors.cardBg}55`,
                        borderColor: post.featured
                          ? `${themeColors.blush}35`
                          : `${themeColors.cream}16`,
                        transitionDelay: `${Math.min(idx * 80, 320)}ms`,
                      }}
                    >
                      <div>
                        <div
                          className="relative h-56 sm:h-72 rounded-none overflow-hidden mb-4 sm:mb-6 bg-black border"
                          style={{ borderColor: `${themeColors.cream}15` }}
                        >
                          <JournalCardMedia
                            photos={allPostPhotos}
                            title={post.title}
                            themeColors={themeColors}
                            imageStyle={post.imageStyle}
                            isHovered={hoveredPostId === post.id}
                          />
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(to top, ${themeColors.wine}dd, transparent 62%)`,
                            }}
                          />
                          {postPillar.hasPillarOrIcon && (
                            <div
                              className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 backdrop-blur-md border"
                              style={{
                                backgroundColor: `${themeColors.wine}cc`,
                                borderColor: `${themeColors.blush}35`,
                              }}
                            >
                              <PostPillarIcon
                                size={13}
                                style={{ color: themeColors.wellnessIcon }}
                              />
                              <span
                                className="text-[10px] uppercase tracking-[0.18em] font-bold"
                                style={{ color: themeColors.blush }}
                              >
                                {post.featured ? `Featured · ${postPillar.pillarBadgeLabel}` : postPillar.pillarBadgeLabel}
                              </span>
                            </div>
                          )}
                          {allPostPhotos.length > 1 && (
                            <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/65 backdrop-blur-md border border-white/15 text-white">
                              <ImageIcon size={12} className="text-[#ebd2d8]" />
                              <span className="text-[10px] uppercase tracking-wider font-bold">
                                {allPostPhotos.length} Photos
                              </span>
                            </div>
                          )}
                        </div>

                        <h3
                          className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight mb-2 sm:mb-2.5 leading-snug text-balance"
                          style={{ color: themeColors.cream }}
                        >
                          {post.title}
                        </h3>

                        {post.subtitle && (
                          <p
                            className="font-serif italic text-xs sm:text-sm mb-3"
                            style={{ color: themeColors.blush }}
                          >
                            {post.subtitle}
                          </p>
                        )}

                        {postPillar.hasPillarOrIcon && (
                          <div
                            className="mb-3.5 p-2.5 border flex items-start gap-2.5"
                            style={{
                              backgroundColor: `${themeColors.wine}75`,
                              borderColor: `${themeColors.blush}25`,
                            }}
                          >
                            <div
                              className="w-8 h-8 flex items-center justify-center shrink-0 border"
                              style={{
                                backgroundColor: `${themeColors.wellnessBg}a6`,
                                borderColor: `${themeColors.wellnessIcon}35`,
                              }}
                            >
                              <PostPillarIcon
                                size={16}
                                style={{ color: themeColors.wellnessIcon }}
                              />
                            </div>
                            <div className="min-w-0">
                              <span
                                className="block text-[10px] uppercase tracking-[0.18em] font-bold"
                                style={{ color: themeColors.blush }}
                              >
                                {postPillar.pillarBadgeLabel} &bull; {postPillar.iconLabel} Icon
                              </span>
                              <p
                                className="text-[11px] leading-snug mt-0.5 line-clamp-2"
                                style={{ color: `${themeColors.cream}e0` }}
                              >
                                {postPillar.meaningText}
                              </p>
                            </div>
                          </div>
                        )}

                        <p
                          className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6"
                          style={{ color: `${themeColors.cream}cc` }}
                        >
                          {post.excerpt}
                        </p>
                      </div>

                      <div
                        className="pt-3 border-t flex items-center justify-between gap-3"
                        style={{ borderColor: `${themeColors.cream}15` }}
                      >
                        <span
                          className="text-[11px] sm:text-xs font-medium truncate"
                          style={{ color: `${themeColors.cream}99` }}
                        >
                          {post.author?.trim() || 'ULTRA'}
                        </span>
                        <span
                          className="inline-flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-widest font-bold group-hover:translate-x-1 transition-transform whitespace-nowrap shrink-0"
                          style={{ color: themeColors.blush }}
                        >
                          <BookOpen size={14} />
                          <span>Read Story</span>
                          <ArrowUpRight size={14} />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Clickable Horizontal Slide Dots */}
              {railPosts.length > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  {railPosts.map((p, dotIdx) => {
                    const isActive = dotIdx === activeSlideIdx;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => scrollToSlide(dotIdx)}
                        aria-label={`Jump to story ${dotIdx + 1}: ${p.title}`}
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
          )}
            </>
          )}
        </div>
      </section>

      {/* CUSTOMER JOURNAL ARTICLE READER MODAL (with Scroll-Linked Parallax & Photo Story Strip) */}
      {selectedPost && (() => {
        const readerPhotos = Array.from(
          new Set([selectedPost.image, ...(selectedPost.additionalImages || [])].filter(Boolean))
        );
        const safeGalleryIdx = Math.min(
          activeReaderGalleryIdx,
          Math.max(0, readerPhotos.length - 1)
        );
        const readerParallax = Math.min(48, Math.round(readerScrollY * 0.22));

        const scrollGalleryPhoto = (dir: -1 | 1) => {
          const nextIdx = (safeGalleryIdx + dir + readerPhotos.length) % readerPhotos.length;
          setActiveReaderGalleryIdx(nextIdx);
          if (readerGalleryRailRef.current) {
            const child = readerGalleryRailRef.current.children[nextIdx] as HTMLElement | undefined;
            child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        };

        return (
          <div
            onClick={() => onSelectPost(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md"
          >
            <article
              ref={readerScrollRef}
              onScroll={handleReaderScroll}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-none sm:rounded-2xl shadow-2xl border"
              style={{
                backgroundColor: themeColors.wine,
                color: themeColors.cream,
                borderColor: `${themeColors.cream}20`,
              }}
            >
              {/* Sticky Reading Progress & Top Action Bar */}
              <div
                className="sticky top-0 z-30 backdrop-blur-md border-b"
                style={{
                  backgroundColor: `${themeColors.wine}ee`,
                  borderColor: `${themeColors.cream}15`,
                }}
              >
                <div className="h-1 w-full bg-black/25">
                  <div
                    className="h-full transition-all duration-150"
                    style={{
                      width: `${readProgress}%`,
                      backgroundColor: themeColors.blush,
                    }}
                  />
                </div>
                <div className="px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold truncate"
                      style={{ color: themeColors.blush }}
                    >
                      {selectedPost.category} &middot;{' '}
                      {selectedPost.readTime?.trim() ||
                        calculateReadTime(selectedPost.content, selectedPost.excerpt)}
                    </span>
                    <span
                      className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border shrink-0"
                      style={{
                        borderColor: `${themeColors.blush}35`,
                        color: themeColors.cream,
                      }}
                    >
                      {readProgress}% Read
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyShareLink(selectedPost)}
                      className="px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
                      style={{
                        borderColor: `${themeColors.cream}25`,
                        color: themeColors.cream,
                      }}
                    >
                      {copiedArticleId === selectedPost.id ? (
                        <>
                          <Check size={13} className="text-[#25D366]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={13} />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPost(null)}
                      aria-label="Close article"
                      className="p-2 rounded-full bg-black/40 text-white hover:bg-black/65 cursor-pointer border border-white/15"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {selectedPost.image?.trim() && (
                <div
                  className="relative h-60 sm:h-88 w-full bg-black overflow-hidden border-b"
                  style={{ borderColor: `${themeColors.cream}15` }}
                >
                  <ArticleCoverImage
                    src={readerPhotos[safeGalleryIdx] || selectedPost.image}
                    alt={selectedPost.title}
                    themeColors={themeColors}
                    imageStyle={selectedPost.imageStyle}
                    parallaxY={readerParallax}
                    className="w-full h-full object-[center_22%]"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(to top, ${themeColors.wine}ee, transparent 60%)`,
                    }}
                  />
                </div>
              )}

              <div className="p-5 sm:p-10 space-y-5 sm:space-y-6">
                <div
                  className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs uppercase tracking-[0.2em] font-semibold"
                  style={{ color: themeColors.blush }}
                >
                  <span>{selectedPost.category}</span>
                  {selectedPost.date && (
                    <>
                      <span aria-hidden="true">&middot;</span>
                      <span style={{ color: `${themeColors.cream}aa` }}>{selectedPost.date}</span>
                    </>
                  )}
                  <span aria-hidden="true">&middot;</span>
                  <span style={{ color: `${themeColors.cream}aa` }}>
                    By {selectedPost.author?.trim() || 'ULTRA'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight leading-tight text-balance">
                  {selectedPost.title}
                </h2>

                {selectedPost.subtitle && (
                  <p
                    className="font-serif italic text-base sm:text-xl"
                    style={{ color: themeColors.blush }}
                  >
                    {selectedPost.subtitle}
                  </p>
                )}

                {/* Horizontal Scroll-Snap Visual Story Gallery for multi-image essays */}
                {readerPhotos.length > 1 && (
                  <div
                    className="p-4 sm:p-5 border space-y-3"
                    style={{
                      backgroundColor: `${themeColors.cardBg}50`,
                      borderColor: `${themeColors.blush}30`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-1.5"
                        style={{ color: themeColors.blush }}
                      >
                        <ImageIcon size={13} />
                        <span>
                          Scroll Essay Gallery ({safeGalleryIdx + 1} / {readerPhotos.length})
                        </span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => scrollGalleryPhoto(-1)}
                          aria-label="Previous essay photo"
                          className="p-1.5 border hover:opacity-80 cursor-pointer"
                          style={{
                            borderColor: `${themeColors.cream}25`,
                            color: themeColors.cream,
                          }}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollGalleryPhoto(1)}
                          aria-label="Next essay photo"
                          className="p-1.5 border hover:opacity-80 cursor-pointer"
                          style={{
                            borderColor: `${themeColors.cream}25`,
                            color: themeColors.cream,
                          }}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>

                    <div
                      ref={readerGalleryRailRef}
                      className="flex overflow-x-auto gap-3 pb-1 scrollbar-none snap-x snap-mandatory smooth-scroll-x"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {readerPhotos.map((imgUrl, pIdx) => {
                        const isSelected = pIdx === safeGalleryIdx;
                        return (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setActiveReaderGalleryIdx(pIdx)}
                            className={`relative w-52 sm:w-64 h-64 sm:h-72 shrink-0 snap-center overflow-hidden border bg-black/70 transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-[#ebd2d8] opacity-100'
                                : 'opacity-80 hover:opacity-100'
                            }`}
                            style={{
                              borderColor: isSelected
                                ? themeColors.blush
                                : `${themeColors.cream}20`,
                            }}
                          >
                            <SkeletonImage
                              src={imgUrl}
                              alt={`${selectedPost.title} plate ${pIdx + 1}`}
                              className="w-full h-full object-contain"
                            />
                            <span className="absolute bottom-2 left-2 z-10 px-2 py-0.5 bg-black/75 text-[10px] font-bold uppercase tracking-wider text-[#ebd2d8]">
                              Photo {String(pIdx + 1).padStart(2, '0')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(() => {
                  const readerPillar = resolvePostPillar(selectedPost);
                  if (!readerPillar.hasPillarOrIcon) return null;
                  const ReaderPillarIcon = readerPillar.IconComponent;
                  return (
                    <div
                      className="p-4 sm:p-5 border flex items-start gap-3.5 sm:gap-4"
                      style={{
                        backgroundColor: `${themeColors.wellnessBg}33`,
                        borderColor: `${themeColors.wellnessIcon}40`,
                      }}
                    >
                      <div
                        className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: themeColors.wellnessBg,
                          borderColor: `${themeColors.wellnessIcon}50`,
                        }}
                      >
                        <ReaderPillarIcon size={22} style={{ color: themeColors.wellnessIcon }} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <span
                          className="block text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold"
                          style={{ color: themeColors.wellnessIcon }}
                        >
                          Illustrates {readerPillar.pillarBadgeLabel} &bull;{' '}
                          {readerPillar.iconLabel} Icon
                        </span>
                        <p
                          className="text-xs sm:text-sm font-semibold leading-snug"
                          style={{ color: themeColors.cream }}
                        >
                          {readerPillar.meaningText}
                        </p>
                        {readerPillar.pillar && (
                          <p
                            className="text-xs leading-relaxed"
                            style={{ color: `${themeColors.cream}bf` }}
                          >
                            {readerPillar.pillar.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {selectedPost.takeaways && selectedPost.takeaways.length > 0 && (
                  <div
                    className="p-4 sm:p-6 border space-y-3"
                    style={{
                      backgroundColor: `${themeColors.cardBg}70`,
                      borderColor: `${themeColors.blush}30`,
                    }}
                  >
                    <span
                      className="block text-[10px] sm:text-xs uppercase tracking-[0.22em] font-bold"
                      style={{ color: themeColors.blush }}
                    >
                      Studio Key Takeaways
                    </span>
                    <ul className="space-y-2">
                      {selectedPost.takeaways.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed"
                          style={{ color: `${themeColors.cream}eb` }}
                        >
                          <CheckCircle2
                            size={15}
                            className="shrink-0 mt-0.5"
                            style={{ color: themeColors.blush }}
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div
                  className="border-t pt-6"
                  style={{ borderColor: `${themeColors.cream}15` }}
                >
                  <ArticleBodyRenderer
                    content={selectedPost.content || selectedPost.excerpt}
                    themeColors={themeColors}
                  />
                </div>

                {/* Next / Previous Journal Navigation */}
                {(prevPost || nextPost) && (
                  <div
                    className="pt-5 border-t grid grid-cols-1 sm:grid-cols-2 gap-3"
                    style={{ borderColor: `${themeColors.cream}15` }}
                  >
                    {prevPost ? (
                      <button
                        type="button"
                        onClick={() => onSelectPost(prevPost)}
                        className="p-3.5 border text-left hover:opacity-85 transition-opacity cursor-pointer"
                        style={{
                          backgroundColor: `${themeColors.cardBg}45`,
                          borderColor: `${themeColors.cream}15`,
                        }}
                      >
                        <span
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold mb-1"
                          style={{ color: themeColors.blush }}
                        >
                          <ArrowLeft size={12} />
                          Previous Article
                        </span>
                        <span className="text-xs font-bold uppercase line-clamp-1 block">
                          {prevPost.title}
                        </span>
                      </button>
                    ) : (
                      <div className="hidden sm:block" />
                    )}

                    {nextPost && (
                      <button
                        type="button"
                        onClick={() => onSelectPost(nextPost)}
                        className="p-3.5 border text-left sm:text-right hover:opacity-85 transition-opacity cursor-pointer"
                        style={{
                          backgroundColor: `${themeColors.cardBg}45`,
                          borderColor: `${themeColors.cream}15`,
                        }}
                      >
                        <span
                          className="flex items-center sm:justify-end gap-1.5 text-[10px] uppercase tracking-widest font-semibold mb-1"
                          style={{ color: themeColors.blush }}
                        >
                          Next Article
                          <ArrowRight size={12} />
                        </span>
                        <span className="text-xs font-bold uppercase line-clamp-1 block">
                          {nextPost.title}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <div
                  className="pt-4 border-t flex items-center justify-end"
                  style={{ borderColor: `${themeColors.cream}15` }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectPost(null)}
                    className="w-full sm:w-auto px-6 py-3 rounded-full border text-xs font-bold uppercase tracking-widest cursor-pointer whitespace-nowrap shrink-0"
                    style={{ borderColor: `${themeColors.cream}30`, color: themeColors.cream }}
                  >
                    Close Article
                  </button>
                </div>
              </div>
            </article>
          </div>
        );
      })()}
    </>
  );
}
