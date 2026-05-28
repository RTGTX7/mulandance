'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface TranslationMessages {
  [key: string]: string | TranslationMessages | string[] | TranslationMessages[];
}

interface TranslationOptions {
  defaultMessage?: string;
}

interface Translator {
  (key: string, options?: TranslationOptions): string;
  raw: (key: string) => any;
}

const MessagesContext = createContext<TranslationMessages>({});
const LocaleContext = createContext<string>('en');

export interface LocaleProviderProps {
  children: ReactNode;
  locale: string;
  messages: TranslationMessages;
}

export function LocaleProvider({ children, locale, messages }: LocaleProviderProps) {
  return (
    <LocaleContext.Provider value={locale}>
      <MessagesContext.Provider value={messages}>
        {children}
      </MessagesContext.Provider>
    </LocaleContext.Provider>
  );
}

export function useTranslations(namespace?: string) {
  const messages = useContext(MessagesContext);

  function getMessageValue(key: string): unknown {
    const parts = key.split('.');
    let current: any = messages;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  function getMessage(key: string): string {
    const current = getMessageValue(key);
    return typeof current === 'string' ? current : key;
  }

  const t = ((key: string, options?: TranslationOptions) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const message = getMessage(fullKey);
    return message === fullKey ? options?.defaultMessage ?? key : message;
  }) as Translator;

  t.raw = (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return getMessageValue(fullKey);
  };

  return t;
}

export function useLocale() {
  return useContext(LocaleContext);
}
