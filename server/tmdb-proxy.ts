import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001);
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error('Error: TMDB_API_KEY is not defined in environment variables.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Create axios instance for TMDB API
const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: TMDB_API_KEY,
    language: 'pt-BR',
  },
});

// Helper for error responses that doesn't leak internal details or API key
function handleProxyError(res: express.Response, error: unknown, customMessage: string) {
  const status = axios.isAxiosError(error) ? error.response?.status || 500 : 500;
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Proxy Error: ${customMessage}`, {
    status,
    message,
  });
  res.status(status).json({ error: customMessage });
}

// Helper to validate numeric/string IDs/pages defensively
function validateNumber(val: unknown, fallback?: number): number | undefined {
  if (val === undefined || val === null || val === '') return fallback;
  const num = Number(String(val));
  return isNaN(num) ? fallback : num;
}

// 1. Search movies
app.get('/api/tmdb/search', async (req, res) => {
  const { query, page } = req.query;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query parameter "query" is required' });
  }

  const pageNum = validateNumber(page, 1);

  try {
    const { data } = await tmdbClient.get('/search/movie', {
      params: {
        query: query.trim(),
        page: pageNum,
      },
    });
    res.json(data);
  } catch (error) {
    handleProxyError(res, error, 'Failed to fetch search results');
  }
});

// 2. Trending movies
app.get('/api/tmdb/trending', async (req, res) => {
  const { page, timeWindow } = req.query;
  const window = timeWindow === 'day' || timeWindow === 'week' ? timeWindow : 'week';
  const pageNum = validateNumber(page, 1);

  try {
    const { data } = await tmdbClient.get(`/trending/movie/${window}`, {
      params: {
        page: pageNum,
      },
    });
    res.json(data);
  } catch (error) {
    handleProxyError(res, error, 'Failed to fetch trending movies');
  }
});

// 3. Popular movies (needed for app's fetchPopularMovies fallback)
app.get('/api/tmdb/movie/popular', async (req, res) => {
  const { page } = req.query;
  const pageNum = validateNumber(page, 1);

  try {
    const { data } = await tmdbClient.get('/movie/popular', {
      params: {
        page: pageNum,
      },
    });
    res.json(data);
  } catch (error) {
    handleProxyError(res, error, 'Failed to fetch popular movies');
  }
});

// 4. Movie Details
app.get('/api/tmdb/movie/:id', async (req, res) => {
  const { id } = req.params;
  const movieId = validateNumber(id);
  if (!movieId) {
    return res.status(400).json({ error: 'Valid movie ID is required' });
  }

  try {
    const { data } = await tmdbClient.get(`/movie/${movieId}`);
    res.json(data);
  } catch (error) {
    handleProxyError(res, error, `Failed to fetch movie details for ID ${movieId}`);
  }
});

// 5. Movie Credits
app.get('/api/tmdb/movie/:id/credits', async (req, res) => {
  const { id } = req.params;
  const movieId = validateNumber(id);
  if (!movieId) {
    return res.status(400).json({ error: 'Valid movie ID is required' });
  }

  try {
    const { data } = await tmdbClient.get(`/movie/${movieId}/credits`);
    res.json(data);
  } catch (error) {
    handleProxyError(res, error, `Failed to fetch credits for movie ID ${movieId}`);
  }
});

// 6. Movie Recommendations / Similar
app.get('/api/tmdb/movie/:id/recommendations', async (req, res) => {
  const { id } = req.params;
  const movieId = validateNumber(id);
  if (!movieId) {
    return res.status(400).json({ error: 'Valid movie ID is required' });
  }

  try {
    const { data } = await tmdbClient.get(`/movie/${movieId}/recommendations`);
    res.json(data);
  } catch (error) {
    handleProxyError(res, error, `Failed to fetch recommendations for movie ID ${movieId}`);
  }
});

// 7. Movie Videos (trailers)
app.get('/api/tmdb/movie/:id/videos', async (req, res) => {
  const { id } = req.params;
  const movieId = validateNumber(id);
  if (!movieId) {
    return res.status(400).json({ error: 'Valid movie ID is required' });
  }

  try {
    const { data } = await tmdbClient.get(`/movie/${movieId}/videos`);
    res.json(data);
  } catch (error) {
    handleProxyError(res, error, `Failed to fetch videos for movie ID ${movieId}`);
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));

  app.get('*any', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server proxy listening on http://localhost:${PORT}`);
});
