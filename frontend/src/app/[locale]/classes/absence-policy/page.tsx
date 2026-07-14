'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type PolicySection = { title: string; items: string[] };
type PolicyCopy = { subtitle: string; attendance: PolicySection; makeup: PolicySection; illness: PolicySection; closures: PolicySection };

const policyCopy: Record<'zh' | 'en' | 'fr', PolicyCopy> = {
  zh: {
    subtitle: '为保障学员安全并便于课程安排，请在缺勤或需要调整时尽早联系工作室。',
    attendance: { title: '出勤说明', items: ['规律出勤有助于安全训练和持续进步。', '如无法上课，请尽早通过工作室正式联系方式告知我们。', '课程、学期和临时安排可能不同，具体处理以工作室确认信息为准。'] },
    makeup: { title: '补课安排', items: ['补课需根据课程名额、教师和教室可用时间安排。', '请提供缺勤日期和课程信息，以便工作室确认可行方案。', '补课并非自动保证，具体安排以当前课程计划为准。'] },
    illness: { title: '生病与受伤', items: ['如学员生病或有传染风险，请留在家中休息并通知工作室。', '受伤后请先遵循医疗建议；如可参加，请提前与老师沟通可调整的活动。', '工作室会在安全前提下协助安排后续课程。'] },
    closures: { title: '停课与临时调整', items: ['节假日、天气或场地原因造成的调整会由工作室直接通知。', '公开课表显示长期固定课程；临时变化以工作室通知为准。', '如需确认当天课程，请及时联系工作室。'] },
  },
  en: {
    subtitle: 'To support student safety and scheduling, contact the studio as early as possible when an absence or adjustment is needed.',
    attendance: { title: 'Attendance', items: ['Regular attendance supports safe training and steady progress.', 'If a student cannot attend, please notify the studio through its official contact details as early as possible.', 'Course, term, and temporary arrangements can differ; the studio confirms the current handling.'] },
    makeup: { title: 'Make-up arrangements', items: ['Make-up options depend on class capacity and teacher and room availability.', 'Share the absence date and class details so the studio can confirm available options.', 'A make-up class is not automatic; arrangements follow the current program plan.'] },
    illness: { title: 'Illness and injury', items: ['If a student is ill or may be contagious, please keep them home and notify the studio.', 'After an injury, follow medical advice and speak with the teacher in advance about any modified participation.', 'The studio will help plan next steps with safety as the priority.'] },
    closures: { title: 'Closures and temporary changes', items: ['The studio directly communicates changes caused by holidays, weather, or room availability.', 'The public schedule shows long-term fixed classes; temporary changes are confirmed by the studio.', 'Contact the studio promptly to confirm a same-day class.'] },
  },
  fr: {
    subtitle: 'Pour la sécurité des élèves et l’organisation des cours, contactez le studio dès que possible en cas d’absence ou de changement.',
    attendance: { title: 'Présence', items: ['Une présence régulière favorise un entraînement sécuritaire et des progrès constants.', 'Si un élève ne peut pas venir, veuillez prévenir le studio par ses coordonnées officielles dès que possible.', 'Les modalités peuvent varier selon le cours et la session; le studio confirme la situation actuelle.'] },
    makeup: { title: 'Reprises de cours', items: ['Les reprises dépendent des places, de l’enseignant et des salles disponibles.', 'Indiquez la date d’absence et les détails du cours afin que le studio puisse confirmer les options.', 'Une reprise n’est pas automatique; elle suit le plan de cours en vigueur.'] },
    illness: { title: 'Maladie et blessure', items: ['Si un élève est malade ou contagieux, gardez-le à la maison et prévenez le studio.', 'Après une blessure, suivez les conseils médicaux et parlez à l’enseignant avant toute participation adaptée.', 'Le studio aidera à planifier la suite en donnant priorité à la sécurité.'] },
    closures: { title: 'Fermetures et changements temporaires', items: ['Le studio communique directement les changements liés aux congés, à la météo ou aux salles.', 'L’horaire public montre les cours fixes de longue durée; les changements temporaires sont confirmés par le studio.', 'Contactez rapidement le studio pour confirmer un cours le jour même.'] },
  },
};

function PolicyList({ section }: { section: PolicySection }) {
  return <div className="space-y-3 text-sm text-muted-foreground">{section.items.map((item) => <p key={item}>{item}</p>)}</div>;
}

export default function AbsencePolicyPage() {
  const t = useTranslations();
  const locale = useLocale();
  const copy = policyCopy[locale === 'fr' ? 'fr' : locale === 'zh' || locale === 'zh-Hant' ? 'zh' : 'en'];

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.classes'), href: '/classes' }]} />
        <h1 className="heading-xl mb-4">{t('classes.absencePolicy')}</h1>
        <p className="text-lead mb-12">{copy.subtitle}</p>

        <Card className="mb-8"><CardContent className="pt-6"><h2 className="heading-lg mb-4">{copy.attendance.title}</h2><PolicyList section={copy.attendance} /></CardContent></Card>
        <Accordion type="single" collapsible>
          {(['makeup', 'illness', 'closures'] as const).map((key) => <AccordionItem key={key} value={key}><AccordionTrigger>{copy[key].title}</AccordionTrigger><AccordionContent><PolicyList section={copy[key]} /></AccordionContent></AccordionItem>)}
        </Accordion>
      </div>
    </div>
  );
}
