'use client';

import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SystemSettings, isAuthenticated, settingsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DollarSign, Loader2, Plus, Save, Trash2 } from 'lucide-react';

type ProgramPricingItem = {
  program: string;
  monthlyCurrency: string;
  monthlyPrice: string;
  termCurrency: string;
  termPrice: string;
  hours: string;
};

type ClassroomPricingItem = {
  key: 'large' | 'small';
  hourlyCurrency: string;
  hourlyPrice: string;
  hourlyTime: string;
  halfDayCurrency: string;
  halfDayPrice: string;
  halfDayTime: string;
  fullDayCurrency: string;
  fullDayPrice: string;
  fullDayTime: string;
};

const currencyOptions = ['', '$', 'C$', 'CAD', 'USD', '￥', '¥'];

const defaultProgramPricing: ProgramPricingItem[] = [
  { program: 'Young Dancers (Ages 3-5)', monthlyCurrency: '$', monthlyPrice: '120', termCurrency: '$', termPrice: '340', hours: '45 min, 1x/week' },
  { program: 'Ballet (All Levels)', monthlyCurrency: '$', monthlyPrice: '150', termCurrency: '$', termPrice: '420', hours: '60 min, 1x/week' },
  { program: 'Contemporary', monthlyCurrency: '$', monthlyPrice: '140', termCurrency: '$', termPrice: '390', hours: '60 min, 1x/week' },
  { program: 'Chinese Dance', monthlyCurrency: '$', monthlyPrice: '140', termCurrency: '$', termPrice: '390', hours: '60 min, 1x/week' },
  { program: 'Jazz', monthlyCurrency: '$', monthlyPrice: '140', termCurrency: '$', termPrice: '390', hours: '60 min, 1x/week' },
  { program: 'Hip-Hop', monthlyCurrency: '$', monthlyPrice: '130', termCurrency: '$', termPrice: '360', hours: '60 min, 1x/week' },
  { program: 'Multi-Program Discount', monthlyCurrency: '', monthlyPrice: '10% off 2nd program', termCurrency: '', termPrice: '10% off 2nd program', hours: '' },
];

const defaultClassroomPricing: ClassroomPricingItem[] = [
  { key: 'large', hourlyCurrency: '$', hourlyPrice: '80', hourlyTime: 'hour', halfDayCurrency: '$', halfDayPrice: '280', halfDayTime: '4 hours', fullDayCurrency: '$', fullDayPrice: '520', fullDayTime: 'day' },
  { key: 'small', hourlyCurrency: '$', hourlyPrice: '45', hourlyTime: 'hour', halfDayCurrency: '$', halfDayPrice: '160', halfDayTime: '4 hours', fullDayCurrency: '$', fullDayPrice: '300', fullDayTime: 'day' },
];

function splitLegacyPrice(value: unknown) {
  const raw = String(value || '').trim();
  const currencyMatch = raw.match(/^(C\$|CA\$|CAD|USD|[$￥¥])\s*/i);
  const currency = currencyMatch?.[1] || '';
  const price = raw.replace(/^(C\$|CA\$|CAD|USD|[$￥¥])\s*/i, '');
  return { currency, price };
}

function splitLegacyPriceTime(value: unknown) {
  const raw = String(value || '').trim();
  const currencyMatch = raw.match(/^(C\$|CA\$|CAD|USD|[$￥¥])\s*/i);
  const currency = currencyMatch?.[1] || '$';
  const text = raw.replace(/^(C\$|CA\$|CAD|USD|[$￥¥])\s*/i, '');
  const [price = '', time = ''] = text.split('/').map((part) => part.trim());
  return { currency, price, time };
}

function parseProgramPricing(value: string): ProgramPricingItem[] {
  if (!value) return defaultProgramPricing;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return defaultProgramPricing;
    return parsed.map((item) => {
      const monthly = splitLegacyPrice(item.monthly);
      const term = splitLegacyPrice(item.term);
      return {
        program: String(item.program || ''),
        monthlyCurrency: String(item.monthlyCurrency ?? monthly.currency),
        monthlyPrice: String(item.monthlyPrice ?? monthly.price),
        termCurrency: String(item.termCurrency ?? term.currency),
        termPrice: String(item.termPrice ?? term.price),
        hours: String(item.hours || ''),
      };
    });
  } catch {
    return defaultProgramPricing;
  }
}

function parseClassroomPricing(value: string): ClassroomPricingItem[] {
  if (!value) return defaultClassroomPricing;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return defaultClassroomPricing;
    return parsed.map((item) => {
      const hourly = splitLegacyPriceTime(item.hourly);
      const halfDay = splitLegacyPriceTime(item.halfDay);
      const fullDay = splitLegacyPriceTime(item.fullDay);
      return {
        key: item.key === 'small' ? 'small' : 'large',
        hourlyCurrency: String(item.hourlyCurrency ?? hourly.currency),
        hourlyPrice: String(item.hourlyPrice ?? hourly.price),
        hourlyTime: String(item.hourlyTime ?? hourly.time),
        halfDayCurrency: String(item.halfDayCurrency ?? halfDay.currency),
        halfDayPrice: String(item.halfDayPrice ?? halfDay.price),
        halfDayTime: String(item.halfDayTime ?? halfDay.time),
        fullDayCurrency: String(item.fullDayCurrency ?? fullDay.currency),
        fullDayPrice: String(item.fullDayPrice ?? fullDay.price),
        fullDayTime: String(item.fullDayTime ?? fullDay.time),
      };
    });
  } catch {
    return defaultClassroomPricing;
  }
}

function CurrencyPriceInput({
  currency,
  price,
  onCurrencyChange,
  onPriceChange,
}: {
  currency: string;
  price: string;
  onCurrencyChange: (value: string) => void;
  onPriceChange: (value: string) => void;
}) {
  const isTextMode = currency === '';

  return (
    <div className="flex h-10 overflow-hidden rounded-md border border-input bg-background">
      <select
        className={cn(
          'border-r bg-muted px-2 text-sm text-muted-foreground outline-none',
          isTextMode ? 'w-16' : 'w-12'
        )}
        value={currency}
        onChange={(event) => onCurrencyChange(event.target.value)}
      >
        {currencyOptions.map((option) => (
          <option key={option || 'text'} value={option}>
            {option || 'Text'}
          </option>
        ))}
      </select>
      <input
        className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
        value={price}
        onChange={(event) => onPriceChange(event.target.value)}
      />
    </div>
  );
}

export default function AdminPricingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [programPricing, setProgramPricing] = useState<ProgramPricingItem[]>(defaultProgramPricing);
  const [classroomPricing, setClassroomPricing] = useState<ClassroomPricingItem[]>(defaultClassroomPricing);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    settingsApi
      .site()
      .then((data) => {
        setSettings(data);
        setProgramPricing(parseProgramPricing(data.program_pricing_json));
        setClassroomPricing(parseClassroomPricing(data.classroom_pricing_json));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load pricing settings'))
      .finally(() => setLoading(false));
  }, [locale, router]);

  function updateProgramRow(index: number, field: keyof ProgramPricingItem, value: string) {
    setProgramPricing((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  }

  function updateClassroomRow(index: number, field: keyof ClassroomPricingItem, value: string) {
    setClassroomPricing((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  }

  async function savePricing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;

    if (programPricing.some((item) => !item.program.trim())) {
      setError('Every program pricing row needs a program name.');
      setMessage('');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const cleanedProgramPricing = programPricing.map((item) => ({
        program: item.program.trim(),
        monthlyCurrency: item.monthlyCurrency.trim(),
        monthlyPrice: item.monthlyPrice.trim(),
        termCurrency: item.termCurrency.trim(),
        termPrice: item.termPrice.trim(),
        hours: item.hours.trim(),
      }));
      const cleanedClassroomPricing = classroomPricing.map((item) => ({
        key: item.key,
        hourlyCurrency: item.hourlyCurrency.trim(),
        hourlyPrice: item.hourlyPrice.trim(),
        hourlyTime: item.hourlyTime.trim(),
        halfDayCurrency: item.halfDayCurrency.trim(),
        halfDayPrice: item.halfDayPrice.trim(),
        halfDayTime: item.halfDayTime.trim(),
        fullDayCurrency: item.fullDayCurrency.trim(),
        fullDayPrice: item.fullDayPrice.trim(),
        fullDayTime: item.fullDayTime.trim(),
      }));

      const saved = await settingsApi.updateSite({
        ...settings,
        program_pricing_json: JSON.stringify(cleanedProgramPricing, null, 2),
        classroom_pricing_json: JSON.stringify(cleanedClassroomPricing, null, 2),
      });
      setSettings(saved);
      setProgramPricing(parseProgramPricing(saved.program_pricing_json));
      setClassroomPricing(parseClassroomPricing(saved.classroom_pricing_json));
      setMessage('Pricing settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <form onSubmit={savePricing} className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <DollarSign className="h-6 w-6 text-primary" />
                Pricing
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Control the content shown on the public program pricing and rental pricing pages.
              </p>
            </div>
            <Button type="submit" disabled={loading || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Pricing
            </Button>
          </div>

          {(error || message) && (
            <div className={cn('rounded-md border px-3 py-2 text-sm', error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
              {error || message}
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading pricing settings...
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Program Pricing</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Controls /programs/pricing.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProgramPricing((current) => [...current, { program: '', monthlyCurrency: '$', monthlyPrice: '', termCurrency: '$', termPrice: '', hours: '' }])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Program
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-[920px] rounded-md border">
                      <div className="grid grid-cols-[2fr_1fr_1fr_1.15fr_44px] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                        <div>Program</div>
                        <div>Monthly</div>
                        <div>Term</div>
                        <div>Duration</div>
                        <div />
                      </div>
                      {programPricing.map((item, index) => (
                        <div key={`${item.program}-${index}`} className="grid grid-cols-[2fr_1fr_1fr_1.15fr_44px] gap-2 border-b px-3 py-2 last:border-b-0">
                          <Input value={item.program} onChange={(event) => updateProgramRow(index, 'program', event.target.value)} />
                          <CurrencyPriceInput
                            currency={item.monthlyCurrency}
                            price={item.monthlyPrice}
                            onCurrencyChange={(value) => updateProgramRow(index, 'monthlyCurrency', value)}
                            onPriceChange={(value) => updateProgramRow(index, 'monthlyPrice', value)}
                          />
                          <CurrencyPriceInput
                            currency={item.termCurrency}
                            price={item.termPrice}
                            onCurrencyChange={(value) => updateProgramRow(index, 'termCurrency', value)}
                            onPriceChange={(value) => updateProgramRow(index, 'termPrice', value)}
                          />
                          <Input value={item.hours} onChange={(event) => updateProgramRow(index, 'hours', event.target.value)} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setProgramPricing((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                            aria-label="Remove program pricing row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Rental Pricing</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Controls /classrooms/pricing.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setClassroomPricing((current) => [...current, { key: 'large', hourlyCurrency: '$', hourlyPrice: '', hourlyTime: '', halfDayCurrency: '$', halfDayPrice: '', halfDayTime: '', fullDayCurrency: '$', fullDayPrice: '', fullDayTime: '' }])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rental
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-[1040px] rounded-md border">
                      <div className="grid grid-cols-[0.95fr_1fr_0.8fr_1fr_0.8fr_1fr_0.8fr_44px] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                        <div>Room</div>
                        <div>Hourly Price</div>
                        <div>Hourly Time</div>
                        <div>Half Day Price</div>
                        <div>Half Day Time</div>
                        <div>Full Day Price</div>
                        <div>Full Day Time</div>
                        <div />
                      </div>
                      {classroomPricing.map((item, index) => (
                        <div key={`${item.key}-${index}`} className="grid grid-cols-[0.95fr_1fr_0.8fr_1fr_0.8fr_1fr_0.8fr_44px] gap-2 border-b px-3 py-2 last:border-b-0">
                          <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={item.key}
                            onChange={(event) => updateClassroomRow(index, 'key', event.target.value as ClassroomPricingItem['key'])}
                          >
                            <option value="large">Large Room</option>
                            <option value="small">Small Room</option>
                          </select>
                          <CurrencyPriceInput
                            currency={item.hourlyCurrency}
                            price={item.hourlyPrice}
                            onCurrencyChange={(value) => updateClassroomRow(index, 'hourlyCurrency', value)}
                            onPriceChange={(value) => updateClassroomRow(index, 'hourlyPrice', value)}
                          />
                          <Input value={item.hourlyTime} onChange={(event) => updateClassroomRow(index, 'hourlyTime', event.target.value)} />
                          <CurrencyPriceInput
                            currency={item.halfDayCurrency}
                            price={item.halfDayPrice}
                            onCurrencyChange={(value) => updateClassroomRow(index, 'halfDayCurrency', value)}
                            onPriceChange={(value) => updateClassroomRow(index, 'halfDayPrice', value)}
                          />
                          <Input value={item.halfDayTime} onChange={(event) => updateClassroomRow(index, 'halfDayTime', event.target.value)} />
                          <CurrencyPriceInput
                            currency={item.fullDayCurrency}
                            price={item.fullDayPrice}
                            onCurrencyChange={(value) => updateClassroomRow(index, 'fullDayCurrency', value)}
                            onPriceChange={(value) => updateClassroomRow(index, 'fullDayPrice', value)}
                          />
                          <Input value={item.fullDayTime} onChange={(event) => updateClassroomRow(index, 'fullDayTime', event.target.value)} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setClassroomPricing((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                            aria-label="Remove rental pricing row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
