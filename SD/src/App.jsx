import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import BatmanPage from './pages/BatmanPage';
import SherlockPage from './pages/SherlockPage';
import YodaPage from './pages/YodaPage';
import VisionPage from './pages/VisionPage';
import DebateRoom from './pages/DebateRoom';
import Chatbot from './components/Chatbot';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-r from-cyan-700 to-cyan-900">
        <div className="w-24 h-24 relative animate-pulse">
          <div className="absolute w-full h-full bg-white rounded-full opacity-70 animate-ping"></div>
          <div className="relative w-full h-full flex items-center justify-center">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 10C18.954 10 10 18.954 10 30C10 41.046 18.954 50 30 50C41.046 50 50 41.046 50 30C50 18.954 41.046 10 30 10Z" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M30 20C24.477 20 20 24.477 20 30C20 35.523 24.477 40 30 40C35.523 40 40 35.523 40 30C40 24.477 35.523 20 30 20Z" fill="white"/>
              <path d="M30 25C27.239 25 25 27.239 25 30C25 32.761 27.239 35 30 35C32.761 35 35 32.761 35 30C35 27.239 32.761 25 30 25Z" fill="#00BCD4"/>
            </svg>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Sentinel Detectives</h1>
        <p className="text-cyan-100 mt-2">Loading your truth guardians...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/batman" element={<BatmanPage />} />
            <Route path="/sherlock" element={<SherlockPage />} />
            <Route path="/yoda" element={<YodaPage />} />
            <Route path="/vision" element={<VisionPage />} />
            <Route path="/debate" element={<DebateRoom />} />
          </Routes>
        </main>
        <Footer />
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;