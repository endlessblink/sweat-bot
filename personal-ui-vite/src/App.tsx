import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import VoltTest from './pages/VoltTest';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import PointsManagementPage from './pages/PointsManagementPage';
import PointsTestPage from './pages/PointsTestPage';

/**
 * SweatBot App - Vite Version with Volt Agent
 *
 * Hybrid architecture: TypeScript AI orchestration with Python backend
 * Main chat interface at root, Volt test page for debugging
 * Profile wizard for personalized workout recommendations
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/volt" element={<VoltTest />} />
        <Route path="/points" element={<PointsManagementPage />} />
        <Route path="/points-test" element={<PointsTestPage />} />
      </Routes>
    </Router>
  );
}

export default App;
