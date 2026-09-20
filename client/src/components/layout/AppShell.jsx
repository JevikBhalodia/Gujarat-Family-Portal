import React from 'react';
import TopNav from './TopNav.jsx';
import BottomNav from './BottomNav.jsx';

export function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-salt text-ink">
      <TopNav />
      <main className="flex-1 max-w-[1120px] w-full mx-auto px-6 py-8 pb-20 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default AppShell;
