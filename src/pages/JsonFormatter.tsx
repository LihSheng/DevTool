import React, { useState } from 'react';
import { Copy, Trash2, Check, AlertCircle, Minimize, Maximize } from 'lucide-react';

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError(null);
        return;
      }
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setOutput('');
    }
  };

  const handleMinify = () => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError(null);
        return;
      }
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setOutput('');
    }
  };

  const handleValidate = () => {
    try {
      if (!input.trim()) {
        setError('Please enter JSON to validate');
        return;
      }
      JSON.parse(input);
      setError(null);
      alert('Valid JSON!');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-500">📋</span> JSON Formatter
        </h2>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col h-full">
          <div className="mb-2 flex justify-between items-center">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Raw JSON</label>
            <div className="flex gap-2">
              <button 
                onClick={handleFormat}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Format
              </button>
              <button 
                onClick={handleMinify}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Minify
              </button>
              <button 
                onClick={handleValidate}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Validate
              </button>
              <button 
                onClick={handleClear}
                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                title="Clear"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here..."
            className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Output Section */}
        <div className="flex flex-col h-full">
          <div className="mb-2 flex justify-between items-center">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Output</label>
            <button 
              onClick={handleCopy}
              disabled={!output}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
                copied 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="relative flex-1">
            <textarea
              readOnly
              value={output}
              className={`flex-1 w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none resize-none ${
                error ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;
