import React from 'react';
import { 
  LayoutDashboard, 
  FileJson, 
  Database, 
  Server, 
  ArrowRightLeft, 
  FileText, 
  Code,
  Clock
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tool: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const tools = [
    { id: 'json-formatter', label: 'JSON Formatter', icon: FileJson, desc: 'Format, validate, and minify JSON data' },
    { id: 'querylog-analyzer', label: 'QueryLog Analyzer', icon: Database, desc: 'Analyze Laravel database queries and performance' },
    { id: 'vm-connector', label: 'VM File Connector', icon: Server, desc: 'Browse and preview files from remote servers' },
    { id: 'json-to-php', label: 'JSON ⇄ PHP Array', icon: ArrowRightLeft, desc: 'Convert between JSON and PHP array syntax' },
    { id: 'markdown-editor', label: 'Markdown Editor', icon: FileText, desc: 'Write and preview markdown with live rendering' },
    { id: 'html-formatter', label: 'HTML Formatter', icon: Code, desc: 'Format, minify, and validate HTML code' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Welcome to Dev Tools
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Your all-in-one developer utilities suite
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Uses</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <Code size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Most Used Tool</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">Never</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Last Activity</div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <span>🚀</span>
          <span>Quick Access</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className="group flex flex-col text-left bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 rounded-lg transition-colors">
                  <tool.icon size={24} />
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  0 uses
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-500 transition-colors">
                {tool.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tool.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 p-6 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center space-x-2">
          <span>💡</span>
          <span>Quick Tips</span>
        </h3>
        <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
          <li className="flex items-start space-x-2">
            <span className="mt-1">•</span>
            <span>Use <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-800 font-mono text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-800 font-mono text-xs">Enter</kbd> in JSON/PHP converter for quick conversion</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="mt-1">•</span>
            <span>QueryLog Analyzer supports both JSON and PHP array formats</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="mt-1">•</span>
            <span>Bookmark frequently used VM paths for quick access</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
