import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import VoltTest from './pages/VoltTest';

/**
 * SweatBot App - Vite Version with Volt Agent
 * 
 * Hybrid architecture: TypeScript AI orchestration with Python backend
 * Main chat interface at root, Volt test page for debugging
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/volt" element={<VoltTest />} />
      </Routes>
    </Router>
  );
}

export default App;
