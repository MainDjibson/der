import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="futuristic-bg grid-pattern min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content relative z-10">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <div className="animate-slide-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
