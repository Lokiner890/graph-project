import { fireEvent, render, screen } from '@/__tests__/_utils/render';
import { ROUTES } from '@/constants/routes';
import Home from '@/pages/Home';

test('should render', () => {
  render(<Home />);

  expect(screen.getByTestId('home-page')).toBeInTheDocument();
});

test('should navigate to login', async () => {
  const { router } = render(<Home />, {
    routes: [{ path: ROUTES.login, element: <h1>LogIn</h1> }],
  });

  fireEvent.click(screen.getByRole('link', { name: 'LogIn' }));

  expect(await screen.findByRole('heading', { name: 'LogIn' })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe(ROUTES.login);
});
