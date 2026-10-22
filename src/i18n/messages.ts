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
    discover: 'Busca com IA',
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
  ai: {
    eyebrow: 'Sua próxima sessão',
    title: 'Um pedido. Novos filmes.',
    description: 'Busque um título, veja o que está em alta ou peça detalhes e recomendações a partir de um filme.',
    label: 'O que você quer assistir?',
    placeholder: 'Ex.: Quais filmes estão em alta nesta semana?',
    submit: 'Buscar com IA',
    cancel: 'Cancelar busca',
    retry: 'Tentar novamente',
    privacy: 'Quando ativada, a busca envia seu pedido ao Google. Não inclua dados pessoais ou segredos.',
    disabled: 'A busca com IA ainda não está ativada. Você pode continuar buscando por título no início.',
    browse: 'Buscar no catálogo',
    idle: 'Seu pedido começa aqui. Os filmes só aparecem depois da conferência dos dados.',
    connecting: 'Iniciando busca…',
    stages: { planning: 'Entendendo o pedido', searching: 'Buscando filmes', validating: 'Conferindo dados' },
    progressLabel: 'Etapas da busca',
    resultTitle: 'Filmes encontrados',
    selectionTitle: 'Qual destes filmes?',
    selectionHint: 'Escolha o filme para continuar com seu pedido original.',
    select: (title: string) => `Continuar com ${title}`,
    details: 'Ver detalhes',
    source: 'Dados do TMDB',
    partial: 'Parte da busca não pôde ser concluída. Estes são os resultados disponíveis após a conferência.',
    empty: 'Nenhum filme encontrado. Tente outro título ou reformule o pedido.',
    unsupported: 'Este pedido não é atendido pela busca atual. Tente um título, filmes em alta, detalhes ou recomendações.',
    rating: (value: number) => `Nota ${value.toFixed(1)} / 10`,
    director: (name: string) => `Direção: ${name}`,
    errors: {
      invalid_request: 'Revise seu pedido: use até 1.000 caracteres e não inclua credenciais.',
      disabled: 'A busca com IA ainda não está ativada. Use a busca por título no início.',
      unavailable: 'A busca está indisponível agora. Tente novamente mais tarde ou use a busca por título.',
      quota_exceeded: 'O limite de uso da IA foi atingido. Tente mais tarde; nenhum outro modelo será usado.',
      timeout: 'A busca demorou mais que o permitido. Tente novamente ou use a busca por título.',
      cancelled: 'Busca cancelada. Você pode fazer um novo pedido.',
      unsafe_result: 'Não foi possível conferir o resultado. Reformule seu pedido ou use a busca por título.',
      invalid_stream: 'A resposta foi interrompida ou não pôde ser conferida. Tente novamente.',
    },
  },
} as const;
