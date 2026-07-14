'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Faq = { q: string; a: string };
type FaqCopy = { subtitle: string; contact: string; items: Faq[] };

const faqCopy: Record<'zh' | 'en' | 'fr', FaqCopy> = {
  zh: {
    subtitle: '查看课程、报名和课堂安排的常见问题。具体安排以工作室确认信息为准。',
    contact: '还有问题？欢迎联系工作室，我们会协助您选择合适的课程。',
    items: [
      { q: '孩子几岁可以开始学习舞蹈？', a: '课程适合的年龄会随课程类型和学期安排而变化。请联系工作室，我们会根据孩子的年龄和经验推荐合适的课程。' },
      { q: '第一次上课需要穿什么？', a: '请穿方便活动的舒适服装，并按课程要求准备干净的舞鞋。报名确认后，工作室会提供具体着装建议。' },
      { q: '如何选择合适的课程级别？', a: '老师会参考年龄、舞蹈经验和试课表现给出建议；新学员也可以先向工作室咨询安排。' },
      { q: '可以先体验课程吗？', a: '试课安排取决于课程名额和当期计划。请联系工作室确认可用时间。' },
      { q: '报名后如何了解课程时间？', a: '公开课表会显示长期固定课程；报名确认和临时调整会由工作室直接通知。' },
      { q: '请假或补课如何安排？', a: '请尽早联系工作室说明情况。补课安排以课程容量、教师和教室可用时间为准。' },
      { q: '兄弟姐妹报名有优惠吗？', a: '优惠和付款安排会随学期和课程计划更新。请联系工作室查询当前政策。' },
      { q: '课程有演出或考级机会吗？', a: '部分课程会提供演出、展示或进阶训练机会。具体项目会在课程计划中公布。' },
    ],
  },
  en: {
    subtitle: 'Answers to common questions about classes, registration, and studio scheduling. The studio confirms all current arrangements.',
    contact: 'Still have questions? Contact the studio and we will help you choose an appropriate class.',
    items: [
      { q: 'What age can my child start dance classes?', a: 'Suitable ages vary by program and term. Contact the studio and we will recommend a class based on your child’s age and experience.' },
      { q: 'What should my child wear to their first class?', a: 'Wear comfortable clothing that allows movement and bring clean dance shoes as required by the class. The studio will provide dress guidance after registration.' },
      { q: 'How do I choose the right level?', a: 'Teachers consider age, dance experience, and trial-class performance. New students can also contact the studio for placement guidance.' },
      { q: 'Can my child try a class first?', a: 'Trial availability depends on class capacity and the current term plan. Contact the studio to confirm an available time.' },
      { q: 'How will I know the class schedule after registering?', a: 'The public schedule shows long-term fixed classes. The studio confirms registration details and any temporary changes directly.' },
      { q: 'How are absences and make-up classes handled?', a: 'Please contact the studio as early as possible. Make-up options depend on class capacity and teacher and room availability.' },
      { q: 'Are sibling discounts available?', a: 'Discounts and payment arrangements may change by term and program. Contact the studio for the current policy.' },
      { q: 'Are there performance or advancement opportunities?', a: 'Some programs offer performances, showcases, or advanced training. Specific opportunities are announced with each program plan.' },
    ],
  },
  fr: {
    subtitle: 'Réponses aux questions fréquentes sur les cours, les inscriptions et l’horaire du studio. Le studio confirme les modalités actuelles.',
    contact: 'Vous avez d’autres questions ? Contactez le studio; nous vous aiderons à choisir un cours adapté.',
    items: [
      { q: 'À quel âge mon enfant peut-il commencer la danse ?', a: 'Les âges admissibles varient selon le programme et la session. Contactez le studio pour une recommandation adaptée à l’âge et à l’expérience de votre enfant.' },
      { q: 'Que faut-il porter au premier cours ?', a: 'Prévoyez des vêtements confortables qui permettent de bouger et des chaussures de danse propres selon le cours. Le studio donnera les consignes après l’inscription.' },
      { q: 'Comment choisir le bon niveau ?', a: 'Les enseignants tiennent compte de l’âge, de l’expérience et de l’essai. Les nouveaux élèves peuvent aussi demander conseil au studio.' },
      { q: 'Peut-on faire un essai avant de s’inscrire ?', a: 'La disponibilité des essais dépend des places et du plan de session. Contactez le studio pour confirmer un créneau.' },
      { q: 'Comment connaître l’horaire après l’inscription ?', a: 'L’horaire public affiche les cours fixes de longue durée. Le studio confirme directement les détails et les changements temporaires.' },
      { q: 'Comment sont gérées les absences et les reprises ?', a: 'Contactez le studio dès que possible. Les reprises dépendent des places, de l’enseignant et des salles disponibles.' },
      { q: 'Existe-t-il un rabais pour les frères et sœurs ?', a: 'Les rabais et modalités de paiement peuvent varier selon la session et le programme. Contactez le studio pour la politique actuelle.' },
      { q: 'Y a-t-il des spectacles ou possibilités de perfectionnement ?', a: 'Certains programmes proposent des spectacles, des présentations ou une formation avancée. Les possibilités sont annoncées dans chaque plan de cours.' },
    ],
  },
};

export default function FAQsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const copy = faqCopy[locale === 'fr' ? 'fr' : locale === 'zh' || locale === 'zh-Hant' ? 'zh' : 'en'];

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.classes'), href: '/classes' }]} />
        <h1 className="heading-xl mb-4">{t('classes.faqs')}</h1>
        <p className="text-lead mb-12">{copy.subtitle}</p>

        <Accordion type="single" collapsible className="space-y-3">
          {copy.items.map((faq, index) => (
            <AccordionItem key={faq.q} value={`faq-${index}`}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent><p className="text-sm text-muted-foreground">{faq.a}</p></AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="mb-4 text-muted-foreground">{copy.contact}</p>
          <a href="mailto:info@mulandance.com" className="font-medium text-purple-700 hover:text-purple-900 hover:underline">info@mulandance.com</a>
        </div>
      </div>
    </div>
  );
}
