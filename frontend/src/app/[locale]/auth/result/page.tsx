import Link from 'next/link';
import { AlertTriangle, Clock3, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const content = {
  zh: {
    pending_binding: ['等待身份确认', '您的登录身份已提交给超级管理员确认。确认后请重新登录。'],
    pending_activation: ['等待账号启用', '身份已匹配，但账号尚未启用。请联系学校管理员。'],
    not_provisioned: ['账号尚未建立', '此邮箱尚未关联学校账号，请联系学校管理员。'],
    rejected: ['无法登录', '此身份绑定未获批准，请联系学校管理员。'],
    error: ['登录处理失败', '系统暂时无法完成身份确认，请稍后重试。'],
    retry: '重新登录', home: '返回首页',
  },
  en: {
    pending_binding: ['Waiting for identity approval', 'Your identity was sent to the super administrator. Sign in again after approval.'],
    pending_activation: ['Waiting for account activation', 'Your identity matches, but the local account is not active yet. Contact the school administrator.'],
    not_provisioned: ['Account not provisioned', 'This email is not connected to a school account. Contact the school administrator.'],
    rejected: ['Sign-in unavailable', 'This identity binding was not approved. Contact the school administrator.'],
    error: ['Sign-in could not be completed', 'The system could not finish identity verification. Please try again.'],
    retry: 'Sign in again', home: 'Return home',
  },
  fr: {
    pending_binding: ["En attente d'approbation", "Votre identité a été envoyée au super administrateur. Reconnectez-vous après l'approbation."],
    pending_activation: ["En attente d'activation", "Votre identité correspond, mais le compte local n'est pas encore actif. Contactez l'administration."],
    not_provisioned: ['Compte non configuré', "Cette adresse courriel n'est liée à aucun compte de l'école. Contactez l'administration."],
    rejected: ['Connexion indisponible', "Cette association d'identité n'a pas été approuvée. Contactez l'administration."],
    error: ['Connexion incomplète', "Le système n'a pas pu terminer la vérification. Veuillez réessayer."],
    retry: 'Se reconnecter', home: "Retour à l'accueil",
  },
} as const;

export default function AuthResult({ params, searchParams }: { params: { locale: string }; searchParams: { status?: string } }) {
  const locale = params.locale === 'fr' ? 'fr' : params.locale.startsWith('zh') ? 'zh' : 'en';
  const copy = content[locale];
  const status = (searchParams.status || 'error') as keyof Pick<typeof copy, 'pending_binding' | 'pending_activation' | 'not_provisioned' | 'rejected' | 'error'>;
  const message = copy[status] || copy.error;
  const Icon = status === 'pending_binding' || status === 'pending_activation' ? Clock3 : status === 'error' ? AlertTriangle : ShieldCheck;
  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center"><Icon className="mx-auto mb-3 h-9 w-9 text-primary" /><CardTitle>{message[0]}</CardTitle></CardHeader>
        <CardContent className="space-y-5 text-center"><p className="text-muted-foreground">{message[1]}</p><div className="flex justify-center gap-3"><Button asChild><Link href={`/auth/sign-in?returnTo=${encodeURIComponent(`/${params.locale}/admin`)}`}>{copy.retry}</Link></Button><Button asChild variant="outline"><Link href={`/${params.locale}`}>{copy.home}</Link></Button></div></CardContent>
      </Card>
    </main>
  );
}
