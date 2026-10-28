import { Link } from 'react-router';

import { ROUTES } from '@/constants/routes';

function Home() {
  return (
    <div data-testid="home-page">
      <h1>Home</h1>
      <Link to={ROUTES.login}>LogIn</Link>
    </div>
  );
}

export default Home;
