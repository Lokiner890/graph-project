import { Link } from 'react-router';

import { ROUTES } from '@/constants/routes';

function LogIn() {
  return (
    <div>
      <h1>LogIn</h1>
      <Link to={ROUTES.home}>Home</Link>
    </div>
  );
}

export default LogIn;
