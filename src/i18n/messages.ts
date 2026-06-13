/**
 * Centralized i18n message dictionary (pt-BR).
 *
 * All static user-facing strings live here.
 * Components import only the namespace they need via `messages.<namespace>`.
 *
 * This is a minimal, typed, framework-safe approach — no runtime i18n library.
 * It exists to satisfy SecureCoder's JSX internationalization warnings
 * and to provide a single source of truth for all UI copy.
 */
export const messages = {
  common: {
    skipToContent: 'Pular para o conteúdo principal',
    loading: 'Carregando…',
    noImage: 'Sem imagem',
    noPhoto: 'Sem foto',
    noDescription: 'Sem descrição.',
  },
  error: {
    title: 'Ops! Algo deu errado.',
    fallback: 'Tente novamente mais tarde.',
    fetchMovies: 'Erro ao buscar filmes.',
  },
  navigation: {
    home: 'Início',
    watchlist: 'Watchlist',
    appTitle: 'Movie Explorer',
  },
  home: {
    searchLabel: 'Buscar filmes',
    searchPlaceholder: 'Buscar filmes...',
    subtitle: 'Busque por filmes ou navegue pelos populares.',
    popularTitle: 'Filmes populares',
    trendingTodayTitle: 'Em alta hoje',
    trendingWeekTitle: 'Em alta na semana',
    searchResultsTitle: (query: string) => `Resultados para: "${query}"`,
    popular: 'Populares',
    trending: 'Trending',
    today: 'Hoje',
    week: 'Semana',
    noMoviesFound: 'Nenhum filme encontrado.',
  },
  pagination: {
    previous: 'Anterior',
    next: 'Próxima',
    pageInfo: (page: number, totalPages: number) =>
      `Página ${page} de ${totalPages}`,
    goToPage: (page: number) => `Ir para a página ${page}`,
  },
  watchlist: {
    title: 'Minha Watchlist',
    empty: 'Você ainda não adicionou nenhum filme à watchlist.',
    add: 'Adicionar à Watchlist',
    remove: 'Remover da Watchlist',
    addAriaLabel: 'Adicionar à watchlist',
    removeAriaLabel: 'Remover da watchlist',
  },
  movie: {
    synopsis: 'Sinopse',
    genres: 'Gêneros',
    director: 'Diretor',
    visitOfficialSite: 'Visitar site oficial ↗',
    goBack: '← Voltar',
    trailer: 'Trailer',
    trailerTitle: 'Trailer do filme',
    mainCast: 'Elenco principal',
    similarMovies: 'Filmes semelhantes',
    ratingLabel: (avg: number, count: number) =>
      `⭐ ${avg.toFixed(1)} (${count})`,
    durationLabel: (runtime: number | null) =>
      `Duração: ${runtime ?? '—'} min`,
    releaseDateLabel: (date: string) => `Lançamento: ${date}`,
  },
} as const;
