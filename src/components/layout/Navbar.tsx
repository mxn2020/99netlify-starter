import React, { useState } from 'react';
import { PlusCircle, Settings, User, LogOut, Menu, Sun, Moon, BookOpen, Home as HomeIcon, Info, FileText, TestTube } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import AccountSelector from '../accounts/AccountSelector';

interface NavbarProps {
  toggleSidebar: () => void;
  showMenu?: boolean;
  isFixed?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, showMenu = false, isFixed = false }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className={`${isFixed ? 'fixed' : 'sticky'} top-0 w-full bg-background/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm z-30 border-b border-border`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {isAuthenticated && !showMenu && (
              <Button
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            <Link to="/" className="flex items-center gap-2 ml-2 md:ml-0">
              <img src="/logo.svg" alt="App Logo" className="h-7 w-7" />
              <span className="font-semibold text-lg text-foreground">
                AppTemplate
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          {showMenu && (
            <>
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="ml-2"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-4">
                {isAuthenticated && (
                  <>
                    <NavLink to="/dashboard" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      <div className="flex items-center">
                        <HomeIcon className="h-4 w-4 mr-1" />
                        Dashboard
                      </div>
                    </NavLink>
                    <NavLink to="/notes" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Notes
                      </div>
                    </NavLink>
                    {user?.role === 'admin' && (
                      <NavLink to="/admin/blog" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          Blog Admin
                        </div>
                      </NavLink>
                    )}
                    <NavLink to="/test" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      <div className="flex items-center">
                        <TestTube className="h-4 w-4 mr-1" />
                        Test Suite
                      </div>
                    </NavLink>
                  </>
                )}
                <NavLink to="/blog" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Blog
                  </div>
                </NavLink>
                <NavLink to="/examples" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    Examples
                  </div>
                </NavLink>
              </nav>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isAuthenticated && <AccountSelector />}

            {isAuthenticated ? (
              <>
                <Link to="/notes/new">
                  <Button variant="ghost" size="icon" aria-label="New Note">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="relative">
                  <Button variant="ghost" size="icon" onClick={toggleUserMenu} aria-label="User Menu">
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground uppercase text-xs">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  </Button>
                  {userMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-popover ring-1 ring-border focus:outline-none">
                      <div className="px-4 py-2 text-sm text-popover-foreground border-b border-border">
                        <p className="font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        {user?.role === 'admin' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                            Admin
                          </span>
                        )}
                        </div>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center" onClick={() => setUserMenuOpen(false)}>
                        <User className="h-4 w-4 mr-2" /> Profile
                        </Link>
                        <Link to="/settings" className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center" onClick={() => setUserMenuOpen(false)}>
                        <Settings className="h-4 w-4 mr-2" /> Settings
                        </Link>
                        <button
                        onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="block w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center cursor-pointer"
                        >
                        <LogOut className="h-4 w-4 mr-2" /> Sign out
                        </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login">
                <Button variant="default" size="sm">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
