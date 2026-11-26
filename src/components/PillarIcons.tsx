import React from 'react';
import {
  Activity,
  Compass,
  Dumbbell,
  Feather,
  Flame,
  Heart,
  Sparkles,
  Sprout,
  Sun,
  Utensils,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import {
  WELLNESS_PILLARS,
  type BlogPost,
  type PillarIconName,
  type WellnessPillarMeta,
} from '../studioFormat';

export interface SelectableIconOption {
  name: PillarIconName;
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const SELECTABLE_BLOG_ICONS: SelectableIconOption[] = [
  { name: 'Sprout', label: 'Sprout', hint: 'Vitality & Organic Growth', icon: Sprout },
  { name: 'Dumbbell', label: 'Strength', hint: 'Strength & Dynamic Movement', icon: Dumbbell },
  { name: 'Utensils', label: 'Nourish', hint: 'Nourishment & Vital Fuel', icon: Utensils },
  { name: 'Wind', label: 'Breath', hint: 'Stillness & Breath Flow', icon: Wind },
  { name: 'Heart', label: 'Heart', hint: 'Connection & Self-Compassion', icon: Heart },
  { name: 'Sparkles', label: 'Radiance', hint: 'Transformation & Mindful Glow', icon: Sparkles },
  { name: 'Sun', label: 'Energy', hint: 'Morning Vitality & Warmth', icon: Sun },
  { name: 'Flame', label: 'Infrared', hint: 'Heated Core Activation', icon: Flame },
  { name: 'Compass', label: 'Alignment', hint: 'Postural Precision & Direction', icon: Compass },
  { name: 'Feather', label: 'Lightness', hint: 'Decompression & Soft Flow', icon: Feather },
  { name: 'Activity', label: 'Pulse', hint: 'Cardiovascular & Kinetic Rhythm', icon: Activity },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  SELECTABLE_BLOG_ICONS.map((opt) => [opt.name, opt.icon])
);

export function getPillarIconComponent(iconName?: string): LucideIcon {
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return Sprout;
}

export function getIconOptionMeta(iconName?: string): SelectableIconOption {
  return (
    SELECTABLE_BLOG_ICONS.find((opt) => opt.name === iconName) ||
    SELECTABLE_BLOG_ICONS[0]
  );
}

export function getPillarMetaById(pillarId?: string): WellnessPillarMeta | null {
  if (!pillarId) return null;
  return WELLNESS_PILLARS.find((p) => p.id === pillarId) || null;
}

export interface ResolvedPostPillar {
  pillar: WellnessPillarMeta | null;
  iconName: PillarIconName;
  IconComponent: LucideIcon;
  iconLabel: string;
  pillarBadgeLabel: string;
  meaningText: string;
  hasPillarOrIcon: boolean;
}

export function resolvePostPillar(post: BlogPost): ResolvedPostPillar {
  const pillar = getPillarMetaById(post.pillarId);
  const isIconExplicitlyDisabled = post.pillarIcon === 'none';
  const hasPillarOrIcon =
    !isIconExplicitlyDisabled && Boolean(post.pillarId || post.pillarIcon);

  const resolvedIconName = (
    (!isIconExplicitlyDisabled && post.pillarIcon) ||
    pillar?.defaultIcon ||
    'Sprout'
  ) as PillarIconName;
  const iconOption = getIconOptionMeta(resolvedIconName);

  const pillarBadgeLabel = pillar
    ? `Pillar ${pillar.number} · ${pillar.label}`
    : `${iconOption.label} Icon Focus`;

  const meaningText =
    post.pillarMeaning?.trim() ||
    pillar?.meaning ||
    iconOption.hint;

  return {
    pillar,
    iconName: resolvedIconName,
    IconComponent: getPillarIconComponent(resolvedIconName),
    iconLabel: iconOption.label,
    pillarBadgeLabel,
    meaningText,
    hasPillarOrIcon,
  };
}

export function findLinkedPostForPillar(
  blogPosts: BlogPost[],
  pillar: WellnessPillarMeta
): BlogPost | null {
  return (
    blogPosts.find((post) => {
      if ((post.status ?? 'published') !== 'published') return false;
      const resolved = resolvePostPillar(post);
      return (
        resolved.hasPillarOrIcon &&
        post.pillarId === pillar.id &&
        resolved.iconName === pillar.defaultIcon
      );
    }) ||
    blogPosts.find((post) => {
      if ((post.status ?? 'published') !== 'published') return false;
      const resolved = resolvePostPillar(post);
      return resolved.hasPillarOrIcon && post.pillarId === pillar.id;
    }) ||
    null
  );
}

export function renderPillarIcon(
  iconName: string | undefined,
  props: { className?: string; size?: number; style?: React.CSSProperties }
) {
  const IconComp = getPillarIconComponent(iconName);
  return <IconComp {...props} />;
}
