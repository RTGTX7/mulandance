'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const copy = {
  zh: { title: '页面未找到', description: '抱歉，您查找的页面不存在或已被移动。', home: '返回首页' },
  fr: { title: 'Page introuvable', description: 'Desole, la page que vous cherchez est introuvable ou a ete deplacee.', home: "Retour a l'accueil" },
  en: { title: 'Page Not Found', description: 'Sorry, the page you are looking for does not exist or has moved.', home: 'Back to Home' },
} as const;

export default function LocaleNotFound() {
  const locale = usePathname().split('/')[1] || 'en';
  const text = locale === 'zh' || locale === 'zh-Hant' ? copy.zh : locale === 'fr' ? copy.fr : copy.en;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <SearchX className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <p className="mt-5 text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-foreground">{text.title}</h1>
        <p className="mt-3 text-muted-foreground">{text.description}</p>
        <Button asChild className="mt-7">
          <Link href={`/${locale}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {text.home}
          </Link>
        </Button>
      </div>
    </main>
  );
}
