# layouts

Layouts are components that wrap a group of routes with shared UI (header, sidebar, auth card, etc.). A layout renders `<Outlet />` from `react-router` where the matched child route should appear.

Layouts are attached to routes in `src/router/Router.tsx`.

example AuthLayout, DashboardLayout, etc.
