import React, { useState, useMemo } from 'react';
import { Search, Trash2, Clock, Database, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface QueryLog {
  query: string;
  bindings: any[];
  time: number;
}

const QueryLogAnalyzer: React.FC = () => {
  const [input, setInput] = useState('');
  const [queries, setQueries] = useState<QueryLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBindings, setShowBindings] = useState(true);
  const [sortByTime, setSortByTime] = useState(true);

  const analyzeQueries = () => {
    if (!input.trim()) {
      setError('Please enter QueryLog data');
      return;
    }

    try {
      let parsedData;
      // Try parsing as JSON first
      try {
        parsedData = JSON.parse(input);
      } catch (e) {
        // If JSON fails, try to parse PHP array syntax (basic support)
        // This is a simplified parser and might need more robust logic for complex PHP arrays
        const phpArrayString = input
          .replace(/^\[/, '')
          .replace(/\]$/, '')
          .replace(/=>/g, ':')
          .replace(/'/g, '"');
        parsedData = JSON.parse(`[${phpArrayString}]`);
      }

      if (!Array.isArray(parsedData)) {
        throw new Error('Input must be an array of queries');
      }

      setQueries(parsedData);
      setError(null);
    } catch (err) {
      setError('Failed to parse QueryLog data. Ensure it is valid JSON or a compatible array format.');
      console.error(err);
    }
  };

  const filteredQueries = useMemo(() => {
    let result = [...queries];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(q => 
        q.query.toLowerCase().includes(lowerTerm) || 
        JSON.stringify(q.bindings).toLowerCase().includes(lowerTerm)
      );
    }

    if (sortByTime) {
      result.sort((a, b) => b.time - a.time);
    }

    return result;
  }, [queries, searchTerm, sortByTime]);

  const stats = useMemo(() => {
    const totalTime = queries.reduce((acc, q) => acc + q.time, 0);
    const avgTime = queries.length ? totalTime / queries.length : 0;
    const slowest = queries.length ? Math.max(...queries.map(q => q.time)) : 0;

    return {
      count: queries.length,
      totalTime: totalTime.toFixed(2),
      avgTime: avgTime.toFixed(2),
      slowest: slowest.toFixed(2)
    };
  }, [queries]);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-purple-500">📊</span> QueryLog Analyzer
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Input Section */}
        <div className="lg:col-span-1 flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-semibold">Input Data</h3>
            <div className="flex gap-2">
              <button 
                onClick={analyzeQueries}
                className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Analyze
              </button>
              <button 
                onClick={() => { setInput(''); setQueries([]); setError(null); }}
                className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                title="Clear"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 p-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste Laravel QueryLog array or JSON here..."
              className="w-full h-full p-3 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            />
          </div>
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border-t border-red-100 dark:border-red-900/30 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Queries</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.count}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Time</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTime}ms</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.avgTime}ms</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slowest</div>
              <div className="text-xl font-bold text-red-500">{stats.slowest}ms</div>
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search queries..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showBindings} 
                  onChange={(e) => setShowBindings(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Show Bindings</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={sortByTime} 
                  onChange={(e) => setSortByTime(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Sort by Time</span>
              </label>
            </div>
          </div>

          {/* Queries List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredQueries.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                {queries.length === 0 ? 'No queries analyzed yet' : 'No queries match your search'}
              </div>
            ) : (
              filteredQueries.map((q, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all">
                      {q.query}
                    </div>
                    <div className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${
                      q.time > 100 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      q.time > 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {q.time}ms
                    </div>
                  </div>
                  {showBindings && q.bindings && q.bindings.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 mb-1">Bindings:</div>
                      <div className="flex flex-wrap gap-2">
                        {q.bindings.map((b, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                            {typeof b === 'object' ? JSON.stringify(b) : String(b)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryLogAnalyzer;
