import React, { useState, useEffect } from 'react';
import { Server, Folder, File, ChevronRight, Star, RotateCw, Settings, Home, ArrowLeft, ArrowRight, Download, Copy, Check, AlertCircle } from 'lucide-react';

interface FileItem {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modified: string;
  permissions: number;
}

interface VmConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
}

const VmConnector: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [vmConfig, setVmConfig] = useState<VmConfig>({
    host: '',
    port: 22,
    username: '',
    password: ''
  });
  const [useDefaults, setUseDefaults] = useState(true);
  const [history, setHistory] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    fetchDefaults();
    const savedBookmarks = localStorage.getItem('vm-bookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }, []);

  const fetchDefaults = async () => {
    try {
      const res = await fetch('/api/vm-defaults');
      if (res.ok) {
        const data = await res.json();
        setVmConfig(prev => ({
          ...prev,
          host: data.host || '',
          port: data.port || 22,
          username: data.username || '',
        }));
        if (data.defaultFilePath) {
          // Optional: start at default path
        }
      }
    } catch (err) {
      console.error('Failed to fetch defaults', err);
    }
  };

  const browseDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    setFileContent(null);
    setSelectedFile(null);

    try {
      const res = await fetch('/api/vm-browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directoryPath: path,
          useDefaults,
          vmConfig: useDefaults ? undefined : vmConfig
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to browse directory');
      }

      setFiles(data.contents);
      setCurrentPath(data.path);
      
      // Update history if new path
      if (path !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (file: FileItem) => {
    if (!file.isFile) return;
    
    setLoading(true);
    setError(null);
    setSelectedFile(file);
    
    const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;

    try {
      const res = await fetch('/api/vm-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          useDefaults,
          vmConfig: useDefaults ? undefined : vmConfig
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to read file');
      }

      setFileContent(data.content);
    } catch (err) {
      setError((err as Error).message);
      setFileContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    browseDirectory(path);
  };

  const handleHistoryBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      browseDirectory(history[newIndex]);
    }
  };

  const handleHistoryForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      browseDirectory(history[newIndex]);
    }
  };

  const toggleBookmark = () => {
    let newBookmarks;
    if (bookmarks.includes(currentPath)) {
      newBookmarks = bookmarks.filter(b => b !== currentPath);
    } else {
      newBookmarks = [...bookmarks, currentPath];
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('vm-bookmarks', JSON.stringify(newBookmarks));
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-green-500">🖥️</span> VM File Connector
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
            <span className={`w-2 h-2 rounded-full ${useDefaults ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className="text-gray-600 dark:text-gray-300">
              {useDefaults ? 'Default Config' : 'Custom Config'}
            </span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg border transition-colors ${
              showSettings 
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Host</label>
            <input
              type="text"
              value={vmConfig.host}
              onChange={(e) => {
                setVmConfig({ ...vmConfig, host: e.target.value });
                setUseDefaults(false);
              }}
              placeholder="192.168.1.1"
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Port</label>
            <input
              type="number"
              value={vmConfig.port}
              onChange={(e) => {
                setVmConfig({ ...vmConfig, port: parseInt(e.target.value) || 22 });
                setUseDefaults(false);
              }}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Username</label>
            <input
              type="text"
              value={vmConfig.username}
              onChange={(e) => {
                setVmConfig({ ...vmConfig, username: e.target.value });
                setUseDefaults(false);
              }}
              placeholder="root"
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Password</label>
            <input
              type="password"
              value={vmConfig.password || ''}
              onChange={(e) => {
                setVmConfig({ ...vmConfig, password: e.target.value });
                setUseDefaults(false);
              }}
              placeholder="••••••"
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="lg:col-span-4 flex justify-end gap-2">
            <button
              onClick={() => { setUseDefaults(true); fetchDefaults(); }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* File Browser */}
        <div className="lg:col-span-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Navigation Bar */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-1">
              <button 
                onClick={handleHistoryBack} 
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <button 
                onClick={handleHistoryForward} 
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={currentPath}
                onChange={(e) => setCurrentPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && browseDirectory(currentPath)}
                className="w-full pl-8 pr-8 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Folder size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <button 
                onClick={toggleBookmark}
                className={`absolute right-2 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform ${
                  bookmarks.includes(currentPath) ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'
                }`}
              >
                <Star size={14} fill={bookmarks.includes(currentPath) ? "currentColor" : "none"} />
              </button>
            </div>
            <button 
              onClick={() => browseDirectory(currentPath)}
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Bookmarks Bar */}
          {bookmarks.length > 0 && (
            <div className="px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto scrollbar-hide">
              {bookmarks.map((b, i) => (
                <button
                  key={i}
                  onClick={() => browseDirectory(b)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md whitespace-nowrap hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                >
                  <Star size={10} fill="currentColor" />
                  {b.split('/').pop() || b}
                </button>
              ))}
            </div>
          )}

          {/* File List */}
          <div className="flex-1 overflow-y-auto p-2">
            {error ? (
              <div className="p-4 text-center text-red-500 text-sm flex flex-col items-center gap-2">
                <AlertCircle size={24} />
                <p>{error}</p>
                <button 
                  onClick={() => browseDirectory(currentPath)}
                  className="text-blue-500 hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {files.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => file.isDirectory ? handleNavigate(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`) : fetchFileContent(file)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                      selectedFile?.name === file.name 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {file.isDirectory ? (
                      <Folder size={16} className="text-yellow-500 shrink-0" fill="currentColor" />
                    ) : (
                      <File size={16} className="text-gray-400 shrink-0" />
                    )}
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {file.isDirectory ? '' : `${(file.size / 1024).toFixed(1)} KB`}
                    </span>
                  </button>
                ))}
                {files.length === 0 && !loading && (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    Folder is empty or not accessible
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* File Preview */}
        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2 overflow-hidden">
              <File size={16} className="text-gray-400" />
              <span className="font-medium text-sm truncate">
                {selectedFile ? selectedFile.name : 'No file selected'}
              </span>
            </div>
            {fileContent && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(fileContent);
                    // Show toast
                  }}
                  className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Copy content"
                >
                  <Copy size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : fileContent !== null ? (
              <textarea
                readOnly
                value={fileContent}
                className="w-full h-full p-4 font-mono text-sm bg-transparent border-none outline-none resize-none text-gray-800 dark:text-gray-200"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Server size={48} className="mb-4 opacity-20" />
                <p>Select a file to preview content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VmConnector;
