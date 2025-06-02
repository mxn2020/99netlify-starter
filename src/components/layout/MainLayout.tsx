import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import ParticleBackground from '../shared/ParticleBackground';
import { useAuth } from '../../hooks/useAuth';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  // Make sure to use the latest user preference value
  const menuLayout = user?.preferences?.menuLayout || 'sidebar';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ParticleBackground />
      <div className="relative z-10 flex flex-1">
        {isAuthenticated && menuLayout === 'sidebar' && (
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        )}
        <div className="flex flex-col flex-1 overflow-hidden">
          {isAuthenticated && (
            <Navbar 
              toggleSidebar={toggleSidebar} 
              showMenu={menuLayout === 'header'}
              isFixed={menuLayout === 'header'}
            />
          )}
          <main className={`flex-grow p-4 md:p-6 overflow-y-auto ${menuLayout === 'header' ? 'mt-16' : ''}`}>
            <div className="container mx-auto">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;