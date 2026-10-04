import React from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

export const MainLayout = ({ activeTab, setActiveTab, searchValue, setSearchValue, children }) => {
  return (
    <div className="flex h-screen bg-[#0f131c] text-[#dfe2ef] overflow-hidden font-sans transition-colors duration-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0f131c] transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};
