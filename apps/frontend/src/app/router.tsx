import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/layout';
import { Dashboard } from '../features/dashboard/dashboard';
import { SevProduct } from '../features/sev/sev-product';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sev" element={<SevProduct />} />
      </Route>
    </Routes>
  );
}
