import type { ReactNode } from 'react';
import { Header } from './Header';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:pt-10">{children}</main>
    </div>
  );
}
