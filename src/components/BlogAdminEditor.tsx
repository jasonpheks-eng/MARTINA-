import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  CopyPlus,
  Eye,
  Heading2,
  Image as ImageIcon,
  List,
  Minus,
  PenLine,
  Plus,
  Quote,
  Save,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  calculateReadTime,
  getImageStyleProps,
  REFERENCE_IMAGE_PATH,
  WELLNESS_PILLARS,
  type BlogPost,
  type SectionCopyConfig,
  type ThemeColors,
} from '../studioFormat';
import { ArticleBodyRenderer } from './JournalSection';
import {
  getIconOptionMeta,
  getPillarMetaById,
  resolvePostPillar,
  SELECTABLE_BLOG_ICONS,
} from './PillarIcons';
import { ImageStyleControls } from './ImageStyleControls';

const PRESET_CATEGORIES = [
  'Vitality & Growth',
  'Reformer Mechanics',
  'Nourishment & Fuel',
  'Breath & Peace',
  'Private Practice',
  'Mobility & Recovery',
  'Studio Notes',
];

interface BlogAdminEditorProps {
  draftBlogPosts: BlogPost[];
  setDraftBlogPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  draftSectionCopy: SectionCopyConfig;
  setDraftSectionCopy: React.Dispatch<React.SetStateAction<SectionCopyConfig>>;
  draftThemeColors: ThemeColors;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  onMultiFileUpload?: (e: React.ChangeEvent<HTMLInputElement>, callback: (urls: string[]) => void) => void;
  onOpenBgRemover: (image: string, label: string, onApply: (url: string) => void) => void;
  onSaveAndApply: (specificTabName?: string) => void;
}

export function BlogAdminEditor({
  draftBlogPosts,
  setDraftBlogPosts,
  draftSectionCopy,
  setDraftSectionCopy,
  draftThemeColors,
  onFileUpload,
  onMultiFileUpload,
  onOpenBgRemover,
  onSaveAndApply,
}: BlogAdminEditorProps) {
  const [activePostId, setActivePostId] = useState<number | null>(
    draftBlogPosts[0]?.id ?? null
  );
  const [editorMode, setEditorMode] = useState<'write' | 'cardPreview' | 'readerPreview'>('write');
  const [showHeaderSettings, setShowHeaderSettings] = useState(false);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (draftBlogPosts.length === 0) {
      setActivePostId(null);
      return;
    }
    if (!draftBlogPosts.some((p) => p.id === activePostId)) {
      setActivePostId(draftBlogPosts[0].id);
    }
  }, [draftBlogPosts, activePostId]);

  const activePost = useMemo(
    () => draftBlogPosts.find((p) => p.id === activePostId) || draftBlogPosts[0] || null,
    [draftBlogPosts, activePostId]
  );

  const publishedCount = useMemo(
    () => draftBlogPosts.filter((p) => (p.status ?? 'published') === 'published').length,
    [draftBlogPosts]
  );
  const draftCount = draftBlogPosts.length - publishedCount;

  const updateActivePost = (patch: Partial<BlogPost>, targetId?: number) => {
    const idToUpdate = targetId ?? activePost?.id;
    if (idToUpdate === undefined || idToUpdate === null) return;
    setDraftBlogPosts((prev) =>
      prev.map((p) => (p.id === idToUpdate ? { ...p, ...patch } : p))
    );
  };

  const handleAddArticle = () => {
    const maxId = draftBlogPosts.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newId = maxId + 1;
    const newPost: BlogPost = {
      id: newId,
      title: 'New Journal Article Title',
      subtitle: 'Studio Methodology & Movement Notes',
      excerpt:
        'Write a compelling summary excerpt describing the article focus and studio insights.',
      content: `Introduce your main idea in a clear opening paragraph tailored to your clients.

## Key Movement Focus
Explain the core studio technique, breath cue, or reformer adjustment here.

> "Precision comes before speed—every controlled transition builds lasting strength."

- Cue 01: Neutral spine & ribcage breath
- Cue 02: Smooth spring resistance control`,
      date: 'Nov 2026',
      category: 'Vitality & Growth',
      image: REFERENCE_IMAGE_PATH,
      author: 'Marcus Bennet',
      readTime: '2 min read',
      featured: false,
      status: 'published',
      pillarId: 'healthy',
      pillarIcon: 'Sprout',
      pillarMeaning: 'Vitality & Organic Growth — Rooted spinal alignment and natural daily vitality',
      takeaways: [
        'Slow, deliberate spring control creates deeper core activation.',
        'Coordinate breath rhythm before initiating carriage motion.',
      ],
    };
    setDraftBlogPosts([...draftBlogPosts, newPost]);
    setActivePostId(newId);
    setEditorMode('write');
  };

  const handleDuplicateArticle = (post: BlogPost) => {
    const maxId = draftBlogPosts.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newId = maxId + 1;
    const copy: BlogPost = {
      ...JSON.parse(JSON.stringify(post)),
      id: newId,
      title: `${post.title} (Copy)`,
      featured: false,
      status: 'draft',
    };
    setDraftBlogPosts([...draftBlogPosts, copy]);
    setActivePostId(newId);
    setEditorMode('write');
  };

  const handleMoveArticle = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draftBlogPosts.length) return;
    const updated = [...draftBlogPosts];
    const first = updated[index];
    const second = updated[targetIndex];
    updated[index] = { ...second, id: first.id };
    updated[targetIndex] = { ...first, id: second.id };
    setDraftBlogPosts(updated);
    setActivePostId(second.id === activePost?.id ? first.id : activePost?.id ?? first.id);
  };

  const handleInsertFormatting = (snippet: string, prefixNewLine = true) => {
    if (!activePost) return;
    const current = activePost.content || '';
    const textarea = bodyTextareaRef.current;

    if (!textarea) {
      const next = current ? `${current}\n\n${snippet}` : snippet;
      updateActivePost({ content: next });
      return;
    }

    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? current.length;
    const before = current.slice(0, start);
    const selected = current.slice(start, end);
    const after = current.slice(end);

    const needsLeadingNewline =
      prefixNewLine && before.length > 0 && !before.endsWith('\n');
    const insertion = `${needsLeadingNewline ? '\n\n' : ''}${
      selected ? snippet.replace('Section Heading', selected).replace('Quoted studio insight', selected).replace('Key point or movement cue', selected) : snippet
    }`;

    const next = `${before}${insertion}${after}`;
    updateActivePost({ content: next });

    requestAnimationFrame(() => {
      if (bodyTextareaRef.current) {
        const cursor = before.length + insertion.length;
        bodyTextareaRef.current.focus();
        bodyTextareaRef.current.setSelectionRange(cursor, cursor);
      }
    });
  };

  const activeWordCount = useMemo(() => {
    if (!activePost?.content?.trim()) return 0;
    return activePost.content.trim().split(/\s+/).length;
  }, [activePost?.content]);

  const activeAutoReadTime = useMemo(
    () => calculateReadTime(activePost?.content, activePost?.excerpt),
    [activePost?.content, activePost?.excerpt]
  );

  return (
    <div className="space-y-5">
      {/* Top Bar: Summary & Section Header Toggle */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
              Journal Editorial Studio
            </h4>
            <p className="text-xs text-white/60">
              {publishedCount} Published &middot; {draftCount} Drafts &middot; Write rich structured essays and preview the customer experience before saving live.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowHeaderSettings((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white cursor-pointer whitespace-nowrap"
            >
              {showHeaderSettings ? 'Hide Journal Header' : 'Edit Journal Header'}
            </button>
            <button
              type="button"
              onClick={handleAddArticle}
              className="px-4 py-2 rounded-xl bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap"
            >
              <Plus size={15} />
              <span>New Article</span>
            </button>
          </div>
        </div>

        {showHeaderSettings && (
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                Journal Eyebrow / Kicker
              </label>
              <input
                type="text"
                value={draftSectionCopy.blogKicker}
                onChange={(e) =>
                  setDraftSectionCopy({ ...draftSectionCopy, blogKicker: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                Journal Main Title
              </label>
              <input
                type="text"
                value={draftSectionCopy.blogTitle}
                onChange={(e) =>
                  setDraftSectionCopy({ ...draftSectionCopy, blogTitle: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                Journal Intro Description
              </label>
              <textarea
                rows={2}
                value={draftSectionCopy.blogSubtitle}
                onChange={(e) =>
                  setDraftSectionCopy({ ...draftSectionCopy, blogSubtitle: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Master-Detail Editorial Workspace */}
      {draftBlogPosts.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#141414] border border-white/10 text-center space-y-3">
          <p className="text-sm text-white/75">No blog articles yet.</p>
          <button
            type="button"
            onClick={handleAddArticle}
            className="px-5 py-2.5 rounded-full bg-[#ebd2d8] text-[#3d111e] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Your First Article</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT RAIL: Article Selector List */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="text-[10px] uppercase tracking-widest font-bold text-white/50 px-1">
              Articles ({draftBlogPosts.length})
            </div>
            <div className="space-y-2 max-h-[300px] lg:max-h-[620px] overflow-y-auto pr-1">
              {draftBlogPosts.map((post, idx) => {
                const isSelected = activePost?.id === post.id;
                const isDraft = post.status === 'draft';
                const listPillar = resolvePostPillar(post);
                const ListIcon = listPillar.IconComponent;
                return (
                  <div
                    key={post.id}
                    onClick={() => setActivePostId(post.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#ebd2d8]/12 border-[#ebd2d8]'
                        : 'bg-[#141414] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-12 h-12 rounded-lg bg-black border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                        {post.image?.trim() ? (
                          <img
                            src={post.image}
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={16} className="text-white/30" />
                        )}
                        {listPillar.hasPillarOrIcon && (
                          <span
                            className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded bg-[#141414]/90 border border-white/20 flex items-center justify-center"
                            title={listPillar.pillarBadgeLabel}
                          >
                            <ListIcon size={11} className="text-[#d1dee7]" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#ebd2d8]">
                          <span>{String(idx + 1).padStart(2, '0')}</span>
                          <span>&middot;</span>
                          <span className={isDraft ? 'text-amber-300' : 'text-emerald-300'}>
                            {isDraft ? 'Draft' : 'Published'}
                          </span>
                          {post.featured && (
                            <>
                              <span>&middot;</span>
                              <span className="text-[#ebd2d8]">Featured</span>
                            </>
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-white truncate mt-0.5">
                          {post.title || 'Untitled Article'}
                        </h5>
                        <p className="text-[11px] text-white/55 truncate">
                          {listPillar.hasPillarOrIcon ? `${listPillar.pillarBadgeLabel} · ` : ''}
                          {post.category || 'Uncategorized'}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between pt-2 border-t border-white/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveArticle(idx, -1)}
                          className="p-1.5 rounded-md bg-white/5 text-white/75 hover:bg-white/15 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === draftBlogPosts.length - 1}
                          onClick={() => handleMoveArticle(idx, 1)}
                          className="p-1.5 rounded-md bg-white/5 text-white/75 hover:bg-white/15 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateArticle(post)}
                          className="p-1.5 rounded-md bg-white/5 text-white/75 hover:bg-white/15 cursor-pointer"
                          title="Duplicate Article"
                        >
                          <CopyPlus size={12} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setDraftBlogPosts(draftBlogPosts.filter((p) => p.id !== post.id))
                        }
                        className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                        title="Delete Article"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANE: Focused Editor + Customer Previews */}
          {activePost && (
            <div className="lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-[#141414] border border-white/15 space-y-5">
              {/* Editor Mode & Publish/Feature Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-center gap-1 p-1 bg-black/50 border border-white/10 rounded-xl w-fit">
                  {[
                    { id: 'write', label: 'Write & Edit', icon: PenLine },
                    { id: 'cardPreview', label: 'Card Preview', icon: Eye },
                    { id: 'readerPreview', label: 'Reader Preview', icon: BookOpen },
                  ].map((mode) => {
                    const ModeIcon = mode.icon;
                    const active = editorMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setEditorMode(mode.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-[#ebd2d8] text-[#3d111e]'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <ModeIcon size={13} />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextFeatured = !activePost.featured;
                      setDraftBlogPosts(
                        draftBlogPosts.map((p) => {
                          if (p.id === activePost.id) {
                            return { ...p, featured: nextFeatured };
                          }
                          return nextFeatured ? { ...p, featured: false } : p;
                        })
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activePost.featured
                        ? 'bg-[#ebd2d8]/20 border-[#ebd2d8] text-[#ebd2d8]'
                        : 'bg-white/5 border-white/15 text-white/70 hover:text-white'
                    }`}
                  >
                    <Star size={13} fill={activePost.featured ? 'currentColor' : 'none'} />
                    <span>{activePost.featured ? 'Featured Lead' : 'Set Featured'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateActivePost({
                        status: activePost.status === 'draft' ? 'published' : 'draft',
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                      activePost.status === 'draft'
                        ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                        : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                    }`}
                  >
                    {activePost.status === 'draft' ? 'Status: Draft (Hidden)' : 'Status: Published'}
                  </button>
                </div>
              </div>

              {editorMode === 'write' && (
                <div className="space-y-4">
                  {/* Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                        Article Title
                      </label>
                      <input
                        type="text"
                        value={activePost.title}
                        onChange={(e) => updateActivePost({ title: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/45 border border-white/15 text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                        Editorial Subtitle
                      </label>
                      <input
                        type="text"
                        value={activePost.subtitle || ''}
                        placeholder="Italic editorial sub-headline"
                        onChange={(e) => updateActivePost({ subtitle: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/45 border border-white/15 text-xs text-white italic"
                      />
                    </div>
                  </div>

                  {/* Category + Presets, Date, Author, Read Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        list="journal-category-suggestions"
                        value={activePost.category}
                        onChange={(e) => updateActivePost({ category: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/45 border border-white/15 text-xs text-white"
                      />
                      <datalist id="journal-category-suggestions">
                        {PRESET_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                        Publish Date
                      </label>
                      <input
                        type="text"
                        value={activePost.date}
                        onChange={(e) => updateActivePost({ date: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/45 border border-white/15 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                        Author Byline
                      </label>
                      <input
                        type="text"
                        value={activePost.author || ''}
                        placeholder="Marcus Bennet"
                        onChange={(e) => updateActivePost({ author: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/45 border border-white/15 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                        Read Time ({activeAutoReadTime} auto)
                      </label>
                      <input
                        type="text"
                        value={activePost.readTime || ''}
                        placeholder={activeAutoReadTime}
                        onChange={(e) => updateActivePost({ readTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/45 border border-white/15 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Wellness Pillar & Select Icon to Elaborate */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-black/35 border border-white/12 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#ebd2d8]">
                        Wellness Pillar &amp; Icon You Chose to Elaborate
                      </span>
                      <span className="text-[10px] text-white/50">
                        Shown on customer blog cards, inside the reader, and linked from Wellness Flow
                      </span>
                    </div>

                    {/* Pillar Picker */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1.5">
                        1. Select Wellness Pillar Covered
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {WELLNESS_PILLARS.map((pillar) => {
                          const isSelectedPillar = activePost.pillarId === pillar.id;
                          const PillarIconComp = getIconOptionMeta(pillar.defaultIcon).icon;
                          return (
                            <button
                              key={pillar.id}
                              type="button"
                              onClick={() => {
                                const prevPillar = getPillarMetaById(activePost.pillarId);
                                const shouldAutofillMeaning =
                                  !activePost.pillarMeaning?.trim() ||
                                  (prevPillar && activePost.pillarMeaning.startsWith(prevPillar.meaning));
                                updateActivePost({
                                  pillarId: pillar.id,
                                  pillarIcon: pillar.defaultIcon,
                                  pillarMeaning: shouldAutofillMeaning
                                    ? `${pillar.meaning} — ${pillar.benefits.join(', ')}`
                                    : activePost.pillarMeaning,
                                });
                              }}
                              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                                isSelectedPillar
                                  ? 'bg-[#637341]/55 border-[#d1dee7] text-white shadow-md'
                                  : 'bg-black/40 border-white/10 text-white/75 hover:border-white/30'
                              }`}
                            >
                              <PillarIconComp size={14} className="shrink-0 text-[#d1dee7]" />
                              <div className="min-w-0">
                                <span className="block text-[10px] font-bold uppercase tracking-wider truncate">
                                  {pillar.label}
                                </span>
                                <span className="block text-[9px] text-white/55 truncate">
                                  {pillar.meaning}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() =>
                            updateActivePost({
                              pillarId: '',
                              pillarMeaning: activePost.pillarMeaning || '',
                            })
                          }
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-center ${
                            !activePost.pillarId
                              ? 'bg-[#ebd2d8]/15 border-[#ebd2d8] text-[#ebd2d8]'
                              : 'bg-black/40 border-white/10 text-white/60 hover:border-white/30'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider">Custom / Icon Only</span>
                        </button>
                      </div>
                    </div>

                    {/* Icon Picker */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1.5">
                        2. Select Icon You Chose to Elaborate
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {SELECTABLE_BLOG_ICONS.map((iconOpt) => {
                          const IconComp = iconOpt.icon;
                          const isIconSelected =
                            (activePost.pillarIcon ||
                              getPillarMetaById(activePost.pillarId)?.defaultIcon) === iconOpt.name;
                          return (
                            <button
                              key={iconOpt.name}
                              type="button"
                              onClick={() => {
                                const prevIconOpt = getIconOptionMeta(activePost.pillarIcon);
                                const shouldAutofillMeaning =
                                  !activePost.pillarMeaning?.trim() ||
                                  activePost.pillarMeaning === prevIconOpt.hint;
                                updateActivePost({
                                  pillarIcon: iconOpt.name,
                                  pillarMeaning: shouldAutofillMeaning
                                    ? iconOpt.hint
                                    : activePost.pillarMeaning,
                                });
                              }}
                              className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                                isIconSelected
                                  ? 'bg-[#ebd2d8] text-[#3d111e] border-[#ebd2d8] shadow-md'
                                  : 'bg-black/40 text-white/75 border-white/10 hover:border-white/30 hover:text-white'
                              }`}
                              title={iconOpt.hint}
                            >
                              <IconComp size={16} />
                              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                                {iconOpt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Meaning Elaborated */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                        3. Pillar Meaning &amp; Icon Elaboration Shown to Customers
                      </label>
                      <input
                        type="text"
                        value={activePost.pillarMeaning || ''}
                        placeholder="e.g. Vitality & Organic Growth — Rooted spinal alignment and cellular renewal"
                        onChange={(e) => updateActivePost({ pillarMeaning: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-lg bg-black/45 border border-white/15 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] uppercase font-bold text-white/60">
                        Card Summary Excerpt
                      </label>
                      <span className="text-[10px] text-white/40 tabular-nums">
                        {(activePost.excerpt || '').length} chars
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={activePost.excerpt}
                      onChange={(e) => updateActivePost({ excerpt: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/45 border border-white/15 text-xs text-white leading-relaxed"
                    />
                  </div>

                  {/* Full Article Body with Formatting Toolbar */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                      <label className="text-[10px] uppercase font-bold text-white/60">
                        Full Article Body ({activeWordCount} words &middot; {activeAutoReadTime})
                      </label>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleInsertFormatting('## Section Heading')}
                          className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                          title="Insert Section Heading"
                        >
                          <Heading2 size={12} />
                          <span>Heading</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertFormatting('> "Quoted studio insight"')}
                          className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                          title="Insert Pull Quote"
                        >
                          <Quote size={12} />
                          <span>Quote</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertFormatting('- Key point or movement cue')}
                          className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                          title="Insert Bullet Item"
                        >
                          <List size={12} />
                          <span>Bullet</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertFormatting('---')}
                          className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                          title="Insert Divider Line"
                        >
                          <Minus size={12} />
                          <span>Divider</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={bodyTextareaRef}
                      rows={7}
                      value={activePost.content || ''}
                      placeholder="Write your full article here. Use ## for headings, > for serif pull quotes, and - for bullet lists..."
                      onChange={(e) => updateActivePost({ content: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-xl bg-black/45 border border-white/15 text-xs text-white leading-relaxed font-hn"
                    />
                  </div>

                  {/* Key Takeaways Builder */}
                  <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#ebd2d8]">
                        Studio Key Takeaways (Shown inside Reader)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateActivePost({
                            takeaways: [
                              ...(activePost.takeaways || []),
                              'New studio takeaway highlight',
                            ],
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add Takeaway</span>
                      </button>
                    </div>
                    {(activePost.takeaways || []).length === 0 ? (
                      <p className="text-[11px] text-white/45">
                        Optional: add quick coaching bullets so busy clients absorb the core takeaways immediately.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {(activePost.takeaways || []).map((point, tIdx) => (
                          <div key={tIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => {
                                const next = [...(activePost.takeaways || [])];
                                next[tIdx] = e.target.value;
                                updateActivePost({ takeaways: next });
                              }}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-black/45 border border-white/15 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = (activePost.takeaways || []).filter(
                                  (_, i) => i !== tIdx
                                );
                                updateActivePost({ takeaways: next });
                              }}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                              title="Remove Takeaway"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black flex items-center justify-center">
                        {activePost.image?.trim() ? (
                          <img
                            src={activePost.image}
                            alt={activePost.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={20} className="text-white/30" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <label className="block text-[10px] uppercase font-bold text-white/60">
                          Cover Image URL or Upload
                        </label>
                        <input
                          type="text"
                          value={activePost.image}
                          placeholder="Paste URL or upload photo..."
                          onChange={(e) => updateActivePost({ image: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/45 border border-white/15 text-xs text-white font-mono"
                        />
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white cursor-pointer inline-flex items-center gap-1.5">
                            <Upload size={12} />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const targetId = activePost.id;
                                onFileUpload(e, (url) => updateActivePost({ image: url }, targetId));
                              }}
                            />
                          </label>
                          {activePost.image?.trim() && (
                            <button
                              type="button"
                              onClick={() => updateActivePost({ image: '' })}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[11px] text-white/70 hover:text-red-300 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <ImageStyleControls
                      style={activePost.imageStyle}
                      onChange={(nextStyle) => updateActivePost({ imageStyle: nextStyle })}
                      themeColors={draftThemeColors}
                      onOpenBgRemover={() =>
                        onOpenBgRemover(
                          activePost.image || '',
                          `Blog: ${activePost.title || 'Cover Image'}`,
                          (url) => updateActivePost({ image: url })
                        )
                      }
                    />

                    {/* Additional Story Photos */}
                    <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="block text-[10px] uppercase font-bold tracking-wider text-[#ebd2d8]">
                            Additional Story Photos ({(activePost.additionalImages || []).length}/10)
                          </span>
                          <span className="text-[10px] text-white/50">
                            Appears in the horizontal photo gallery inside the article reader.
                          </span>
                        </div>
                        <label className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase text-white flex items-center gap-1 cursor-pointer shrink-0">
                          <Plus size={12} />
                          <span>Add Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const targetId = activePost.id;
                              if (onMultiFileUpload) {
                                onMultiFileUpload(e, (urls) =>
                                  setDraftBlogPosts((prev) =>
                                    prev.map((p) =>
                                      p.id === targetId
                                        ? {
                                            ...p,
                                            additionalImages: [
                                              ...(p.additionalImages || []),
                                              ...urls,
                                            ].slice(0, 10),
                                          }
                                        : p
                                    )
                                  )
                                );
                              } else {
                                onFileUpload(e, (url) =>
                                  setDraftBlogPosts((prev) =>
                                    prev.map((p) =>
                                      p.id === targetId
                                        ? {
                                            ...p,
                                            additionalImages: [
                                              ...(p.additionalImages || []),
                                              url,
                                            ].slice(0, 10),
                                          }
                                        : p
                                    )
                                  )
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      {(activePost.additionalImages || []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(activePost.additionalImages || []).map((extraImg, idx) => (
                            <div
                              key={idx}
                              className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/15 bg-black"
                            >
                              <img
                                src={extraImg}
                                alt={`Story photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateActivePost({
                                    additionalImages: (activePost.additionalImages || []).filter(
                                      (_, i) => i !== idx
                                    ),
                                  })
                                }
                                className="absolute top-0.5 right-0.5 p-1 rounded bg-black/75 text-red-400 hover:text-red-300 cursor-pointer"
                                title="Remove photo"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {editorMode === 'cardPreview' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-white/55">
                    Live preview of how customers see this article card on your Journal page:
                  </p>
                  <div
                    className="max-w-md mx-auto border p-5 sm:p-6 shadow-2xl"
                    style={{
                      backgroundColor: draftThemeColors.wine,
                      color: draftThemeColors.cream,
                      borderColor: `${draftThemeColors.cream}20`,
                    }}
                  >
                    {(() => {
                      const imgProps = getImageStyleProps(activePost.imageStyle, draftThemeColors);
                      return (
                        <div
                          className="relative h-48 overflow-hidden mb-4 bg-black border"
                          style={{
                            borderColor: `${draftThemeColors.cream}15`,
                            backgroundColor: imgProps.containerBg || '#000000',
                          }}
                        >
                          {activePost.image?.trim() ? (
                            <img
                              src={activePost.image}
                              alt={activePost.title}
                              referrerPolicy="no-referrer"
                              className={`w-full h-full ${imgProps.fitClass} ${imgProps.roundedClass}`}
                              style={imgProps.imgStyle as React.CSSProperties}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs opacity-60">
                              {activePost.title}
                            </div>
                          )}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(to top, ${draftThemeColors.wine}dd, transparent 65%)`,
                            }}
                          />
                        </div>
                      );
                    })()}
                    <div
                      className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold mb-2"
                      style={{ color: draftThemeColors.blush }}
                    >
                      {activePost.featured && (
                        <>
                          <span>Featured Essay</span>
                          <span>&middot;</span>
                        </>
                      )}
                      <span>{activePost.category}</span>
                      <span>&middot;</span>
                      <span style={{ color: `${draftThemeColors.cream}aa` }}>{activePost.date}</span>
                      <span>&middot;</span>
                      <span style={{ color: `${draftThemeColors.cream}aa` }}>
                        {activePost.readTime?.trim() || activeAutoReadTime}
                      </span>
                    </div>
                    <h4 className="text-xl font-extrabold uppercase tracking-tight mb-2 leading-snug">
                      {activePost.title}
                    </h4>
                    {activePost.subtitle && (
                      <p
                        className="font-serif italic text-sm mb-2.5"
                        style={{ color: draftThemeColors.blush }}
                      >
                        {activePost.subtitle}
                      </p>
                    )}
                    {(() => {
                      const previewPillar = resolvePostPillar(activePost);
                      if (!previewPillar.hasPillarOrIcon) return null;
                      const PreviewIcon = previewPillar.IconComponent;
                      return (
                        <div
                          className="mb-3 p-2.5 border flex items-start gap-2.5"
                          style={{
                            backgroundColor: `${draftThemeColors.cardBg}70`,
                            borderColor: `${draftThemeColors.blush}30`,
                          }}
                        >
                          <div
                            className="w-8 h-8 flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${draftThemeColors.wellnessBg}b0`,
                              borderColor: `${draftThemeColors.wellnessIcon}40`,
                            }}
                          >
                            <PreviewIcon size={15} style={{ color: draftThemeColors.wellnessIcon }} />
                          </div>
                          <div className="min-w-0">
                            <span
                              className="block text-[10px] uppercase tracking-[0.18em] font-bold"
                              style={{ color: draftThemeColors.blush }}
                            >
                              {previewPillar.pillarBadgeLabel} &bull; {previewPillar.iconLabel} Icon
                            </span>
                            <p className="text-[11px] leading-snug mt-0.5" style={{ color: `${draftThemeColors.cream}e0` }}>
                              {previewPillar.meaningText}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    <p
                      className="text-xs leading-relaxed mb-4"
                      style={{ color: `${draftThemeColors.cream}cc` }}
                    >
                      {activePost.excerpt}
                    </p>
                    <div
                      className="pt-3 border-t flex items-center justify-between text-xs"
                      style={{ borderColor: `${draftThemeColors.cream}15` }}
                    >
                      <span style={{ color: `${draftThemeColors.cream}99` }}>
                        {activePost.author?.trim() || 'Marcus Bennet'}
                      </span>
                      <span
                        className="font-bold uppercase tracking-widest text-[11px]"
                        style={{ color: draftThemeColors.blush }}
                      >
                        Read Article &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {editorMode === 'readerPreview' && (
                <div
                  className="p-5 sm:p-8 border space-y-5 max-h-[540px] overflow-y-auto"
                  style={{
                    backgroundColor: draftThemeColors.wine,
                    color: draftThemeColors.cream,
                    borderColor: `${draftThemeColors.cream}20`,
                  }}
                >
                  <div
                    className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold"
                    style={{ color: draftThemeColors.blush }}
                  >
                    <span>{activePost.category}</span>
                    <span>&middot;</span>
                    <span style={{ color: `${draftThemeColors.cream}aa` }}>{activePost.date}</span>
                    <span>&middot;</span>
                    <span style={{ color: `${draftThemeColors.cream}aa` }}>
                      By {activePost.author?.trim() || 'Marcus Bennet'}
                    </span>
                    <span>&middot;</span>
                    <span style={{ color: `${draftThemeColors.cream}aa` }}>
                      {activePost.readTime?.trim() || activeAutoReadTime}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight leading-tight">
                    {activePost.title}
                  </h3>

                  {activePost.subtitle && (
                    <p
                      className="font-serif italic text-base"
                      style={{ color: draftThemeColors.blush }}
                    >
                      {activePost.subtitle}
                    </p>
                  )}

                  {(() => {
                    const readerPreviewPillar = resolvePostPillar(activePost);
                    if (!readerPreviewPillar.hasPillarOrIcon) return null;
                    const ReaderPreviewIcon = readerPreviewPillar.IconComponent;
                    return (
                      <div
                        className="p-3.5 border flex items-start gap-3"
                        style={{
                          backgroundColor: `${draftThemeColors.wellnessBg}33`,
                          borderColor: `${draftThemeColors.wellnessIcon}40`,
                        }}
                      >
                        <div
                          className="w-10 h-10 flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: draftThemeColors.wellnessBg,
                            borderColor: `${draftThemeColors.wellnessIcon}50`,
                          }}
                        >
                          <ReaderPreviewIcon size={19} style={{ color: draftThemeColors.wellnessIcon }} />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <span
                            className="block text-[10px] uppercase tracking-[0.18em] font-bold"
                            style={{ color: draftThemeColors.wellnessIcon }}
                          >
                            Illustrates {readerPreviewPillar.pillarBadgeLabel} &bull; {readerPreviewPillar.iconLabel} Icon
                          </span>
                          <p className="text-xs font-semibold leading-snug" style={{ color: draftThemeColors.cream }}>
                            {readerPreviewPillar.meaningText}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {activePost.takeaways && activePost.takeaways.length > 0 && (
                    <div
                      className="p-4 border space-y-2"
                      style={{
                        backgroundColor: `${draftThemeColors.cardBg}70`,
                        borderColor: `${draftThemeColors.blush}30`,
                      }}
                    >
                      <span
                        className="block text-[10px] uppercase tracking-[0.2em] font-bold"
                        style={{ color: draftThemeColors.blush }}
                      >
                        Studio Key Takeaways
                      </span>
                      <ul className="space-y-1.5">
                        {activePost.takeaways.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                            <CheckCircle2
                              size={13}
                              className="shrink-0 mt-0.5"
                              style={{ color: draftThemeColors.blush }}
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    className="border-t pt-4"
                    style={{ borderColor: `${draftThemeColors.cream}15` }}
                  >
                    <ArticleBodyRenderer
                      content={activePost.content || activePost.excerpt}
                      themeColors={draftThemeColors}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSaveAndApply('Blog Articles')}
          className="px-6 py-3 rounded-full bg-[#ebd2d8] text-[#3d111e] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:bg-[#efeee9]"
        >
          <Save size={14} />
          <span>Save &amp; Confirm Blog Articles</span>
        </button>
      </div>
    </div>
  );
}
