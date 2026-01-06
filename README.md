# Movie Explorer

Projeto de portfólio construído com React + TypeScript + Vite + Tailwind CSS consumindo a TMDB API. Permite explorar filmes populares, buscar com debounce e paginação, e manter uma watchlist local.

## Features

- Home: busca com debounce e paginação
- Details: trailer, elenco principal e filmes similares
- Watchlist: persistida em `localStorage`
- Header com rotas para Home e Watchlist

## Como rodar

1) Instale dependências

```bash
npm i
```

2) Configure a variável de ambiente

- Copie `.env.example` para `.env`
- Preencha `VITE_TMDB_API_KEY`

3) Rode o projeto

```bash
npm run dev
```

## Screenshots

- Home: `docs/screenshot-home.png`
- Details: `docs/screenshot-details.png`
- Watchlist: `docs/screenshot-watchlist.png`

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- TMDB API

## Arquitetura

- Pages: `src/pages`
- Components: `src/components`
- Hooks: `src/hooks`
- Services: `src/services`
- Types: `src/types`
- Context: `src/context`

## Roadmap

- Trending e Top Rated na Home
- Filtros por gênero, ano e ordenação
- Skeleton loading nos cards
- Melhorias de acessibilidade (a11y)
- Testes basicos de hooks e services
