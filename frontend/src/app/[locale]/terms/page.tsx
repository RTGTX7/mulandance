'use client';

import { useTranslations } from '@/components/ui/i18n-client';

export default function TermsPage() {
  const t = useTranslations();

  const isZh = typeof window !== 'undefined' && window.location.pathname.startsWith('/zh');

  const sections = isZh
    ? [
        {
          title: "条款接受",
          text: "访问和使用木兰舞蹈工作室的网站和服务，即表示您同意受本服务条款的约束。如果您不同意，请不要使用我们的服务。",
        },
        {
          title: "注册",
          text: "创建账户时，您必须提供准确完整的信息。您有责任维护账户凭证的安全性，以及对账户下的所有活动负责。",
        },
        {
          title: "报名与付款",
          text: "课程注册以有空额为前提。学期开始后14天内不可退费。取消申请必须以书面形式提交。详见缺勤与补课政策。",
        },
        {
          title: "行为规范",
          text: "所有学员、家长访客必须遵守我们的行为规范，包括尊重教职员工和其他学员、遵守工作室规则，为所有人维持一个安全友好的环境。",
        },
        {
          title: "知识产权",
          text: "本网站所有内容，包括文字、图片、视频和编舞，均为木兰舞蹈工作室财产，受版权法保护。",
        },
        {
          title: "责任限制",
          text: "木兰舞蹈工作室不对舞蹈活动中产生的任何伤害负责。参与者自负风险。参加任何课程或演出前必须签署免责声明书。",
        },
        {
          title: "联系我们",
          text: "如有关于本条款的疑问，请发送邮件至 info@mulandance.com 联系我们。",
        },
      ]
    : [
        {
          title: "Acceptance of Terms",
          text: "By accessing and using the Mulan Dance Studio website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.",
        },
        {
          title: "Registration",
          text: "You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials and for all activities under your account.",
        },
        {
          title: "Enrollment & Payments",
          text: "Class enrollment is subject to availability. Tuition fees are non-refundable after the first 14 days of a term. Cancellation requests must be submitted in writing. See our Absence & Makeup Policy for details.",
        },
        {
          title: "Code of Conduct",
          text: "All students, parents, and visitors must adhere to our code of conduct, which includes respecting staff and other students, following studio rules, and maintaining a safe and welcoming environment for everyone.",
        },
        {
          title: "Intellectual Property",
          text: "All content on this website, including text, images, videos, and choreography, is the property of Mulan Dance Studio and is protected by copyright laws.",
        },
        {
          title: "Limitation of Liability",
          text: "Mulan Dance Studio is not liable for any injuries sustained during dance activities. Participants engage in dance at their own risk. A waiver must be signed before participation in any class or performance.",
        },
        {
          title: "Contact",
          text: "For questions about these terms, contact us at info@mulandance.com.",
        },
      ];

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <h1 className="heading-xl mb-6">{isZh ? '服务条款' : 'Terms of Service'}</h1>
        <p className="text-muted-foreground mb-8">Last updated: May 24, 2026</p>

        <div className="space-y-8 text-body text-muted-foreground">
          {sections.map((section, index) => (
            <section key={index}>
              <h2 className="heading-md mb-3 text-foreground">{section.title}</h2>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
