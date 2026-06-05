'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Plus, Sparkles, X } from 'lucide-react';
import {
  aiApi,
  type AiArticleImportJobEntry,
  type AiArticleImportJobStatusResponse,
  type NewsCategory,
  type NewsTag,
} from '@/lib/api';
import { ARTICLE_IMPORT_LOCALES } from '@/lib/ai-article-import';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface AiBulkArticleImportDialogProps {
  locale?: string;
  categories: NewsCategory[];
  tags: NewsTag[];
  onImported?: () => void;
}

type StoredImportJob = {
  job_id: string;
  created_at: string;
  status?: AiArticleImportJobStatusResponse;
};

const STORAGE_KEY = 'mulan_article_import_jobs';
const RUNNING_STATUSES = new Set(['pending', 'running']);

const bulkImportText = {
  zh: {
    queue: 'AI \u961f\u5217',
    importLinks: '\u6279\u91cf\u5bfc\u5165\u94fe\u63a5',
    addTitle: '\u591a\u4e2a\u94fe\u63a5\uff0c\u4e00\u4e2a\u94fe\u63a5\u751f\u6210\u4e00\u7bc7\u65b0\u95fb',
    appendTitle: '\u8ffd\u52a0\u94fe\u63a5\u5230\u6b63\u5728\u8fd0\u884c\u7684\u4efb\u52a1',
    description: '\u70b9\u51fb\u6dfb\u52a0\u4efb\u52a1\u540e\u5f39\u7a97\u4f1a\u5173\u95ed\uff0c\u4efb\u52a1\u7ee7\u7eed\u5728\u540e\u53f0\u8fd0\u884c\uff1b\u5237\u65b0\u9875\u9762\u540e\u53ef\u4ee5\u5728\u53f3\u4e0a\u89d2 AI \u961f\u5217\u91cc\u7ee7\u7eed\u67e5\u770b\u3002',
    links: '\u94fe\u63a5',
    linksPlaceholder: '\u4e00\u884c\u4e00\u4e2a\u94fe\u63a5\nhttps://...\nhttps://...',
    detected: (count: number) => `\u5f53\u524d\u8bc6\u522b\u5230 ${count} \u4e2a\u94fe\u63a5\u3002`,
    manualText: '\u8865\u5145\u6587\u5b57\uff0c\u53ef\u9009',
    manualPlaceholder: '\u53ef\u4ee5\u7c98\u8d34\u4e3b\u529e\u65b9\u8bf4\u660e\u3001\u56fe\u7247\u8bf4\u660e\u3001\u65f6\u95f4\u5730\u70b9\u8865\u5145...',
    instruction: '\u989d\u5916\u8981\u6c42\uff0c\u53ef\u9009',
    instructionPlaceholder: '\u6bd4\u5982\uff1a\u66f4\u6b63\u5f0f\u4e00\u70b9\u3001\u7a81\u51fa\u83b7\u5956\u4fe1\u606f\u3001\u6807\u9898\u77ed\u4e00\u4e9b...',
    close: '\u5173\u95ed',
    append: '\u8ffd\u52a0\u5230\u961f\u5217',
    addTask: '\u6dfb\u52a0\u4efb\u52a1',
    noLinks: '\u8bf7\u5148\u8f93\u5165\u94fe\u63a5\uff0c\u652f\u6301\u4e00\u884c\u4e00\u4e2a\u3002',
    readFailed: '\u4efb\u52a1\u72b6\u6001\u8bfb\u53d6\u5931\u8d25',
    importFailed: 'AI \u6279\u91cf\u5bfc\u5165\u5931\u8d25',
    noRunningTask: '\u73b0\u5728\u6ca1\u6709\u6b63\u5728\u8fd0\u884c\u7684\u4efb\u52a1\u53ef\u4ee5\u8ffd\u52a0\u3002',
    appendNoLinks: '\u8bf7\u5148\u8f93\u5165\u8981\u8ffd\u52a0\u7684\u94fe\u63a5\u3002',
    appendFailed: '\u8ffd\u52a0\u94fe\u63a5\u5931\u8d25',
    queueTitle: 'AI \u751f\u6210\u961f\u5217',
    running: '\u8fd0\u884c',
    completed: '\u5b8c\u6210',
    failed: '\u5931\u8d25',
    duplicate: '\u91cd\u590d',
    invalid: '\u65e0\u6548',
    imported: '\u5df2\u5bfc\u5165',
    generated: '\u5df2\u751f\u6210',
    noTasks: '\u6682\u65e0\u4efb\u52a1',
    saved: '\u5df2\u4fdd\u5b58',
    current: '\u5f53\u524d',
    defaultInstruction: '\u6bcf\u4e2a\u94fe\u63a5\u751f\u6210\u4e00\u7bc7\u72ec\u7acb\u65b0\u95fb\u8349\u7a3f\uff0c\u4e0d\u8981\u628a\u591a\u4e2a\u94fe\u63a5\u5408\u5e76\u6210\u4e00\u7bc7\u3002\u4fdd\u7559\u5173\u952e\u4fe1\u606f\u3001\u65e5\u671f\u3001\u4eba\u7269\u3001\u5730\u70b9\u548c\u6765\u6e90\u8bed\u6c14\u3002',
  },
  en: {
    queue: 'AI Queue',
    importLinks: 'Bulk Import Links',
    addTitle: 'Multiple links, one article per link',
    appendTitle: 'Append links to a running task',
    description: 'After you add the task, this dialog closes and generation continues in the background. Refresh the page and use the AI Queue at the top right to keep watching it.',
    links: 'Links',
    linksPlaceholder: 'One link per line\nhttps://...\nhttps://...',
    detected: (count: number) => `${count} links detected.`,
    manualText: 'Optional supporting text',
    manualPlaceholder: 'Paste organizer notes, image captions, time, venue, or context...',
    instruction: 'Optional instruction',
    instructionPlaceholder: 'For example: more formal tone, highlight awards, shorter titles...',
    close: 'Close',
    append: 'Append to queue',
    addTask: 'Add task',
    noLinks: 'Please enter links first, one per line.',
    readFailed: 'Failed to read task status',
    importFailed: 'AI bulk import failed',
    noRunningTask: 'There is no running task to append to.',
    appendNoLinks: 'Please enter links to append.',
    appendFailed: 'Failed to append links',
    queueTitle: 'AI Generation Queue',
    running: 'Running',
    completed: 'Done',
    failed: 'Failed',
    duplicate: 'Duplicate',
    invalid: 'Invalid',
    imported: 'Imported',
    generated: 'Generated',
    noTasks: 'No tasks',
    saved: 'Saved',
    current: 'Current',
    defaultInstruction: 'Generate one independent news draft for each link. Do not merge multiple links into one article. Preserve key facts, dates, people, locations, and the source tone.',
  },
  fr: {
    queue: 'File IA',
    importLinks: 'Importer des liens',
    addTitle: 'Plusieurs liens, un article par lien',
    appendTitle: 'Ajouter des liens a une tache en cours',
    description: 'Apres l ajout, la fenetre se ferme et la generation continue en arriere-plan. Apres actualisation, suivez la tache avec la file IA en haut a droite.',
    links: 'Liens',
    linksPlaceholder: 'Un lien par ligne\nhttps://...\nhttps://...',
    detected: (count: number) => `${count} liens detectes.`,
    manualText: 'Texte complementaire facultatif',
    manualPlaceholder: 'Collez des notes, legendes d images, horaires, lieu ou contexte...',
    instruction: 'Consigne facultative',
    instructionPlaceholder: 'Ex. ton plus formel, mettre les prix en avant, titres plus courts...',
    close: 'Fermer',
    append: 'Ajouter a la file',
    addTask: 'Ajouter la tache',
    noLinks: 'Veuillez saisir des liens, un par ligne.',
    readFailed: 'Impossible de lire le statut de la tache',
    importFailed: 'Echec de l import IA',
    noRunningTask: 'Aucune tache en cours ne peut recevoir de liens.',
    appendNoLinks: 'Veuillez saisir les liens a ajouter.',
    appendFailed: 'Impossible d ajouter les liens',
    queueTitle: 'File de generation IA',
    running: 'En cours',
    completed: 'Terminees',
    failed: 'Echecs',
    duplicate: 'Doublon',
    invalid: 'Invalide',
    imported: 'Importe',
    generated: 'Genere',
    noTasks: 'Aucune tache',
    saved: 'Enregistres',
    current: 'Actuel',
    defaultInstruction: 'Genere un brouillon d actualite independant pour chaque lien. Ne fusionne pas plusieurs liens en un seul article. Conserve les faits cles, dates, personnes, lieux et le ton de la source.',
  },
} as const;

function adminLocale(locale?: string) {
  if (locale === 'fr') return 'fr';
  if (locale === 'zh' || locale === 'zh-Hant') return 'zh';
  return 'en';
}

function parseUrls(value: string) {
  return value
    .split(/[\r\n,，]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRunning(status?: AiArticleImportJobStatusResponse | null) {
  return Boolean(status && RUNNING_STATUSES.has(status.status));
}

function readStoredJobs(): StoredImportJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item?.job_id) : [];
  } catch {
    return [];
  }
}

function writeStoredJobs(jobs: StoredImportJob[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, 20)));
}

function jobProgress(status?: AiArticleImportJobStatusResponse) {
  if (!status) return 0;
  const total = status.total || 0;
  if (total <= 0) return 0;
  const finished = (status.completed || 0) + (status.failed || 0);
  return Math.min(100, Math.round((finished / total) * 100));
}

function entryBadge(entry: AiArticleImportJobEntry | undefined, text: (typeof bulkImportText)[keyof typeof bulkImportText]) {
  switch (entry?.status) {
    case 'saved':
      return { label: text.imported, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    case 'generated':
      return { label: text.generated, className: 'border-blue-200 bg-blue-50 text-blue-700' };
    case 'duplicate':
      return { label: text.duplicate, className: 'border-amber-200 bg-amber-50 text-amber-700' };
    case 'invalid':
      return { label: text.invalid, className: 'border-orange-200 bg-orange-50 text-orange-700' };
    case 'failed':
      return { label: text.failed, className: 'border-red-200 bg-red-50 text-red-700' };
    default:
      return { label: text.running, className: 'border-slate-200 bg-slate-100 text-slate-700' };
  }
}

export function AiBulkArticleImportDialog({ locale, categories, tags, onImported }: AiBulkArticleImportDialogProps) {
  const text = bulkImportText[adminLocale(locale)];
  const [open, setOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [urlsText, setUrlsText] = useState('');
  const [manualText, setManualText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [jobs, setJobs] = useState<StoredImportJob[]>([]);
  const [targetJobId, setTargetJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [appending, setAppending] = useState(false);
  const [message, setMessage] = useState('');
  const pollRef = useRef<number | null>(null);

  const urls = useMemo(() => parseUrls(urlsText), [urlsText]);
  const runningJobs = jobs.filter((job) => isRunning(job.status));
  const failedJobs = jobs.filter((job) => job.status?.status === 'failed');
  const doneJobs = jobs.filter((job) => job.status?.status === 'succeeded');
  const activeJob = runningJobs[0] || jobs[0];
  const appendTarget = jobs.find((job) => job.job_id === targetJobId) || runningJobs[0];
  const canAppend = Boolean(appendTarget && isRunning(appendTarget.status));

  function setAndStoreJobs(updater: (current: StoredImportJob[]) => StoredImportJob[]) {
    setJobs((current) => {
      const next = updater(current);
      writeStoredJobs(next);
      return next;
    });
  }

  async function refreshOne(job: StoredImportJob) {
    try {
      const status = await aiApi.getArticleUrlImportJob(job.job_id);
      return { ...job, status };
    } catch (err) {
      return {
        ...job,
        status: {
          job_id: job.job_id,
          status: 'failed' as const,
          error: err instanceof Error ? err.message : text.readFailed,
        },
      };
    }
  }

  async function refreshJobs() {
    const current = readStoredJobs();
    if (current.length === 0) {
      setJobs([]);
      return;
    }

    const refreshed = await Promise.all(current.map(refreshOne));
    setAndStoreJobs(() => refreshed);

    const completedNow = refreshed.some((job) => job.status?.status === 'succeeded' && (job.status.saved || 0) > 0);
    if (completedNow) onImported?.();
  }

  useEffect(() => {
    const stored = readStoredJobs();
    setJobs(stored);
    if (stored.length > 0) void refreshJobs();

    pollRef.current = window.setInterval(() => {
      const storedJobs = readStoredJobs();
      if (storedJobs.some((job) => !job.status || isRunning(job.status))) {
        void refreshJobs();
      }
    }, 3000);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startJob() {
    if (urls.length === 0 && !manualText.trim()) {
      setMessage(text.noLinks);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const job = await aiApi.startArticleUrlImportJob({
        urls,
        source_locale: 'zh',
        target_locales: [...ARTICLE_IMPORT_LOCALES],
        manual_text: manualText.trim() || undefined,
        extra_instruction:
          instruction.trim() ||
          text.defaultInstruction,
        available_category_slugs: categories.map((category) => category.slug),
        available_tag_slugs: tags.map((tag) => tag.slug),
        auto_save_to_drafts: true,
      });

      const storedJob: StoredImportJob = {
        job_id: job.job_id,
        created_at: new Date().toISOString(),
        status: { job_id: job.job_id, status: job.status, total: urls.length || 1, completed: 0, failed: 0, saved: 0 },
      };
      setAndStoreJobs((current) => [storedJob, ...current.filter((item) => item.job_id !== job.job_id)]);
      setUrlsText('');
      setManualText('');
      setInstruction('');
      setOpen(false);
      setPanelOpen(true);
      void refreshJobs();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text.importFailed);
    } finally {
      setLoading(false);
    }
  }

  async function appendUrls() {
    if (!appendTarget || !canAppend) {
      setMessage(text.noRunningTask);
      return;
    }
    if (urls.length === 0) {
      setMessage(text.appendNoLinks);
      return;
    }

    setAppending(true);
    setMessage('');
    try {
      const status = await aiApi.appendArticleUrlImportJob(appendTarget.job_id, urls);
      setAndStoreJobs((current) =>
        current.map((job) => (job.job_id === appendTarget.job_id ? { ...job, status } : job))
      );
      setUrlsText('');
      setOpen(false);
      setPanelOpen(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text.appendFailed);
    } finally {
      setAppending(false);
    }
  }

  function removeJob(jobId: string) {
    setAndStoreJobs((current) => current.filter((job) => job.job_id !== jobId));
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setPanelOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:h-10 sm:px-3"
      >
        {runningJobs.length > 0 ? (
          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
        ) : failedJobs.length > 0 ? (
          <AlertCircle className="h-4 w-4 text-amber-600" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        )}
        <span>{text.queue}</span>
        <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[11px] text-purple-700">{runningJobs.length}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm">
            <Sparkles className="mr-1.5 h-4 w-4 sm:mr-2" />
            {text.importLinks}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{canAppend ? text.appendTitle : text.addTitle}</DialogTitle>
            <DialogDescription>
              {text.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {canAppend && (
              <select
                value={targetJobId || appendTarget?.job_id || ''}
                onChange={(event) => setTargetJobId(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {runningJobs.map((job) => (
                  <option key={job.job_id} value={job.job_id}>
                    {job.job_id.slice(0, 8)} - {job.status?.completed || 0}/{job.status?.total || 0}
                  </option>
                ))}
              </select>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">{text.links}</label>
              <Textarea
                value={urlsText}
                onChange={(event) => setUrlsText(event.target.value)}
                placeholder={text.linksPlaceholder}
                className="min-h-[170px] resize-y bg-white text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">{text.detected(urls.length)}</p>
            </div>

            {!canAppend && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">{text.manualText}</label>
                  <Textarea
                    value={manualText}
                    onChange={(event) => setManualText(event.target.value)}
                    placeholder={text.manualPlaceholder}
                    className="min-h-[90px] resize-y bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">{text.instruction}</label>
                  <Textarea
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    placeholder={text.instructionPlaceholder}
                    className="min-h-[74px] resize-y bg-white text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {message && <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {text.close}
            </Button>
            {canAppend ? (
              <Button type="button" onClick={appendUrls} disabled={appending || urls.length === 0}>
                {appending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {text.append}
              </Button>
            ) : (
              <Button type="button" onClick={startJob} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {text.addTask}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {panelOpen && (
        <div className="absolute right-0 top-11 z-30 w-[min(92vw,380px)] rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-950">{text.queueTitle}</p>
              <p className="text-xs text-slate-500">
                {text.running} {runningJobs.length} / {text.completed} {doneJobs.length} / {text.failed} {failedJobs.length}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPanelOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {jobs.length === 0 ? (
            <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
              {text.noTasks}
            </div>
          ) : (
            <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {jobs.map((job) => {
                const status = job.status;
                const progress = jobProgress(status);
                return (
                  <div key={job.job_id} className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                          {isRunning(status) && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />}
                          {status?.status === 'succeeded' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                          {status?.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
                          <span>{status?.status || 'pending'}</span>
                          <span className="text-slate-400">{job.job_id.slice(0, 8)}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-purple-600 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {(status?.completed || 0) + (status?.failed || 0)}/{status?.total || 0}
                          <span className="ml-2">{text.saved} {status?.saved || 0}</span>
                          {!!status?.failed && <span className="ml-2 text-amber-700">{text.failed} {status.failed}</span>}
                        </p>
                        {status?.current_url && <p className="mt-1 truncate text-xs text-slate-400">{status.current_url}</p>}
                        {status?.error && <p className="mt-1 line-clamp-2 text-xs text-amber-700">{status.error}</p>}
                        {status?.entries && status.entries.length > 0 && (
                          <div className="mt-2 space-y-1.5 rounded-md border border-white bg-white/80 p-2">
                            {status.entries.slice(-6).reverse().map((entry, index) => {
                              const badge = entryBadge(entry, text);
                              return (
                                <div key={`${entry.url}-${index}`} className="rounded-md border border-slate-100 bg-white px-2 py-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                                      {badge.label}
                                    </span>
                                    {entry.saved_slug ? (
                                      <span className="truncate text-[10px] text-slate-400">{entry.saved_slug}</span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 truncate text-[11px] text-slate-700">{entry.url}</p>
                                  {entry.message ? <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{entry.message}</p> : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {!isRunning(status) && (
                        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 shrink-0 p-0" onClick={() => removeJob(job.job_id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeJob?.status?.current_url && (
            <p className="mt-2 truncate text-xs text-slate-400">{text.current}: {activeJob.status.current_url}</p>
          )}
        </div>
      )}
    </div>
  );
}
