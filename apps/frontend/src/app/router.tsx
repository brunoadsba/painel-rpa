import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/layout';
import { Dashboard } from '../features/dashboard/dashboard';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
