import React, { useState } from 'react';
import { Code, Trash2, Copy, Check, AlertCircle, Minimize, Maximize } from 'lucide-react';

const HtmlFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const beautifyHtml = (html: string) => {
    let formatted = '';
    let indent = 0;
    const tab = '    ';
    
    // Remove extra whitespace and split by tags
    const cleanHtml = html.replace(/>\s+</g, '><').trim();
    const tokens = cleanHtml.split(/(<[^>]+>)/g).filter(token => token.trim());
    
    tokens.forEach(token => {
      if (token.startsWith('</')) {
        // Closing tag
        indent = Math.max(0, indent - 1);
        formatted += tab.repeat(indent) + token + '\n';
      } else if (token.startsWith('<')) {
        // Opening or self-closing tag
        formatted += tab.repeat(indent) + token + '\n';
        
        // Check if it's not self-closing and not a void element
        if (!token.endsWith('/>') && !isVoidElement(token)) {
          indent++;
        }
      } else {
        // Text content
        const trimmed = token.trim();
        if (trimmed) {
          formatted += tab.repeat(indent) + trimmed + '\n';
        }
      }
    });
    
    return formatted.trim();
  };

  const minifyHtml = (html: string) => {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<!--.*?-->/g, '')
      .trim();
  };

  const isVoidElement = (tag: string) => {
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
                         'link', 'meta', 'param', 'source', 'track', 'wbr'];
    const tagName = tag.match(/<(\w+)/);
    return tagName && voidElements.includes(tagName[1].toLowerCase());
  };

  const validateHtml = (html: string) => {
    const errors: string[] = [];
    const tagStack: string[] = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      if (fullTag.startsWith('</')) {
        // Closing tag
        if (tagStack.length === 0) {
          errors.push(`Unexpected closing tag: ${fullTag}`);
        } else {
          const lastTag = tagStack.pop();
          if (lastTag !== tagName) {
            errors.push(`Mismatched tags: expected </${lastTag}>, found ${fullTag}`);
          }
        }
      } else if (!fullTag.endsWith('/>') && !isVoidElement(fullTag)) {
        // Opening tag (not self-closing or void)
        tagStack.push(tagName);
      }
    }

    if (tagStack.length > 0) {
      tagStack.forEach(tag => {
        errors.push(`Unclosed tag: <${tag}>`);
      });
    }

    return errors;
  };

  const handleFormat = () => {
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      const formatted = beautifyHtml(input);
      setOutput(formatted);
      setError(null);
    } catch (err) {
      setError('Error formatting HTML');
    }
  };

  const handleMinify = () => {
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      const minified = minifyHtml(input);
      setOutput(minified);
      setError(null);
    } catch (err) {
      setError('Error minifying HTML');
    }
  };

  const handleValidate = () => {
    if (!input.trim()) {
      setError('Please enter HTML to validate');
      return;
    }
    const errors = validateHtml(input);
    if (errors.length === 0) {
      alert('HTML is valid!');
      setError(null);
    } else {
      setError(`Found ${errors.length} issue(s):\n${errors.join('\n')}`);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-red-500">🌐</span> HTML Formatter
        </h2>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col h-full">
          <div className="mb-2 flex justify-between items-center">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Raw HTML</label>
            <div className="flex gap-2">
              <button 
                onClick={handleFormat}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
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
                onClick={() => { setInput(''); setOutput(''); setError(null); }}
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
            placeholder="Paste your HTML here..."
            className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
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
              <div className="absolute bottom-4 left-4 right-4 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-3 rounded-lg text-sm flex items-start gap-2 whitespace-pre-wrap">
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

export default HtmlFormatter;
