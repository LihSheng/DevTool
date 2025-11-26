import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import JsonFormatter from './pages/JsonFormatter';
import QueryLogAnalyzer from './pages/QueryLogAnalyzer';
import VmConnector from './pages/VmConnector';
import JsonToPhp from './pages/JsonToPhp';
import MarkdownEditor from './pages/MarkdownEditor';
import HtmlFormatter from './pages/HtmlFormatter';
import ApiTester from './pages/ApiTester';

function App() {
  const [activeTool, setActiveTool] = useState('dashboard');

  return (
    <Layout activeTool={activeTool} onToolChange={setActiveTool}>
      {activeTool === 'dashboard' && <Dashboard onNavigate={setActiveTool} />}
      {activeTool === 'json-formatter' && <JsonFormatter />}
      {activeTool === 'querylog-analyzer' && <QueryLogAnalyzer />}
      {activeTool === 'vm-connector' && <VmConnector />}
      {activeTool === 'json-to-php' && <JsonToPhp />}
      {activeTool === 'markdown-editor' && <MarkdownEditor />}
      {activeTool === 'html-formatter' && <HtmlFormatter />}
      {activeTool === 'api-tester' && <ApiTester />}
    </Layout>
  );
}

export default App;
