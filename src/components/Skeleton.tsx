import React, { useEffect, useRef, useState } from 'react';
import type { GalleryFilterMode, ThemeColors } from '../studioFormat';

interface SkeletonBoxProps {
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonBox({ className = '', style }: SkeletonBoxProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer ${className}`}
      style={style}
    />
  );
}

interface SkeletonImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonClassName?: string;
  skeletonStyle?: React.CSSProperties;
  onImageError?: () => void;
}

export function SkeletonImage({
  src,
  alt = '',
  className = '',
  style,
  wrapperClassName = 'relative w-full h-full overflow-hidden',
  skeletonClassName = '',
  skeletonStyle,
  onImageError,
  onLoad,
  onError,
  ...rest
}: SkeletonImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  return (
    <div className={wrapperClassName}>
      {!loaded && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-0 skeleton-shimmer bg-white/[0.06] ${skeletonClassName}`}
          style={skeletonStyle}
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setLoaded(true);
          onImageError?.();
          onError?.(e);
        }}
        className={`${className} transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={style}
        {...rest}
      />
    </div>
  );
}

export function WellnessSectionSkeleton({ themeColors }: { themeColors: ThemeColors }) {
  return (
    <div aria-busy="true" aria-label="Loading Wellness Journey" className="max-w-6xl mx-auto">
      <div className="text-center mb-6 sm:mb-12 flex flex-col items-center gap-3">
        <SkeletonBox className="h-3 w-36" style={{ backgroundColor: `${themeColors.wellnessIcon}26` }} />
        <SkeletonBox className="h-9 sm:h-14 w-64 sm:w-96" style={{ backgroundColor: `${themeColors.cream}22` }} />
        <SkeletonBox className="h-3.5 w-72 sm:w-[440px]" style={{ backgroundColor: `${themeColors.cream}18` }} />
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:flex sm:flex-col items-center justify-center gap-x-4 gap-y-7 sm:gap-10 py-4 sm:py-8">
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center gap-2.5 ${
              idx === 4 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <SkeletonBox
              className="w-12 h-12 sm:w-20 sm:h-20 rounded-full"
              style={{ backgroundColor: `${themeColors.wellnessIcon}28` }}
            />
            <SkeletonBox
              className="h-3 w-20 sm:w-24"
              style={{ backgroundColor: `${themeColors.cream}22` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GallerySectionSkeleton({
  themeColors,
  galleryFilter,
}: {
  themeColors: ThemeColors;
  galleryFilter: GalleryFilterMode;
}) {
  const tileSizes =
    galleryFilter === 'compact' || galleryFilter === 'large'
      ? ['col-span-1 row-span-1', 'col-span-1 row-span-1', 'col-span-1 row-span-1', 'col-span-1 row-span-1', 'col-span-1 row-span-1', 'col-span-1 row-span-1']
      : [
          'col-span-1 md:col-span-2 row-span-2',
          'col-span-1 row-span-1',
          'col-span-1 row-span-2',
          'col-span-1 md:col-span-2 row-span-1',
          'col-span-1 row-span-1',
          'col-span-1 md:col-span-2 row-span-1',
        ];

  return (
    <div aria-busy="true" aria-label="Loading Studio Gallery" className="max-w-7xl mx-auto">
      <div className="mb-7 sm:mb-12 flex justify-center">
        <SkeletonBox className="h-9 sm:h-16 w-64 sm:w-[420px]" style={{ backgroundColor: `${themeColors.cream}18` }} />
      </div>

      <div
        className={`grid ${
          galleryFilter === 'compact'
            ? 'gap-2.5 sm:gap-4 grid-cols-3 sm:grid-cols-3 md:grid-cols-6 auto-rows-[110px] sm:auto-rows-[180px]'
            : galleryFilter === 'large'
            ? 'gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 auto-rows-[220px] sm:auto-rows-[420px]'
            : 'gap-3 sm:gap-6 grid-cols-2 md:grid-cols-4 auto-rows-[155px] sm:auto-rows-[240px] md:auto-rows-[300px]'
        }`}
      >
        {tileSizes.map((sizeClass, idx) => (
          <div
            key={idx}
            className={`relative border overflow-hidden p-4 sm:p-6 flex items-end ${sizeClass}`}
            style={{
              backgroundColor: `${themeColors.cardBg}45`,
              borderColor: `${themeColors.cream}15`,
            }}
          >
            <SkeletonBox className="absolute inset-0" />
            <SkeletonBox
              className="relative z-10 h-5 sm:h-7 w-2/3"
              style={{ backgroundColor: `${themeColors.cream}22` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function JournalSectionSkeleton({ themeColors }: { themeColors: ThemeColors }) {
  return (
    <div aria-busy="true" aria-label="Loading Journal Articles" className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <div className="border-b pb-5 sm:pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4" style={{ borderColor: `${themeColors.cream}15` }}>
        <SkeletonBox className="h-9 sm:h-14 w-56 sm:w-80" style={{ backgroundColor: `${themeColors.cream}18` }} />
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((tab) => (
            <SkeletonBox
              key={tab}
              className="h-8 w-20 border"
              style={{
                backgroundColor: `${themeColors.cardBg}50`,
                borderColor: `${themeColors.cream}18`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SkeletonBox className="h-3 w-48" style={{ backgroundColor: `${themeColors.blush}24` }} />
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-9 h-9 border" style={{ borderColor: `${themeColors.cream}18` }} />
          <SkeletonBox className="w-9 h-9 border" style={{ borderColor: `${themeColors.cream}18` }} />
        </div>
      </div>

      <div className="flex overflow-hidden gap-4 sm:gap-6 lg:gap-7 pb-4">
        {[0, 1, 2].map((cardIdx) => (
          <div
            key={cardIdx}
            className="w-[84vw] sm:w-[370px] md:w-[400px] lg:w-[420px] shrink-0 border flex flex-col justify-between"
            style={{
              backgroundColor: `${themeColors.cardBg}50`,
              borderColor: `${themeColors.cream}18`,
            }}
          >
            <div>
              <SkeletonBox className="h-52 sm:h-60 w-full border-b" style={{ borderColor: `${themeColors.cream}15` }} />
              <div className="p-5 sm:p-6 space-y-3">
                <SkeletonBox className="h-6 w-5/6" style={{ backgroundColor: `${themeColors.cream}20` }} />
                <SkeletonBox className="h-4 w-2/3" style={{ backgroundColor: `${themeColors.blush}24` }} />
                <div className="p-3 border flex items-center gap-3" style={{ borderColor: `${themeColors.blush}20` }}>
                  <SkeletonBox className="w-9 h-9 shrink-0" style={{ backgroundColor: `${themeColors.wellnessBg}70` }} />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBox className="h-2.5 w-24" style={{ backgroundColor: `${themeColors.blush}24` }} />
                    <SkeletonBox className="h-3 w-full" style={{ backgroundColor: `${themeColors.cream}18` }} />
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <SkeletonBox className="h-3 w-full" style={{ backgroundColor: `${themeColors.cream}14` }} />
                  <SkeletonBox className="h-3 w-4/5" style={{ backgroundColor: `${themeColors.cream}14` }} />
                </div>
              </div>
            </div>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t flex items-center justify-between" style={{ borderColor: `${themeColors.cream}15` }}>
              <SkeletonBox className="h-3 w-16" style={{ backgroundColor: `${themeColors.cream}18` }} />
              <SkeletonBox className="h-3 w-24" style={{ backgroundColor: `${themeColors.blush}28` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UltraCollectionSkeleton({ themeColors }: { themeColors: ThemeColors }) {
  return (
    <div aria-busy="true" aria-label="Loading Ultra Collection" className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <SkeletonBox className="h-9 sm:h-14 w-60 sm:w-80" style={{ backgroundColor: `${themeColors.cream}18` }} />
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-3 w-36" style={{ backgroundColor: `${themeColors.blush}24` }} />
          <SkeletonBox className="w-9 h-9 border" style={{ borderColor: `${themeColors.cream}18` }} />
          <SkeletonBox className="w-9 h-9 border" style={{ borderColor: `${themeColors.cream}18` }} />
        </div>
      </div>

      <div className="flex overflow-hidden gap-4 sm:gap-6 lg:gap-7 pb-4">
        {[0, 1, 2].map((prodIdx) => (
          <div
            key={prodIdx}
            className="w-[84vw] sm:w-[360px] md:w-[390px] lg:w-[410px] shrink-0 border flex flex-col justify-between"
            style={{
              backgroundColor: `${themeColors.cardBg}50`,
              borderColor: `${themeColors.cream}18`,
            }}
          >
            <div>
              <SkeletonBox
                className="aspect-[4/5] sm:aspect-square w-full border-b"
                style={{ borderColor: `${themeColors.cream}15` }}
              />
              <div className="p-5 sm:p-6 space-y-3">
                <SkeletonBox className="h-6 w-3/4" style={{ backgroundColor: `${themeColors.cream}20` }} />
                <div className="space-y-2">
                  <SkeletonBox className="h-3 w-full" style={{ backgroundColor: `${themeColors.cream}14` }} />
                  <SkeletonBox className="h-3 w-5/6" style={{ backgroundColor: `${themeColors.cream}14` }} />
                </div>
              </div>
            </div>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t space-y-3" style={{ borderColor: `${themeColors.cream}15` }}>
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-3 w-28" style={{ backgroundColor: `${themeColors.blush}24` }} />
                <SkeletonBox className="h-4 w-24" style={{ backgroundColor: `${themeColors.cream}24` }} />
              </div>
              <SkeletonBox className="h-10 w-full" style={{ backgroundColor: 'rgba(37, 211, 102, 0.22)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
