import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Copy, Trash2, Download, Check, FileText, Eye, Columns } from 'lucide-react';

type EditorMode = 'edit' | 'live' | 'preview';

const MarkdownEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>('# Hello World\n\nWrite your **markdown** here!\n\n## Features\n- Rich text editing\n- Live preview\n- Syntax highlighting\n\n```javascript\nconst greeting = "Hello, World!";\nconsole.log(greeting);\n```');
  const [mode, setMode] = useState<EditorMode>('live');
  const [copied, setCopied] = useState(false);

  // Detect and apply theme for markdown editor
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.setAttribute('data-color-mode', isDark ? 'dark' : 'light');
    
    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      document.documentElement.setAttribute('data-color-mode', isDark ? 'dark' : 'light');
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-gray-700 dark:text-gray-300">📝</span> Markdown Editor
        </h2>
        <div className="flex gap-2">
          {/* Mode Toggle Buttons */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button 
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                mode === 'edit' 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Raw Markdown Editor"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Raw</span>
            </button>
            <button 
              onClick={() => setMode('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                mode === 'live' 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Split View (Editor + Preview)"
            >
              <Columns size={16} />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button 
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                mode === 'preview' 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Preview Only"
            >
              <Eye size={16} />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          {/* Action Buttons */}
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              copied 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button 
            onClick={() => setMarkdown('')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 rounded-lg transition-colors"
            title="Clear"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor Section */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-full">
          <MDEditor
            value={markdown}
            onChange={(val) => setMarkdown(val || '')}
            preview={mode}
            height="100%"
            visibleDragbar={false}
            hideToolbar={mode === 'preview'}
            textareaProps={{
              placeholder: 'Type your markdown here...'
            }}
            previewOptions={{
              rehypePlugins: [],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
