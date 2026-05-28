import * as OpenCC from 'opencc-js';
import type { TranslationMessages } from '@/components/ui/i18n-client';

export const SUPPORTED_LOCALES = ['en', 'zh', 'zh-Hant', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LANGUAGE_OPTIONS: Array<{ code: SupportedLocale; label: string; name: string }> = [
  { code: 'zh', label: '简体', name: '简体中文' },
  { code: 'zh-Hant', label: '繁體', name: '繁體中文' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
];

const localeSet = new Set<string>(SUPPORTED_LOCALES);
const toTraditionalConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });

export function isSupportedLocale(locale?: string): locale is SupportedLocale {
  return !!locale && localeSet.has(locale);
}

export function normalizeLocale(locale?: string): SupportedLocale {
  return isSupportedLocale(locale) ? locale : 'en';
}

export function isChineseLocale(locale?: string) {
  return locale === 'zh' || locale === 'zh-Hant';
}

export function isTraditionalLocale(locale?: string) {
  return locale === 'zh-Hant';
}

export function articleLocaleFor(locale?: string) {
  return locale === 'zh-Hant' ? 'zh' : normalizeLocale(locale);
}

export function dateLocaleFor(locale?: string) {
  if (locale === 'zh-Hant') return 'zh-TW';
  if (locale === 'zh') return 'zh-CN';
  if (locale === 'fr') return 'fr-CA';
  return 'en-US';
}

export function stripLocaleFromPathname(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isSupportedLocale(segments[0])) {
    return '/' + segments.slice(1).join('/');
  }
  return pathname;
}

export function toTraditional(input: string) {
  return input ? toTraditionalConverter(input) : input;
}

export function localizeText(input: string | undefined | null, locale?: string) {
  if (!input) return input;
  return isTraditionalLocale(locale) ? toTraditional(input) : input;
}

export function convertMessagesToTraditional<T extends TranslationMessages>(messages: T): T {
  return convertValueToTraditional(messages) as T;
}

function convertValueToTraditional(value: unknown): unknown {
  if (typeof value === 'string') return toTraditional(value);
  if (Array.isArray(value)) return value.map(convertValueToTraditional);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, convertValueToTraditional(item)])
    );
  }
  return value;
}
