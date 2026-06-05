import type { AiArticleImportItem, AiDraft } from '@/lib/api';
import { toPublicMediaUrl } from '@/lib/media';

export const ARTICLE_IMPORT_LOCALES = ['zh', 'en', 'fr'] as const;

export function slugifyImportedTitle(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return /[a-z0-9]/.test(slug) ? slug : `article-${Date.now().toString(36)}`;
}

export function importedMediaUrls(item?: AiArticleImportItem) {
  return (item?.source.media || [])
    .map((media) => toPublicMediaUrl(media.url))
    .filter((url): url is string => Boolean(url));
}

export function draftForLocale(drafts: AiDraft[], localeCode: string) {
  return drafts.find((draft) => draft.locale === localeCode);
}

export function firstDraftTitle(item: AiArticleImportItem, index: number) {
  return (
    draftForLocale(item.drafts, 'zh')?.fields.title ||
    item.drafts[0]?.fields.title ||
    item.source.title ||
    `imported-${index + 1}`
  );
}

export function bodyWithImportedImages(body: string, item: AiArticleImportItem | undefined, title: string) {
  const urls = importedMediaUrls(item);
  if (urls.length === 0) return body;

  const missingUrls = urls.filter((url) => !body.includes(url));
  if (missingUrls.length === 0) return body;

  const altText = title || item?.source.title || 'Imported image';
  const imageMarkdown =
    missingUrls.length > 1
      ? [':::carousel', ...missingUrls.map((url, index) => `![${altText} ${index + 1}](${url})`), ':::'].join('\n')
      : `![${altText}](${missingUrls[0]})`;

  return body.trim() ? `${body.trim()}\n\n${imageMarkdown}` : imageMarkdown;
}

export function importItemWithImagesInEveryDraft(item: AiArticleImportItem) {
  return {
    ...item,
    drafts: item.drafts.map((draft) => {
      const title = draft.fields.title || firstDraftTitle(item, 0);
      return {
        ...draft,
        fields: {
          ...draft.fields,
          body: bodyWithImportedImages(draft.fields.body || '', item, title),
        },
      };
    }),
  };
}

export function uniqueImportedArticleSlug(item: AiArticleImportItem, index: number) {
  const title = firstDraftTitle(item, index);
  const base = slugifyImportedTitle(title);
  const sourceDate = item.source.source_published_at ? new Date(item.source.source_published_at) : null;
  const suffix =
    sourceDate && !Number.isNaN(sourceDate.getTime())
      ? sourceDate.toISOString().slice(0, 10)
      : Date.now().toString(36);

  return `${base}-${suffix}-${index + 1}`.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}
