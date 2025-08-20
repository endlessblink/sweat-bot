import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Test from './pages/Test';

/**
 * SweatBot App - Vite Version
 * 
 * Clean React Router setup with no SSR complications!
 * No cache issues, instant hot reload, and perfect assistant-ui compatibility.
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Test />} />
        {/* Demo route can be added later */}
        <Route path="/demo" element={<div className="p-8 text-center"><h1>Demo coming soon!</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App;
