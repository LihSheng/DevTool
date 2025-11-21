import React, { useState } from 'react';
import { ArrowRightLeft, Copy, Trash2, ArrowRight, ArrowLeft, AlertCircle, Check } from 'lucide-react';

const JsonToPhp: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'jsonToPhp' | 'phpToJson'>('jsonToPhp');
  const [copied, setCopied] = useState(false);

  const convertJsonToPhp = (json: string): string => {
    try {
      const obj = JSON.parse(json);
      
      const toPhp = (data: any, indentLevel: number = 0): string => {
        const indent = '    '.repeat(indentLevel);
        
        if (data === null) return 'null';
        if (typeof data === 'boolean') return data ? 'true' : 'false';
        if (typeof data === 'number') return String(data);
        if (typeof data === 'string') return `'${data.replace(/'/g, "\\'")}'`;
        
        if (Array.isArray(data)) {
          if (data.length === 0) return '[]';
          const items = data.map(item => `${indent}    ${toPhp(item, indentLevel + 1)}`).join(',\n');
          return `[\n${items}\n${indent}]`;
        }
        
        if (typeof data === 'object') {
          const keys = Object.keys(data);
          if (keys.length === 0) return '[]';
          const items = keys.map(key => {
            return `${indent}    '${key}' => ${toPhp(data[key], indentLevel + 1)}`;
          }).join(',\n');
          return `[\n${items}\n${indent}]`;
        }
        
        return 'null';
      };

      return toPhp(obj);
    } catch (e) {
      throw new Error('Invalid JSON input');
    }
  };

  const convertPhpToJson = (php: string): string => {
    try {
      // Basic PHP array to JSON conversion
      // This is a simplified approach and might not cover all PHP syntax
      let jsonStr = php
        .replace(/^\[/, '{')
        .replace(/\]$/, '}')
        .replace(/=>/g, ':')
        .replace(/'/g, '"')
        // Handle numeric arrays which in PHP are just [] but in JSON are []
        // This regex is tricky, a full parser would be better but complex
        // For now, we'll rely on a simple heuristic or just basic replacement
        // Actually, let's try to make it valid JSON
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']');

      // If it looks like a list (numeric keys or just values), wrap in []
      // If it looks like an object (string keys), wrap in {}
      // This is hard to do with regex.
      // Let's try a different approach:
      // 1. Replace 'key' => value with "key": value
      // 2. Replace [...] with {...} or [...] depending on context?
      // PHP short array syntax [] is ambiguous without context (list vs map)
      
      // Fallback: simple replacement for now, user might need to tweak
      const cleaned = php
        .replace(/=>/g, ':')
        .replace(/'/g, '"');
        
      // Try to parse it as JSON. If it fails, it might be because PHP uses [] for both
      // We can't easily distinguish without a parser.
      // Let's just return the cleaned string and let the user fix it if needed,
      // or try to parse it.
      
      const parsed = JSON.parse(cleaned);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // If simple parsing fails, just return the string with replacements
      // and let the user know it might be imperfect
      throw new Error('Could not automatically convert PHP to JSON. Please ensure syntax is close to JSON.');
    }
  };

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      let result = '';
      if (mode === 'jsonToPhp') {
        result = convertJsonToPhp(input);
      } else {
        result = convertPhpToJson(input);
      }
      setOutput(result);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setOutput('');
    }
  };

  const handleSwap = () => {
    setMode(mode === 'jsonToPhp' ? 'phpToJson' : 'jsonToPhp');
    setInput(output);
    setOutput(input);
    setError(null);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-orange-500">🔄</span> JSON ⇄ PHP Array
        </h2>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col h-full">
          <div className="mb-2 flex justify-between items-center">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              {mode === 'jsonToPhp' ? 'JSON Input' : 'PHP Array Input'}
            </label>
            <div className="flex gap-2">
              <button 
                onClick={handleConvert}
                className="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors flex items-center gap-1"
              >
                Convert <ArrowRight size={14} />
              </button>
              <button 
                onClick={handleSwap}
                className="p-1.5 text-gray-500 hover:text-blue-500 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                title="Swap Direction"
              >
                <ArrowRightLeft size={16} />
              </button>
              <button 
                onClick={() => { setInput(''); setOutput(''); setError(null); }}
                className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                title="Clear"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'jsonToPhp' ? '{"name": "John", "age": 30}' : "['name' => 'John', 'age' => 30]"}
            className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
          />
        </div>

        {/* Output Section */}
        <div className="flex flex-col h-full">
          <div className="mb-2 flex justify-between items-center">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {mode === 'jsonToPhp' ? 'PHP Array Output' : 'JSON Output'}
            </label>
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

export default JsonToPhp;
