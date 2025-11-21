import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileJson, 
  Database, 
  Server, 
  ArrowRightLeft, 
  FileText, 
  Code, 
  Moon, 
  Sun, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTool: string;
  onToolChange: (tool: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTool, onToolChange }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'json-formatter', label: 'JSON Formatter', icon: FileJson },
    { id: 'querylog-analyzer', label: 'QueryLog Analyzer', icon: Database },
    { id: 'vm-connector', label: 'VM File Connector', icon: Server },
    { id: 'json-to-php', label: 'JSON to PHP Array', icon: ArrowRightLeft },
    { id: 'markdown-editor', label: 'Markdown Editor', icon: FileText },
    { id: 'html-formatter', label: 'HTML Formatter', icon: Code },
  ];

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
      {/* Sidebar */}
      <aside 
        className={`
          relative flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2 overflow-hidden">
              <span className="text-2xl">🛠️</span>
              <span className="font-bold text-lg whitespace-nowrap">Dev Tools</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-full flex justify-center">
              <span className="text-2xl">🛠️</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onToolChange(item.id)}
              className={`
                w-full flex items-center px-3 py-3 rounded-lg transition-colors
                ${activeTool === item.id 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}
                ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}
              `}
              title={sidebarCollapsed ? item.label : ''}
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer / Dark Mode Toggle */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`
              w-full flex items-center justify-center p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
              ${sidebarCollapsed ? '' : 'space-x-2'}
            `}
            title="Toggle Dark Mode"
          >
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
            {!sidebarCollapsed && <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
