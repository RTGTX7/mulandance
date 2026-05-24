import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('error');

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-[#FAFAF8] via-[#F5F0FF] to-[#FAFAF8] flex items-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Animated 404 Number */}
          <div className="relative mb-8">
            <h1 className="text-8xl md:text-9xl font-bold font-heading bg-gradient-to-r from-[#6B21A8] via-[#9333EA] to-[#A855F7] bg-clip-text text-transparent animate-pulse">
              404
            </h1>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#D4A843] rounded-full opacity-20 animate-bounce" />
            <div className="absolute -bottom-2 -left-6 w-12 h-12 bg-[#EC4899] rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s' }} />
          </div>

          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-medium border border-[#E5E1E8]">
              <Search className="w-10 h-10 text-[#6B21A8]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-[#1F1A2D] mb-4">
            {t('title')}
          </h2>

          {/* Description */}
          <p className="text-lg text-[#7C7480] mb-8 max-w-md mx-auto leading-relaxed">
            {t('description')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/en"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6B21A8] to-[#A855F7] text-white px-8 py-3 rounded-full font-semibold shadow-medium hover:shadow-strong hover:-translate-y-0.5 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('returnHome')}
            </Link>
            <Link
              href="/en/programs"
              className="inline-flex items-center gap-2 border-2 border-[#6B21A8] text-[#6B21A8] px-8 py-3 rounded-full font-semibold hover:bg-[#6B21A8] hover:text-white transition-all duration-300"
            >
              {t('explorePrograms')}
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-12 p-6 bg-white rounded-xl border border-[#E5E1E8] shadow-soft">
            <h3 className="text-lg font-semibold text-[#1F1A2D] mb-3">{t('helpTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-[#FAFAF8] rounded-lg">
                <p className="font-medium text-[#6B21A8] mb-1">{t('checkUrl.label')}</p>
                <p className="text-[#7C7480]">{t('checkUrl.desc')}</p>
              </div>
              <div className="p-4 bg-[#FAFAF8] rounded-lg">
                <p className="font-medium text-[#6B21A8] mb-1">{t('useSearch.label')}</p>
                <p className="text-[#7C7480]">{t('useSearch.desc')}</p>
              </div>
              <div className="p-4 bg-[#FAFAF8] rounded-lg">
                <p className="font-medium text-[#6B21A8] mb-1">{t('contactUs.label')}</p>
                <p className="text-[#7C7480]">{t('contactUs.desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}