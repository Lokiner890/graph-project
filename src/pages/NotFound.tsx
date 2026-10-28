import { Link } from 'react-router';

import { ROUTES } from '@/constants/routes';

function NotFound() {
  return (
    <div data-testid="not-found-page">
      <h1>Page not found</h1>
      <Link to={ROUTES.home}>Go home</Link>
    </div>
  );
}

export default NotFound;
