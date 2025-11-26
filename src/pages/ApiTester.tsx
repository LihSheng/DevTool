import React, { useState, useEffect } from 'react';
import { Send, Plus, Trash2, Copy, Check, Clock, ChevronDown, ChevronRight } from 'lucide-react';

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestConfig {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers: Header[];
  queryParams: QueryParam[];
  body: string;
  timestamp?: number;
}

interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
}

const ApiTester: React.FC = () => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Header[]>([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RequestConfig[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'headers' | 'params' | 'body'>('headers');
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('api-tester-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (config: RequestConfig) => {
    const newHistory = [config, ...history.slice(0, 19)]; // Keep last 20
    setHistory(newHistory);
    localStorage.setItem('api-tester-history', JSON.stringify(newHistory));
  };

  const buildUrl = () => {
    const enabledParams = queryParams.filter(p => p.enabled && p.key);
    if (enabledParams.length === 0) return url;
    
    const params = new URLSearchParams();
    enabledParams.forEach(p => params.append(p.key, p.value));
    return `${url}?${params.toString()}`;
  };

  const sendRequest = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    const startTime = Date.now();

    try {
      const enabledHeaders = headers.filter(h => h.enabled && h.key);
      const headerObj: Record<string, string> = {};
      enabledHeaders.forEach(h => headerObj[h.key] = h.value);

      const finalUrl = buildUrl();
      
      const config: RequestInit = {
        method,
        headers: headerObj,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        config.body = body;
      }

      const res = await fetch(finalUrl, config);
      const endTime = Date.now();
      
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = res.headers.get('content-type');
      let data: string;
      
      if (contentType?.includes('application/json')) {
        const json = await res.json();
        data = JSON.stringify(json, null, 2);
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data,
        time: endTime - startTime
      });

      // Save to history
      saveToHistory({
        id: Date.now().toString(),
        name: `${method} ${url}`,
        method,
        url,
        headers: [...headers],
        queryParams: [...queryParams],
        body,
        timestamp: Date.now()
      });

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '', enabled: true }]);
  };

  const updateQueryParam = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newParams = [...queryParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setQueryParams(newParams);
  };

  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  const loadFromHistory = (config: RequestConfig) => {
    setMethod(config.method);
    setUrl(config.url);
    setHeaders(config.headers);
    setQueryParams(config.queryParams);
    setBody(config.body);
    setShowHistory(false);
  };

  const copyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-purple-500">🚀</span> API Endpoint Tester
        </h2>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Clock size={16} />
          History ({history.length})
          {showHistory ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    item.method === 'GET' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    item.method === 'POST' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    item.method === 'PUT' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    item.method === 'PATCH' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {item.method}
                  </span>
                  <span className="text-sm truncate">{item.url}</span>
                </div>
                {item.timestamp && (
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Request Panel */}
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
                placeholder="https://api.example.com/endpoint"
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={sendRequest}
                disabled={!url || loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
            {(['headers', 'params', 'body'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'headers' && ` (${headers.filter(h => h.enabled).length})`}
                {tab === 'params' && ` (${queryParams.filter(p => p.enabled).length})`}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'headers' && (
              <div className="space-y-2">
                {headers.map((header, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(idx, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => removeHeader(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addHeader}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Header
                </button>
              </div>
            )}

            {activeTab === 'params' && (
              <div className="space-y-2">
                {queryParams.map((param, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => updateQueryParam(idx, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => updateQueryParam(idx, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => updateQueryParam(idx, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => removeQueryParam(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addQueryParam}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Query Parameter
                </button>
              </div>
            )}

            {activeTab === 'body' && (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-full min-h-[200px] p-3 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            )}
          </div>
        </div>

        {/* Response Panel */}
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Response</span>
              {response && (
                <>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    response.status < 300 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    response.status < 400 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    response.status < 500 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-xs text-gray-500">{response.time}ms</span>
                </>
              )}
            </div>
            {response && (
              <button
                onClick={copyResponse}
                className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                <p className="font-medium mb-2">Request Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : response ? (
              <textarea
                readOnly
                value={response.data}
                className="w-full h-full p-4 font-mono text-sm bg-transparent border-none outline-none resize-none"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Send size={48} className="mb-4 opacity-20" />
                <p>Send a request to see the response</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTester;
