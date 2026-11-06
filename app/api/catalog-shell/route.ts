import {
  fetchPopularMovies,
  fetchTrendingMovies,
  searchMovies,
} from '@/server/actions/tmdb';
import type { MovieListItem, TmdbPaginatedResponse } from '@/types/movie';
import { catalogShellFontCss } from '@/theme/catalog-shell-fonts';
import { gzipSync } from 'node:zlib';

const WATCHLIST_KEY = 'movie-explorer:watchlist';
const POSTER_BASE = 'https://image.tmdb.org/t/p';
const CATALOG_CACHE_TTL_MS = 60_000;
const CATALOG_CACHE_MAX_ENTRIES = 48;

type CatalogResponse = TmdbPaginatedResponse<MovieListItem>;
const catalogResponseCache = new Map<string, {
  expiresAt: number;
  response: Promise<CatalogResponse>;
}>();

function getCachedCatalogResponse(
  key: string,
  load: () => Promise<CatalogResponse>,
): Promise<CatalogResponse> {
  const cached = catalogResponseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.response;

  const response = load();
  const entry = { expiresAt: Date.now() + CATALOG_CACHE_TTL_MS, response };
  catalogResponseCache.set(key, entry);
  response.catch(() => {
    if (catalogResponseCache.get(key) === entry) catalogResponseCache.delete(key);
  });

  while (catalogResponseCache.size > CATALOG_CACHE_MAX_ENTRIES) {
    const oldestKey = catalogResponseCache.keys().next().value;
    if (oldestKey === undefined) break;
    catalogResponseCache.delete(oldestKey);
  }

  return response;
}

const styles = `
  :root{color-scheme:dark;--void:#11110f;--surface:#1b1b18;--raised:#252520;--rim:#45443a;--accent:#f5c518;--on-accent:#17150a;--text:#f3f0e6;--muted:#aaa79a;--font-display:display,"Sora Full","Sora Fallback",sans-serif;--font-body:body,"Hanken Grotesk Full","Hanken Grotesk Fallback",sans-serif;--font-mono:mono,"JetBrains Mono Full","JetBrains Mono Fallback",monospace}
  *{box-sizing:border-box}html{scroll-padding-top:8rem}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 80% 0,rgba(245,197,24,.035),transparent 45%),var(--void);color:var(--text);font:400 1rem/1.55 var(--font-body)}
  a{color:inherit;text-decoration:none}button,input{font:inherit}button,a{-webkit-tap-highlight-color:transparent}:where(a,button,input):focus-visible{outline:2px solid var(--accent);outline-offset:4px}button{color:inherit;cursor:pointer}
  .skip-link{position:fixed;z-index:100;top:-10rem;left:1rem;padding:1rem;border-radius:.5rem;background:var(--accent);color:var(--on-accent)}.skip-link:focus{top:1rem}
  .site-header{position:sticky;top:0;z-index:30;border-bottom:1px solid var(--rim);background:rgba(25,25,22,.9);backdrop-filter:blur(16px) saturate(140%)}.header-inner,.site-main,.site-footer{width:min(100%,1280px);margin-inline:auto;padding-inline:clamp(1rem,4vw,2.5rem)}
  .header-inner{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;min-height:88px;padding-block:1rem}.brand{display:inline-flex;align-items:center;gap:.75rem;font-family:var(--font-display);font-size:1.125rem;font-weight:650;letter-spacing:-.04em}.brand svg{flex:none;color:var(--accent)}.brand-tagline{display:block;margin-top:.125rem;color:var(--muted);font-family:var(--font-body);font-size:.6875rem;font-weight:400;letter-spacing:.04em}.main-nav{display:flex;align-items:center;gap:1.75rem}.nav-link{position:relative;display:inline-flex;align-items:center;min-height:44px;color:var(--muted);font-size:.875rem}.nav-link[aria-current=page]{color:var(--accent)}.nav-ai{gap:.5rem}.nav-ai:before{content:"✧";color:var(--accent);font-size:1.1rem}
  .site-main{min-height:calc(100svh - 200px);padding-block:1.5rem 4rem}.catalog-page{display:grid;gap:3rem}.catalog-intro{display:grid;grid-template-columns:1.2fr 1fr;gap:3rem;align-items:end;padding-block:2.5rem 1rem}.cinema-eyebrow{display:flex;align-items:center;gap:.625rem;color:var(--muted);font-family:var(--font-mono);font-size:.625rem;font-weight:600;line-height:1.8;text-transform:uppercase;letter-spacing:.14em}.cinema-dash{width:1.5rem;height:2px;background:var(--accent)}
  .catalog-intro h1{margin:1rem 0 0;font-family:var(--font-display);font-size:clamp(2.75rem,5.7vw,5rem);font-weight:650;line-height:1.08;letter-spacing:-.065em}.catalog-intro h1 span{color:var(--accent)}.intro-aside{display:grid;gap:1.25rem;padding-bottom:.25rem}.intro-aside>p:first-child{max-width:30rem;margin:0;color:var(--muted);font-size:1.125rem;line-height:1.7}.cinema-actions{display:flex;align-items:center;flex-wrap:wrap;gap:.75rem 1.25rem}.cinema-button{display:inline-flex;align-items:center;justify-content:center;gap:1.25rem;min-height:48px;padding:.75rem 1.25rem;border:0;border-radius:999px;background:var(--accent);color:var(--on-accent);font-size:.875rem;font-weight:700;text-align:center}.cinema-text-link{display:inline-flex;align-items:center;justify-content:center;gap:.75rem;min-height:44px;color:var(--accent);font-size:.875rem;font-weight:650;text-underline-offset:.3em}.intro-fineprint{max-width:30rem;margin:0;color:var(--muted);font-size:.75rem;line-height:1.65}
  .catalog-section{display:grid;gap:1.5rem;padding-top:2rem;border-top:1px solid var(--rim);scroll-margin-top:2rem}.catalog-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;min-width:0}.cinema-eyebrow{margin:0}.catalog-heading{margin:.4rem 0 0;font-family:var(--font-display);font-size:clamp(1.25rem,2.3vw,1.75rem);font-weight:550;letter-spacing:-.035em;overflow-wrap:anywhere}.catalog-search{display:flex;align-items:center;gap:.75rem;width:100%;max-width:26rem;min-width:0;min-height:52px;padding-inline:1rem .375rem;border:1px solid var(--rim);border-radius:999px;background:color-mix(in srgb,var(--raised) 85%,transparent)}.catalog-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px rgba(245,197,24,.12)}.catalog-search svg{flex:none;color:var(--muted)}.catalog-search label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.catalog-search-input{width:100%;min-width:0;padding-block:.75rem;border:0;background:transparent;color:var(--text);font-size:.9375rem}.catalog-search-input::placeholder{color:var(--muted);opacity:.8}.catalog-search-input:focus-visible{outline:0}.clear-search{flex:none;width:44px;height:44px;border:0;border-radius:50%;background:transparent;color:var(--muted);font-size:1.5rem}
  .catalog-filters,.filter-group{display:flex;flex-wrap:wrap;gap:1rem}.filter-group{gap:.25rem;padding:.25rem;border:1px solid var(--rim);border-radius:999px}.filter-group form{margin:0}.filter-button{min-height:44px;padding:.5rem 1.125rem;border:0;border-radius:999px;background:transparent;color:var(--muted);font-size:.8125rem}.filter-button[aria-pressed=true]{background:var(--accent);color:var(--on-accent);font-weight:700}.filter-secondary .filter-button[aria-pressed=true]{background:var(--raised);color:var(--text)}
  .movie-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1.5rem}.movie-card{position:relative;min-width:0;overflow:hidden;border:1px solid var(--rim);border-radius:1rem;background:color-mix(in srgb,var(--raised) 85%,transparent);content-visibility:auto;contain-intrinsic-block-size:auto min(calc(37.5vw + 3rem),33rem)}.movie-card-link{display:block;height:100%}.movie-card-link:focus-visible{outline-offset:-3px;border-radius:1rem}.movie-poster{position:relative;width:100%;aspect-ratio:2/3;overflow:hidden;background:var(--raised)}.movie-poster>img{width:100%;height:100%;object-fit:cover}.movie-poster:after{position:absolute;inset:45% 0 0;background:linear-gradient(transparent,rgba(14,14,14,.45));content:"";pointer-events:none}.poster-missing{display:flex;height:100%;flex-direction:column;align-items:center;justify-content:center;gap:1rem;color:var(--muted);font-family:var(--font-mono);font-size:.6875rem}.poster-missing span:first-child{color:var(--rim);font-family:var(--font-display);font-size:3rem}.movie-rating{position:absolute;z-index:1;top:.75rem;left:.75rem;display:inline-flex;align-items:center;gap:.375rem;padding:.375rem .625rem;border:1px solid rgba(245,197,24,.25);border-radius:999px;background:rgba(14,14,14,.88);color:var(--accent);font-family:var(--font-mono);font-size:.6875rem}.movie-caption{min-height:105px;padding:1rem}.movie-caption h2{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;margin:0;font-size:1rem;font-weight:650;line-height:1.45}.movie-meta{display:flex;justify-content:space-between;margin:0 0 .375rem;color:var(--muted);font-family:var(--font-mono);font-size:.625rem}.movie-meta span:last-child{color:var(--accent);font-size:.875rem}.watchlist-button{position:absolute;z-index:2;top:.5rem;right:.5rem;display:grid;width:44px;height:44px;place-items:center;border:1px solid rgba(255,255,255,.18);border-radius:50%;background:rgba(14,14,14,.85);color:var(--text);font-size:1.5rem}.watchlist-button[aria-pressed=true]{border-color:#c48aff;color:#c48aff}
  .cinema-pagination{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1rem;padding-top:1rem}.pagination-button{min-height:44px;padding:.625rem 1rem;border:1px solid var(--rim);border-radius:999px;background:transparent;font-size:.8125rem}.pagination-button:disabled{opacity:.4;cursor:not-allowed}.pagination-info{color:var(--muted);font-family:var(--font-mono);font-size:.6875rem}.cinema-empty{display:flex;flex-direction:column;align-items:center;gap:1.25rem;padding:clamp(2rem,6vw,5rem) 1.5rem;border:1px solid var(--rim);border-radius:1.25rem;background:var(--surface);text-align:center}.cinema-empty h2{max-width:30rem;margin:0;font-family:var(--font-display);font-size:clamp(1.5rem,3vw,2.25rem);line-height:1.25;letter-spacing:-.04em}.cinema-empty>p{max-width:32rem;margin:0;color:var(--muted)}.cinema-error{margin-block:2rem}.site-footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;padding-block:1.75rem;border-top:1px solid var(--rim);color:var(--muted);font-size:.75rem}.site-footer>span{font-family:var(--font-display);font-weight:650}.site-footer>p{max-width:34rem;margin:0}
  @media(hover:hover){.nav-link:hover,.cinema-text-link:hover{color:var(--accent)}.cinema-text-link:hover{text-decoration:underline}.movie-card:hover{border-color:var(--accent);box-shadow:0 12px 36px rgba(0,0,0,.25)}.movie-card:hover h2{color:var(--accent)}.watchlist-button:hover,.pagination-button:enabled:hover{border-color:var(--accent);background:var(--raised)}}
  @media(max-width:900px){.movie-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.catalog-intro{gap:2rem}}
  @media(min-width:641px) and (max-width:900px){.movie-card{contain-intrinsic-block-size:auto calc(46vw + 5.5625rem)}}
  @media(max-width:640px){.header-inner{gap:.375rem;padding-block:.75rem 0}.brand-tagline{display:none}.main-nav{width:100%;justify-content:space-between;gap:0}.nav-link{justify-content:center;padding-inline:.5rem;font-size:.8125rem}.catalog-intro{grid-template-columns:1fr;gap:1.5rem;padding-top:1.5rem}.catalog-intro h1{font-size:clamp(2.5rem,10vw,3.5rem)}.intro-aside>p:first-child{font-size:1rem}.catalog-page{gap:2rem}.catalog-toolbar{flex-direction:column;align-items:stretch;gap:1rem}.catalog-search{max-width:none}.movie-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}.movie-card{border-radius:.75rem;contain-intrinsic-block-size:auto calc(75vw + 4.5rem)}.movie-caption{padding:.75rem}.movie-caption h2{font-size:.875rem}.movie-rating{top:.5rem;left:.5rem;padding:.25rem .375rem;font-size:.625rem}.watchlist-button{top:.25rem;right:.25rem}.cinema-pagination{gap:.5rem}.pagination-button{padding-inline:.75rem}.pagination-info{font-size:.625rem}.site-footer{font-size:.6875rem}}
  @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important}}
`;

function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

function getPage(value: string | null): number {
  const page = Number.parseInt(value ?? '', 10);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function hiddenInput(name: string, value: string | number): string {
  return `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`;
}

function pageForm(
  page: number,
  query: string,
  view: 'popular' | 'trending',
  window: 'day' | 'week',
  label: string,
  disabled: boolean,
): string {
  const state = query
    ? hiddenInput('query', query)
    : `${hiddenInput('view', view)}${view === 'trending' ? hiddenInput('window', window) : ''}`;

  return `<form method="get" action="/">${state}${hiddenInput('page', page)}<button class="pagination-button" type="submit"${disabled ? ' disabled' : ''}>${escapeHtml(label)}</button></form>`;
}

function renderMovie(movie: MovieListItem, index: number): string {
  const title = escapeHtml(movie.title);
  const posterPath = movie.poster_path ?? '';
  const year = movie.release_date?.slice(0, 4) || '—';
  const rating = Number.isFinite(movie.vote_average) ? movie.vote_average : 0;
  const image = posterPath
    ? `<img src="${POSTER_BASE}/w342${escapeHtml(posterPath)}" srcset="${[185, 342, 500].map(width => `${POSTER_BASE}/w${width}${escapeHtml(posterPath)} ${width}w`).join(', ')}" sizes="(max-width:640px) calc((100vw - 44px)/2),(max-width:900px) calc((100vw - 64px)/3),(max-width:1280px) calc((100vw - 152px)/4),282px" alt="" width="342" height="513"${index < 4 ? ' fetchpriority="high"' : ' loading="lazy"'}>`
    : '<div class="poster-missing"><span aria-hidden="true">↗</span><span>Sem imagem</span></div>';

  return `<article class="movie-card"><a class="movie-card-link" href="/movie/${encodeURIComponent(movie.id)}"><div class="movie-poster">${image}<div class="movie-rating" aria-label="${rating > 0 ? `Avaliação TMDB: ${rating.toFixed(1)} de 10` : 'Sem avaliação'}"><span aria-hidden="true">★</span> ${rating > 0 ? rating.toFixed(1) : '—'}</div></div><div class="movie-caption"><p class="movie-meta"><span>${escapeHtml(year)}</span><span aria-hidden="true">↗</span></p><h2>${title}</h2></div></a><button class="watchlist-button" type="button" data-movie-id="${escapeHtml(movie.id)}" data-movie-title="${title}" data-poster-path="${escapeHtml(posterPath)}" data-vote-average="${escapeHtml(rating)}" data-release-date="${escapeHtml(movie.release_date ?? '')}" aria-label="Adicionar ${title} à watchlist" aria-pressed="false" title="Adicionar ${title} à watchlist"><span aria-hidden="true">♡</span></button></article>`;
}

function renderFilters(view: 'popular' | 'trending', window: 'day' | 'week'): string {
  return `<div class="catalog-filters"><div class="filter-group" role="group" aria-label="No seu radar"><form method="get" action="/">${hiddenInput('view', 'popular')}${hiddenInput('page', 1)}<button class="filter-button" type="submit" aria-pressed="${view === 'popular'}">Populares</button></form><form method="get" action="/">${hiddenInput('view', 'trending')}${hiddenInput('window', 'day')}${hiddenInput('page', 1)}<button class="filter-button" type="submit" aria-pressed="${view === 'trending'}">Trending</button></form></div>${view === 'trending' ? `<div class="filter-group filter-secondary" role="group" aria-label="Trending"><form method="get" action="/">${hiddenInput('view', 'trending')}${hiddenInput('window', 'day')}${hiddenInput('page', 1)}<button class="filter-button" type="submit" aria-pressed="${window === 'day'}">Hoje</button></form><form method="get" action="/">${hiddenInput('view', 'trending')}${hiddenInput('window', 'week')}${hiddenInput('page', 1)}<button class="filter-button" type="submit" aria-pressed="${window === 'week'}">Semana</button></form></div>` : ''}</div>`;
}

function renderCatalog(
  moviesData: TmdbPaginatedResponse<MovieListItem> | null,
  error: boolean,
  query: string,
  view: 'popular' | 'trending',
  window: 'day' | 'week',
  page: number,
): string {
  const title = query
    ? `Resultados para: &quot;${escapeHtml(query)}&quot;`
    : view === 'trending'
      ? window === 'day' ? 'Em alta hoje' : 'Em alta na semana'
      : 'Filmes populares';
  const results = error
    ? '<div class="cinema-empty cinema-error" role="alert"><h2>Ops! Algo deu errado.</h2><p>Não foi possível carregar esta parte do catálogo. Tente novamente ou volte ao início.</p><a class="cinema-text-link" href="/">Tentar novamente ↗</a></div>'
    : moviesData?.results.length
      ? `<div class="movie-grid">${moviesData.results.map((movie, index) => renderMovie(movie, index)).join('')}</div>${moviesData.total_pages > 1 ? `<nav class="cinema-pagination" aria-label="Paginação do catálogo">${pageForm(page - 1, query, view, window, 'Anterior', page <= 1)}<span class="pagination-info">Página ${moviesData.page} de ${moviesData.total_pages}</span>${pageForm(page + 1, query, view, window, 'Próxima', page >= moviesData.total_pages)}</nav>` : ''}`
      : '<div class="cinema-empty"><p class="cinema-eyebrow">Um título é um bom começo.</p><h2>Nenhum filme encontrado.</h2><p>Tente outro título ou explore os filmes populares. Sua próxima história pode estar por lá.</p><a class="cinema-button" href="/">Voltar ao catálogo</a></div>';

  return `<section id="catalog" class="catalog-section" aria-label="No seu radar"><div class="catalog-toolbar"><div><p class="cinema-eyebrow">No seu radar</p><h2 class="catalog-heading">${title}</h2></div><form class="catalog-search" id="search-form" action="/" method="get"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="m16 16 5 5" stroke="currentColor" stroke-width="1.5"/></svg><label for="movie-search">Buscar filmes</label><input class="catalog-search-input" id="movie-search" name="query" type="search" value="${escapeHtml(query)}" placeholder="Buscar filmes..." autocomplete="off">${query ? '<button class="clear-search" id="clear-search" type="button" aria-label="Limpar busca">×</button>' : ''}</form></div>${query ? '' : renderFilters(view, window)}${results}</section>`;
}

function renderDocument(content: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11110f"><meta name="description" content="Descubra e organize seus filmes favoritos"><title>Movie Explorer</title><link rel="preload" as="font" href="/catalog-fonts/fonts/sora-ui.woff2" type="font/woff2" crossorigin><link rel="preload" as="font" href="/catalog-fonts/fonts/hanken-ui.woff2" type="font/woff2" crossorigin><link rel="preload" as="font" href="/catalog-fonts/fonts/mono-ui.woff2" type="font/woff2" crossorigin><style>${catalogShellFontCss}${styles}</style></head><body><a class="skip-link" href="#main-content">Pular para o conteúdo principal</a><header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Movie Explorer"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="3" y="7" width="26" height="20" rx="3" stroke="currentColor" stroke-width="2"/><path d="m12 7 4 6m4-6 4 6M5 15h22" stroke="currentColor" stroke-width="2"/><circle cx="11" cy="21" r="2" fill="currentColor"/><circle cx="21" cy="21" r="2" fill="currentColor"/></svg><span>Movie Explorer<span class="brand-tagline">Seu próximo bom filme</span></span></a><nav class="main-nav" aria-label="Navegação principal"><a class="nav-link" href="/" aria-current="page">Início</a><a class="nav-link nav-ai" href="/discover">Busca com IA</a><a class="nav-link" href="/watchlist">Watchlist</a></nav></div></header><main class="site-main" id="main-content" tabindex="-1"><div class="catalog-page"><section class="catalog-intro" aria-labelledby="catalog-title"><div><p class="cinema-eyebrow"><span class="cinema-dash" aria-hidden="true"></span>Para a sua próxima sessão</p><h1 id="catalog-title">Menos rolagem.<br><span>Mais cinema.</span></h1></div><div class="intro-aside"><p>Descubra filmes, reencontre favoritos e guarde o que vale a próxima sessão.</p><div class="cinema-actions"><a class="cinema-button" href="#catalog">Explorar o catálogo <span aria-hidden="true">↓</span></a><a class="cinema-text-link" href="/discover">Conhecer a busca com IA <span aria-hidden="true">↗</span></a></div><p class="intro-fineprint">Demonstração de IA para maiores de 18 anos. Sujeita à região e ao limite compartilhado.</p></div></section>${content}</div></main><footer class="site-footer"><span>Movie Explorer</span><p>Dados do TMDB. Este produto não é endossado nem certificado pelo TMDB.</p></footer><script>${clientScript}</script></body></html>`;
}

const clientScript = `
  (()=>{
    const key='${WATCHLIST_KEY}';let saved=[];
    try{const parsed=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(parsed))saved=parsed}catch{}
    const buttons=[...document.querySelectorAll('.watchlist-button')];
    const sync=button=>{const active=saved.some(movie=>movie.id===Number(button.dataset.movieId));const title=button.dataset.movieTitle;const label=active?'Remover '+title+' da watchlist':'Adicionar '+title+' à watchlist';button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',label);button.title=label;button.firstElementChild.textContent=active?'♥':'♡'};
    buttons.forEach(button=>{sync(button);button.addEventListener('click',()=>{const movie={id:Number(button.dataset.movieId),title:button.dataset.movieTitle,poster_path:button.dataset.posterPath||null,vote_average:Number(button.dataset.voteAverage),release_date:button.dataset.releaseDate};saved=saved.some(item=>item.id===movie.id)?saved.filter(item=>item.id!==movie.id):[...saved,movie];try{localStorage.setItem(key,JSON.stringify(saved))}catch{}sync(button)})});
    const form=document.getElementById('search-form'),input=document.getElementById('movie-search');let timer;
    input?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{const current=new URL(location.href).searchParams.get('query')||'';if(input.value.trim()!==current.trim())form.requestSubmit()},500)});
    document.getElementById('clear-search')?.addEventListener('click',()=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()});
  })();
`;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get('query') ?? '').trim();
  const view = params.get('view') === 'trending' ? 'trending' : 'popular';
  const window = params.get('window') === 'week' ? 'week' : 'day';
  const page = getPage(params.get('page'));

  let moviesData: TmdbPaginatedResponse<MovieListItem> | null = null;
  let error = false;
  try {
    const cacheKey = query
      ? JSON.stringify(['search', query, page])
      : JSON.stringify([view, view === 'trending' ? window : 'day', page]);
    moviesData = await getCachedCatalogResponse(cacheKey, () => query
      ? searchMovies(query, page)
      : view === 'trending'
        ? fetchTrendingMovies(window, page)
        : fetchPopularMovies(page));
  } catch {
    error = true;
  }

  const html = renderDocument(renderCatalog(moviesData, error, query, view, window, page));
  const acceptsGzip = request.headers.get('accept-encoding')?.includes('gzip') ?? false;
  const body = acceptsGzip ? gzipSync(html) : html;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(acceptsGzip ? { 'Content-Encoding': 'gzip' } : {}),
      Vary: 'Accept-Encoding',
      'Content-Length': String(Buffer.byteLength(body)),
    },
  });
}
