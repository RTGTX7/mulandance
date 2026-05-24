'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface TranslationMessages {
  [key: string]: string | TranslationMessages;
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
  
  function getMessage(key: string): string {
    const parts = key.split('.');
    let current: any = messages;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return key;
      }
    }
    return typeof current === 'string' ? current : key;
  }

  const t = (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return getMessage(fullKey);
  };

  return t;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function getMessages(): TranslationMessages {
  return useContext(MessagesContext);
}
