import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';

const leadership = [
  {
    nameKey: 'leadership.founder',
    roleKey: 'about.leadership.title',
    descKey: 'leadership.founderDesc',
  },
  {
    nameKey: 'leadership.artisticDir',
    roleKey: 'leadership.artisticDirRole',
    descKey: 'leadership.artisticDirDesc',
  },
  {
    nameKey: 'leadership.opsDir',
    roleKey: 'leadership.opsDirRole',
    descKey: 'leadership.opsDirDesc',
  },
  {
    nameKey: 'leadership.eduDir',
    roleKey: 'leadership.eduDirRole',
    descKey: 'leadership.eduDirDesc',
  },
];

export default function LeadershipPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.about'), href: 'about' }]} />
        <h1 className="heading-xl mb-4">{t('about.leadership.title')}</h1>
        <p className="text-lead mb-12">{t('about.leadership.artisticStaff')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {leadership.map((person) => (
            <Card key={person.nameKey}>
              <CardContent className="pt-6">
                <h3 className="heading-sm mb-1">{t(person.nameKey)}</h3>
                <p className="text-sm text-secondary font-medium mb-3">{t(person.roleKey)}</p>
                <p className="text-sm text-muted-foreground">{t(person.descKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="heading-lg mb-6">{t('about.leadership.faculty')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['Ballet', 'Contemporary', 'Chinese Dance', 'Jazz', 'Hip-Hop', 'Young Dancers'].map((dept) => (
            <Card key={dept}>
              <CardContent className="pt-6 text-center">
                <h4 className="font-semibold mb-1">{dept}</h4>
                <p className="text-sm text-muted-foreground">Dedicated instructors for every discipline</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
