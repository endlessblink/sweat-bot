import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import VoltTest from './pages/VoltTest';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import PointsManagementPage from './pages/PointsManagementPage';
import AudioTest from './pages/AudioTest';
// Initialize mobile debugger for console log interception
// import './utils/mobileDebugger'; // Disabled for clean UI testing

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
        <Route path="/audio-test" element={<AudioTest />} />
      </Routes>
    </Router>
  );
}

export default App;
