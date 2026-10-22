import type { QualityAgentResult } from '../presentation';

export const approvedPresentation: QualityAgentResult = {
  status: 'approved', source: 'tmdb', issues: [], movies: [{
    id: 42, title: 'Exemplo de filme', overview: 'Descrição conferida.', poster_path: null,
    release_date: '2026-01-02', vote_average: 8, genres: [], runtime: null, cast: [], director: null,
  }],
};
export const progressEvents = [
  { type: 'progress', stage: 'planning' }, { type: 'progress', stage: 'searching' }, { type: 'progress', stage: 'validating' },
];
export const resultEvent = { type: 'result', status: 'completed', presentation: approvedPresentation };
export const ndjson = (events: unknown[]) => events.map(event => `${JSON.stringify(event)}\n`).join('');
