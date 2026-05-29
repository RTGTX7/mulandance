'use client';

import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/components/ui/i18n-client';
import { settingsApi } from '@/lib/api';
import { ExternalLink, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations();
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadRegistrationLink() {
      try {
        const links = await settingsApi.registrationLinks();
        if (!mounted) return;

        const params = new URLSearchParams(window.location.search);
        const isSummerCamp = params.get('type') === 'summer-camp';
        const summerUrl = links.summer_camp_enabled ? links.summer_camp_registration_url : '';
        const nextUrl = (isSummerCamp && summerUrl ? summerUrl : links.registration_url).trim();

        setTargetUrl(nextUrl);
        if (nextUrl) {
          window.location.assign(nextUrl);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : t('registerPage.loadFailed'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRegistrationLink();

    return () => {
      mounted = false;
    };
  }, [t]);

  return (
    <div className="section-padding">
      <div className="container max-w-2xl">
        <Breadcrumbs items={[{ label: t('common.nav.classes'), href: 'classes' }]} />
        <h1 className="heading-xl mb-4">{t('programs.register.title')}</h1>
        <p className="text-lead mb-8">{t('programs.register.subtitle')}</p>

        <Card>
          <CardContent className="space-y-5 pt-6">
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('registerPage.opening')}
              </div>
            )}

            {!loading && targetUrl && (
              <>
                <p className="text-muted-foreground">{t('registerPage.manualHint')}</p>
                <Button asChild size="lg" className="w-full">
                  <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t('registerPage.openLink')}
                  </a>
                </Button>
              </>
            )}

            {!loading && !targetUrl && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error || t('registerPage.notConfigured')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
