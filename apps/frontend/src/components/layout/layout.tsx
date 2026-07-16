import { Outlet } from 'react-router-dom';
import { Header } from './header';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-8 py-10 pb-24">
        <Outlet />
      </main>
      <footer className="text-center py-6 font-mono text-[11px] text-muted-2">
        Torre RPA · Painel de Controle de Automações · <b className="text-muted">v1.0</b>
      </footer>
    </div>
  );
}
