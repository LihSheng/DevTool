import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import JsonFormatter from './pages/JsonFormatter';
import QueryLogAnalyzer from './pages/QueryLogAnalyzer';
import VmConnector from './pages/VmConnector';
import JsonToPhp from './pages/JsonToPhp';
import MarkdownEditor from './pages/MarkdownEditor';
import HtmlFormatter from './pages/HtmlFormatter';

function App() {
  const [activeTool, setActiveTool] = useState('dashboard');

  const renderTool = () => {
    switch (activeTool) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTool} />;
      case 'json-formatter':
        return <JsonFormatter />;
      case 'querylog-analyzer':
        return <QueryLogAnalyzer />;
      case 'vm-connector':
        return <VmConnector />;
      case 'json-to-php':
        return <JsonToPhp />;
      case 'markdown-editor':
        return <MarkdownEditor />;
      case 'html-formatter':
        return <HtmlFormatter />;
      default:
        return <Dashboard onNavigate={setActiveTool} />;
    }
  };

  return (
    <Layout activeTool={activeTool} onToolChange={setActiveTool}>
      {renderTool()}
    </Layout>
  );
}

export default App;
