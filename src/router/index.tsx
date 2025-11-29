import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import HomePage from '../pages/Home';
import MovieDetailsPage from '../pages/MovieDetails';
import WatchlistPage from '../pages/Watchlist';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'movie/:id', element: <MovieDetailsPage /> },
      { path: 'watchlist', element: <WatchlistPage /> },
    ],
  },
]);

export default router;
