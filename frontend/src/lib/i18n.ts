import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'zh'];

export default getRequestConfig(async ({ locale }) => {
  if (!locale || !locales.includes(locale)) {
    return {
      messages: await import('./locales/en.json'),
    };
  }
  return {
    messages: await import(`./locales/${locale}.json`),
  };
});
