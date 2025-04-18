import { Link } from 'react-router-dom';
import { Heart, Settings, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-lg shadow-sm">
                <span className="text-white text-xs font-bold">SD</span>
              </div>
              <span className="text-cyan-800 font-bold text-lg">Sentinel<span className="text-orange-500">Detectives</span></span>
            </Link>
            <p className="text-gray-500 text-sm mt-2">Your truth guardians, at your service.</p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="flex items-center gap-4 mb-2">
              <Link to="/settings" className="text-gray-500 hover:text-cyan-600 transition-colors">
                <Settings size={18} />
              </Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-cyan-600 transition-colors">
                <Github size={18} />
              </a>
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              Made with <Heart size={14} className="text-red-500 fill-red-500" /> © {new Date().getFullYear()} SentinelDetectives
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;