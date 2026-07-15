import type {
  HomepageV2Block,
  HomepageV2BlockType,
  HomepageV2Item,
  HomepageV2LocalizedContent,
  HomepageV2Translations,
  LocaleCode,
} from '@/lib/api';

export const HOMEPAGE_BLOCK_TYPES: HomepageV2BlockType[] = [
  'hero_carousel', 'video_hero', 'media_story', 'video_player', 'image_marquee',
  'masonry_gallery', 'awards_showcase', 'sponsor_wall', 'campaign', 'testimonials',
  'statistics', 'feature_grid', 'program_directory', 'performances', 'latest_news',
  'timeline', 'editorial_quote', 'cta',
];

export const HOMEPAGE_BLOCK_CATALOG: Record<HomepageV2BlockType, {
  category: 'brand' | 'media' | 'trust' | 'connected' | 'action';
  name: Record<LocaleCode, string>;
  description: Record<LocaleCode, string>;
}> = {
  hero_carousel: { category: 'brand', name: { zh: '首屏轮播', en: 'Hero carousel', fr: 'Carrousel principal' }, description: { zh: '图片或视频首屏轮播', en: 'Image or video hero slides', fr: 'Diapositives image ou vidéo' } },
  video_hero: { category: 'brand', name: { zh: '背景视频首屏', en: 'Video hero', fr: 'Vidéo principale' }, description: { zh: '背景视频与前景文字', en: 'Background video with foreground copy', fr: 'Vidéo de fond avec texte' } },
  media_story: { category: 'media', name: { zh: '图文故事', en: 'Media story', fr: 'Récit média' }, description: { zh: '图片或视频与文字组合', en: 'Media and editorial copy', fr: 'Média et contenu éditorial' } },
  video_player: { category: 'media', name: { zh: '视频播放器', en: 'Video player', fr: 'Lecteur vidéo' }, description: { zh: '带封面和说明的独立视频', en: 'Accessible standalone video', fr: 'Vidéo autonome accessible' } },
  image_marquee: { category: 'media', name: { zh: '三排滚动图片', en: 'Three-row marquee', fr: 'Galerie défilante' }, description: { zh: '三排反向循环的照片墙', en: 'Three alternating image rows', fr: 'Trois rangées alternées' } },
  masonry_gallery: { category: 'media', name: { zh: '瀑布流相册', en: 'Masonry gallery', fr: 'Galerie mosaïque' }, description: { zh: '适合演出与获奖照片', en: 'Mixed-ratio photo gallery', fr: 'Galerie photo multiformat' } },
  awards_showcase: { category: 'trust', name: { zh: '获奖展示', en: 'Awards showcase', fr: 'Prix et distinctions' }, description: { zh: '奖项、赛事与获奖照片', en: 'Awards, competitions, and photos', fr: 'Prix, concours et photos' } },
  sponsor_wall: { category: 'trust', name: { zh: '赞助伙伴', en: 'Sponsor wall', fr: 'Partenaires' }, description: { zh: '赞助商 Logo 与链接', en: 'Sponsor logos and links', fr: 'Logos et liens partenaires' } },
  campaign: { category: 'action', name: { zh: '广告与推广位', en: 'Campaign / ad', fr: 'Campagne / publicité' }, description: { zh: '支持排期的推广内容', en: 'Scheduled promotional placement', fr: 'Placement promotionnel planifié' } },
  testimonials: { category: 'trust', name: { zh: '学员评价', en: 'Testimonials', fr: 'Témoignages' }, description: { zh: '家长与学员反馈', en: 'Parent and student stories', fr: 'Avis des parents et élèves' } },
  statistics: { category: 'trust', name: { zh: '数据展示', en: 'Statistics', fr: 'Statistiques' }, description: { zh: '数字、图标和标签', en: 'Counters and labels', fr: 'Chiffres et libellés' } },
  feature_grid: { category: 'trust', name: { zh: '特色功能', en: 'Feature grid', fr: 'Points forts' }, description: { zh: '教学、设施与优势', en: 'Teaching and studio features', fr: 'Atouts pédagogiques' } },
  program_directory: { category: 'connected', name: { zh: '课程目录', en: 'Program directory', fr: 'Programmes' }, description: { zh: '连接课程后台', en: 'Connected to Programs', fr: 'Relié aux programmes' } },
  performances: { category: 'connected', name: { zh: '演出与赛事', en: 'Performances', fr: 'Spectacles' }, description: { zh: '连接活动后台', en: 'Connected to Performances', fr: 'Relié aux spectacles' } },
  latest_news: { category: 'connected', name: { zh: '最新新闻', en: 'Latest news', fr: 'Actualités' }, description: { zh: '连接新闻后台', en: 'Connected to News', fr: 'Relié aux actualités' } },
  timeline: { category: 'trust', name: { zh: '时间线', en: 'Timeline', fr: 'Chronologie' }, description: { zh: '学校历史与里程碑', en: 'History and milestones', fr: 'Histoire et jalons' } },
  editorial_quote: { category: 'brand', name: { zh: '品牌宣言', en: 'Editorial quote', fr: 'Citation éditoriale' }, description: { zh: '醒目的品牌文字或引语', en: 'Brand statement or quote', fr: 'Déclaration de marque' } },
  cta: { category: 'action', name: { zh: '行动号召', en: 'Call to action', fr: 'Appel à l’action' }, description: { zh: '报名、咨询或租赁入口', en: 'Registration or contact action', fr: 'Inscription ou contact' } },
};

export function emptyHomepageContent(): HomepageV2LocalizedContent {
  return { eyebrow: '', title: '', subtitle: '', body: '', label: '', caption: '', alt_text: '', primary_label: '', secondary_label: '', link_label: '' };
}

export function emptyHomepageTranslations(): HomepageV2Translations {
  return { zh: emptyHomepageContent(), en: emptyHomepageContent(), fr: emptyHomepageContent() };
}

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createHomepageItem(prefix = 'item'): HomepageV2Item {
  return {
    id: uniqueId(prefix), is_enabled: true, media_type: 'image', media_url: '', mobile_url: '', poster_url: '',
    focal_x: 50, focal_y: 50, content: emptyHomepageTranslations(), link: { href: '', new_tab: false },
    schedule: { start_at: null, end_at: null, timezone: 'America/Toronto' }, meta: {},
  };
}

export function createHomepageBlock(type: HomepageV2BlockType, locale: LocaleCode = 'zh'): HomepageV2Block {
  const catalog = HOMEPAGE_BLOCK_CATALOG[type];
  const content = emptyHomepageTranslations();
  content[locale].title = catalog.name[locale];
  const itemCount = type === 'statistics' ? 4 : type === 'hero_carousel' ? 1 : 0;
  const items = Array.from({ length: itemCount }, (_, index) => {
    const item = createHomepageItem(type === 'statistics' ? 'stat' : 'slide');
    if (type === 'statistics') {
      item.media_type = 'none';
      item.meta = { value: index === 0 ? '200+' : '0' };
    }
    return item;
  });
  const source = type === 'program_directory' ? 'programs' : type === 'performances' ? 'performances' : type === 'latest_news' ? 'news' : 'none';
  return {
    id: uniqueId(type), type, schema_version: 1, admin_label: catalog.name[locale], is_enabled: false,
    schedule: { start_at: null, end_at: null, timezone: 'America/Toronto' },
    design: { theme: type === 'video_hero' ? 'dark_plum' : 'white', width: type.includes('hero') || type === 'image_marquee' ? 'full' : 'contained', spacing: 'normal', alignment: 'left', media_ratio: 'landscape', overlay: type.includes('hero') ? 'dark' : 'none' },
    behavior: { animation: 'fade_up', autoplay: type === 'video_hero', loop: type === 'video_hero' || type === 'image_marquee', speed: 'normal' },
    content, items, primary_link: { href: '', new_tab: false }, secondary_link: { href: '', new_tab: false },
    data_source: { source, limit: type === 'latest_news' ? 4 : 6, sort: 'default', category: '' }, config: {},
  };
}

export function localizedHomepageContent(translations: HomepageV2Translations, locale: string) {
  const selected = locale === 'fr' ? translations.fr : locale === 'en' ? translations.en : translations.zh;
  const fallback = translations.zh;
  return Object.fromEntries(Object.keys(fallback).map((key) => [key, selected[key as keyof HomepageV2LocalizedContent] || fallback[key as keyof HomepageV2LocalizedContent] || ''])) as unknown as HomepageV2LocalizedContent;
}

export function homepageHref(href: string, locale: string) {
  if (!href) return '';
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  const clean = href.replace(/^\//, '');
  return `/${locale}/${clean}`.replace(/\/$/, '');
}
