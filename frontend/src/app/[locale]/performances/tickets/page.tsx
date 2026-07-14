'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type TicketCopy = {
  subtitle: string;
  action: string;
  information: string;
  ticketType: string;
  quantity: string;
  notes: string[];
  options: Array<{ name: string; price: string; desc: string }>;
};

const ticketCopy: Record<'zh' | 'en' | 'fr', TicketCopy> = {
  zh: {
    subtitle: '门票价格和可订场次会随每场演出公布。请联系工作室查询当前活动。',
    action: '咨询门票',
    information: '票务说明',
    ticketType: '票种',
    quantity: '数量',
    notes: ['当前价格和可订场次请以工作室确认信息为准。', '请在邮件中注明活动名称、票种和所需数量。', '如需无障碍座位或团体安排，请提前联系我们。'],
    options: [
      { name: '成人', price: '$45', desc: '18 岁及以上普通票' },
      { name: '长者', price: '$35', desc: '65 岁及以上' },
      { name: '学生', price: '$25', desc: '需提供有效学生证' },
      { name: '儿童', price: '$15', desc: '5 至 17 岁' },
      { name: '家庭套票', price: '$120', desc: '2 位成人和 2 位儿童' },
      { name: '团体（10 人以上）', price: '$30', desc: '每人价格' },
    ],
  },
  en: {
    subtitle: 'Ticket prices and availability are announced for each performance. Contact the studio about the current event.',
    action: 'Ask about tickets',
    information: 'Ticket information',
    ticketType: 'Ticket type',
    quantity: 'Quantity',
    notes: ['Current prices and availability are confirmed by the studio.', 'Include the event name, ticket type, and quantity in your email.', 'Contact us in advance for accessible seating or group arrangements.'],
    options: [
      { name: 'Adult', price: '$45', desc: 'General admission for adults 18+' },
      { name: 'Senior', price: '$35', desc: 'Ages 65 and older' },
      { name: 'Student', price: '$25', desc: 'Valid student ID required' },
      { name: 'Child', price: '$15', desc: 'Ages 5-17' },
      { name: 'Family pack', price: '$120', desc: '2 adults and 2 children' },
      { name: 'Group (10+)', price: '$30', desc: 'Price per person' },
    ],
  },
  fr: {
    subtitle: 'Les tarifs et les disponibilités sont annoncés pour chaque spectacle. Contactez le studio pour l’événement actuel.',
    action: 'Demander des billets',
    information: 'Informations sur les billets',
    ticketType: 'Type de billet',
    quantity: 'Quantité',
    notes: ['Les tarifs et disponibilités actuels sont confirmés par le studio.', 'Indiquez le nom de l’événement, le type de billet et la quantité dans votre e-mail.', 'Contactez-nous à l’avance pour les sièges accessibles ou les groupes.'],
    options: [
      { name: 'Adulte', price: '$45', desc: 'Admission générale, 18 ans et plus' },
      { name: 'Aîné', price: '$35', desc: '65 ans et plus' },
      { name: 'Étudiant', price: '$25', desc: 'Carte étudiante valide requise' },
      { name: 'Enfant', price: '$15', desc: '5 à 17 ans' },
      { name: 'Forfait familial', price: '$120', desc: '2 adultes et 2 enfants' },
      { name: 'Groupe (10+)', price: '$30', desc: 'Prix par personne' },
    ],
  },
};

export default function TicketsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const copy = ticketCopy[locale === 'fr' ? 'fr' : locale === 'zh' || locale === 'zh-Hant' ? 'zh' : 'en'];

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.performances'), href: '/performances' }]} />
        <h1 className="heading-xl mb-4">{t('performances.tickets')}</h1>
        <p className="text-lead mb-12">{copy.subtitle}</p>

        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {copy.options.map((option) => {
            const subject = encodeURIComponent(`${copy.action}: ${option.name}`);
            const body = encodeURIComponent(`${copy.action}\n\n${copy.ticketType}: ${option.name}\n${copy.quantity}: `);
            return (
              <Card key={option.name}>
                <CardContent className="pt-6 text-center">
                  <h3 className="heading-sm mb-2">{option.name}</h3>
                  <p className="mb-2 text-3xl font-bold text-primary">{option.price}</p>
                  <p className="mb-4 text-sm text-muted-foreground">{option.desc}</p>
                  <a href={`mailto:info@mulandance.com?subject=${subject}&body=${body}`}>
                    <Button size="sm" className="w-full">{copy.action}</Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">{copy.information}</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              {copy.notes.map((note) => <p key={note}>{note}</p>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
