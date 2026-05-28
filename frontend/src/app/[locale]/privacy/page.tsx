'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function PrivacyPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.footer.privacyPolicy'), href: 'privacy' }]} />
        <h1 className="heading-xl mb-4">{t('common.footer.privacyPolicy')}</h1>
      </div>
      <div className="container container-narrow space-y-8 text-body text-muted-foreground">
        <div className="mb-8">
          <p className="text-muted-foreground">Last updated: May 24, 2026</p>
        </div>

        <PrivacyContent />
      </div>
    </div>
  );
}

function PrivacyContent() {
  const t = useTranslations();
  const isZh = typeof window !== 'undefined' && window.location.pathname.startsWith('/zh');

  const sections = isZh
    ? [
        {
          title: "我们收集的信息",
          text: "我们直接收集您提供的信息，例如您注册课程、联系我们时提供的姓名、邮箱地址、电话号码和付款信息。我们也会收集关于您孩子的信息用于报名。",
        },
        {
          title: "我们如何使用您的信息",
          text: "我们使用收集的信息来提供服务、处理课程注册和付款、与您沟通课程和活动事宜、发送通讯（经您同意）以及确保学员安全。",
        },
        {
          title: "信息共享",
          text: "我们不出售、交易或出租您的个人信息给第三方。我们可能与合作伙伴分享信息以协助运营网站和服务，或在法律要求时分享。",
        },
        {
          title: "数据安全",
          text: "我们实施适当的安全措施来保护您的个人信息免受未经授权的访问、篡改、披露或销毁。",
        },
        {
          title: "您的权利",
          text: "您有权访问、更正或删除您的个人信息。请发送邮件至 info@mulandance.com 行使这些权利。",
        },
        {
          title: "联系我们",
          text: `如果您对本隐私政策有任何疑问，请通过 info@mulandance.com 或 ${t('common.footer.phone')} 联系我们。\n\n地址：${t('common.footer.address')}`,
        },
      ]
    : [
        {
          title: "Information We Collect",
          text: "We collect information you provide directly, such as name, email address, phone number, and payment information when you enroll in classes or contact us. We also collect information about your children for enrollment purposes.",
        },
        {
          title: "How We Use Your Information",
          text: "We use the information we collect to provide services, process class enrollments and payments, communicate with you about classes and events, send newsletters (with your consent), and ensure student safety.",
        },
        {
          title: "Information Sharing",
          text: "We do not sell, trade, or rent your personal information to third parties. We may share information with partners who assist us in operating our website and services, or when required by law.",
        },
        {
          title: "Data Security",
          text: "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
        },
        {
          title: "Your Rights",
          text: "You have the right to access, correct, or delete your personal information. Contact us at info@mulandance.com to exercise these rights.",
        },
        {
          title: "Contact",
          text: `If you have any questions about this privacy policy, please contact us at info@mulandance.com or ${t('common.footer.phone')}.\n\nAddress: ${t('common.footer.address')}`,
        },
      ];

  return (
    <>
      {sections.map((section, index) => (
        <section key={index}>
          <h2 className="heading-md mb-3 text-foreground">{section.title}</h2>
          <p>{section.text}</p>
        </section>
      ))}
    </>
  );
}
