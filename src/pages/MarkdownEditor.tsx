import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Import highlight.js styles
import { Copy, Trash2, Eye, EyeOff, Download, Check } from 'lucide-react';

const MarkdownEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>('# Hello World\n\nWrite your **markdown** here!');
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);

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
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-gray-700 dark:text-gray-300">📝</span> Markdown Editor
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>

      <div className={`flex-1 grid gap-4 min-h-0 ${showPreview ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor Section */}
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2">Editor</span>
            <div className="flex gap-1">
              <button 
                onClick={handleCopy}
                className={`p-1.5 rounded-md transition-colors ${
                  copied ? 'text-green-500' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
                title="Copy Markdown"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <button 
                onClick={() => setMarkdown('')}
                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Clear"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type your markdown here..."
            className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 outline-none resize-none"
          />
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2">Preview</span>
            </div>
            <div className="flex-1 overflow-y-auto p-8 prose dark:prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[rehypeHighlight]}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
