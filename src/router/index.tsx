import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import MovieDetails from '../pages/MovieDetails';
import { Layout } from '../components/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: '/movie/:id',
    element: (
      <Layout>
        <MovieDetails />
      </Layout>
    ),
  },
]);
