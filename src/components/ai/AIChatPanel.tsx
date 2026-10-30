'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { messages } from '@/i18n';
import { readAiStream } from '@/lib/ai/read-stream';
import { aiStages, type AiStage, type AiTerminalEvent } from '@/lib/ai/stream-contract';
import { aiTheme } from './theme';
import styles from './AIChatPanel.module.css';
import { AIQuotaCountdown } from './AIQuotaCountdown';

type SearchRequest = { message: string; referenceMovieId?: number };
const copy = messages.ai;
const focus = 'focus-visible:ring-2';

export function AIChatPanel({ enabled, regionUnavailable = false }: { enabled: boolean; regionUnavailable?: boolean }) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [stage, setStage] = useState<AiStage>();
  const [terminal, setTerminal] = useState<AiTerminalEvent>();
  const [retryAt, setRetryAt] = useState<number>();
  const active = useRef<AbortController | null>(null);
  const activeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [lastRequest, setLastRequest] = useState<SearchRequest>();
  useEffect(() => () => { active.current?.abort(); active.current = null; clearTimeout(activeTimer.current); }, []);
  useEffect(() => {
    if (retryAt === undefined) return;
    const expire = () => { if (Date.now() >= retryAt) setRetryAt(undefined); };
    const timer = setTimeout(expire, Math.max(0, retryAt - Date.now()));
    document.addEventListener('visibilitychange', expire);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', expire); };
  }, [retryAt]);

  async function search(input: SearchRequest) {
    if (!enabled || active.current || retryAt !== undefined) return;
    if (!input.message.trim() || input.message.length > 1000) {
      setTerminal({ type: 'error', code: 'invalid_request' });
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setLastRequest(input);
    setPending(true); setTerminal(undefined); setStage(undefined);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true; controller.abort();
      if (active.current === controller) {
        active.current = null; setPending(false); setTerminal({ type: 'error', code: 'timeout' });
      }
    }, 35000);
    activeTimer.current = timer;
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify(input), signal: controller.signal, cache: 'no-store', redirect: 'error',
      });
      const result = await readAiStream(response, next => { if (active.current === controller) setStage(next); }, controller.signal);
      if (active.current === controller) {
        if (result.type === 'error' && result.code === 'rate_limited') {
          const header = response.headers.get('retry-after') ?? '';
          const seconds = /^\d{1,5}$/.test(header) ? Number(header) : 0;
          setRetryAt(Date.now() + (seconds >= 1 && seconds <= 86_400 ? seconds : 60) * 1000);
        }
        setTerminal(result);
      }
    } catch {
      if (active.current === controller) setTerminal({ type: 'error', code: timedOut ? 'timeout' : controller.signal.aborted ? 'cancelled' : 'invalid_stream' });
    } finally {
      clearTimeout(timer);
      if (activeTimer.current === timer) activeTimer.current = undefined;
      if (active.current === controller) { active.current = null; setPending(false); }
    }
  }
  function cancel() {
    active.current?.abort(); active.current = null;
    clearTimeout(activeTimer.current); activeTimer.current = undefined;
    setPending(false); setTerminal({ type: 'error', code: 'cancelled' });
  }
  const result = terminal?.type === 'result' ? terminal : undefined;
  const stageIndex = result ? aiStages.length : stage ? aiStages.indexOf(stage) : -1;

  return (
    <section className={styles.panel} style={aiTheme} aria-labelledby="ai-title">
      <header>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="ai-title" className={styles.title}>{copy.title}</h1>
        <p className={styles.muted}>{copy.description}</p>
        {enabled && <p className={styles.muted}>{copy.coldStartHint}</p>}
      </header>
      {!enabled && <div className={styles.notice}><p>{regionUnavailable ? copy.regionUnavailable : copy.disabled}</p><Link href="/" className={`${styles.link} ${focus}`}>{copy.browse}</Link></div>}
      <form className={styles.form} onSubmit={event => { event.preventDefault(); void search({ message }); }}>
        <label htmlFor="ai-message">{copy.label}</label>
        <textarea id="ai-message" rows={3} maxLength={1000} required value={message} disabled={!enabled || pending}
          onChange={event => setMessage(event.target.value)} placeholder={copy.placeholder}
          aria-describedby="ai-privacy" className={`${styles.input} ${focus}`} />
        <p id="ai-privacy" className={styles.muted}>{copy.privacy}{' '}
          <a href="https://ai.google.dev/gemini-api/terms#unpaid-services" target="_blank" rel="noopener noreferrer" className={`${styles.link} ${focus}`}>{copy.privacyTerms}</a>
        </p>
        <div className={styles.actions}>
          <button type="submit" disabled={!enabled || pending || retryAt !== undefined || !message.trim()} className={`${styles.button} ${focus}`}>{copy.submit}</button>
          {pending && <button type="button" onClick={cancel} className={`${styles.link} ${focus}`}>{copy.cancel}</button>}
        </div>
      </form>
      <ol className={styles.stages} aria-label={copy.progressLabel}>
        {aiStages.map((item, index) => <li key={item} data-reached={index <= stageIndex} aria-current={pending && stage === item ? 'step' : undefined}>{copy.stages[item]}</li>)}
      </ol>
      <div role="status" aria-live="polite" aria-atomic="true">
        {pending && <p>{stage ? copy.stages[stage] : copy.connecting}</p>}
        {!pending && !terminal && enabled && <p className={styles.muted}>{copy.idle}</p>}
        {terminal?.type === 'unsupported' && <p>{copy.unsupported}</p>}
        {terminal?.type === 'error' && <p className={styles.error}>{terminal.code === 'rate_limited' && retryAt === undefined ? copy.rateLimitReady : copy.errors[terminal.code]}</p>}
        {result && <p>{result.status === 'needs_selection' ? copy.selectionTitle : result.presentation.movies.length ? copy.resultTitle : copy.empty}</p>}
      </div>
      {terminal?.type === 'error' && terminal.code === 'rate_limited' && <div className={styles.notice}>
        {retryAt !== undefined && <AIQuotaCountdown key={retryAt} until={retryAt} />}
        <p>{copy.rateLimitShared}</p>
        <Link href="/" className={`${styles.link} ${focus}`}>{copy.browse}</Link>
      </div>}
      {terminal?.type === 'error' && terminal.code === 'region_unavailable' && <div className={styles.notice}>
        <Link href="/" className={`${styles.link} ${focus}`}>{copy.browse}</Link>
      </div>}
      {terminal?.type === 'error' && enabled && lastRequest && !pending && retryAt === undefined
        && terminal.code !== 'disabled' && terminal.code !== 'region_unavailable' && (
        <div><button type="button" onClick={() => { void search(lastRequest); }} className={`${styles.link} ${focus}`}>{copy.retry}</button></div>
      )}
      {result && <div className={styles.results} aria-busy={pending}>
        {result.presentation.status === 'partial' && <p className={styles.notice}>{copy.partial}</p>}
        {result.status === 'needs_selection' && <p>{copy.selectionHint}</p>}
        {result.presentation.movies.map(movie => <article key={movie.id} className={styles.card} data-has-poster={Boolean(movie.poster_path)}>
          {movie.poster_path && <img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt="" width={342} height={513} loading="lazy" className={styles.poster} />}
          <div className={styles.cardContent}>
            <p className={styles.source}>{copy.source}</p>
            <h2 className={styles.movieTitle}>{movie.title}</h2>
            <p className={styles.muted}>{[movie.release_date?.slice(0, 4), movie.vote_average !== null ? copy.rating(movie.vote_average) : null].filter(Boolean).join(' · ')}</p>
            <p>{movie.overview || messages.common.noDescription}</p>
            {movie.director && <p>{copy.director(movie.director.name)}</p>}
            {movie.runtime !== null && <p>{messages.movie.durationLabel(movie.runtime)}</p>}
            <div className={styles.actions}>
              <Link href={`/movie/${movie.id}`} className={`${styles.link} ${focus}`}>{copy.details}</Link>
              {result.status === 'needs_selection' && <button type="button" disabled={pending || !enabled || retryAt !== undefined} className={`${styles.button} ${focus}`}
                onClick={() => { if (lastRequest) void search({ message: lastRequest.message, referenceMovieId: movie.id }); }}>{copy.select(movie.title)}</button>}
            </div>
          </div>
        </article>)}
      </div>}
    </section>
  );
}
