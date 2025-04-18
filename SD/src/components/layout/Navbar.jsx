import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Search, Shield, BookOpen } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white shadow-md py-2' 
          : 'bg-transparent backdrop-blur-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-cyan-800">
          <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-lg shadow-md">
            <span className="text-white font-bold">S</span>
          </div>
          <span>Sentinel<span className="text-orange-500">AI</span></span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" label="Home" icon={<Home size={18} />} />
          <NavLink to="/batman" label="Batman" icon={<Shield size={18} />} />
          <NavLink to="/sherlock" label="Sherlock" icon={<Search size={18} />} />
          <NavLink to="/yoda" label="Yoda" icon={<BookOpen size={18} />} />
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="flex md:hidden text-gray-700 hover:text-cyan-500 focus:outline-none transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div 
        className={`fixed inset-0 z-40 bg-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden pt-20`}
      >
        <div className="flex flex-col p-4 space-y-2">
          <MobileNavLink to="/" label="Home" icon={<Home size={20} />} />
          <MobileNavLink to="/batman" label="Batman" icon={<Shield size={20} />} />
          <MobileNavLink to="/sherlock" label="Sherlock" icon={<Search size={20} />} />
          <MobileNavLink to="/yoda" label="Yoda" icon={<BookOpen size={20} />} />
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, label, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-all ${
        isActive 
          ? 'bg-cyan-50 text-cyan-700 font-medium' 
          : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

const MobileNavLink = ({ to, label, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
        isActive 
          ? 'bg-cyan-50 text-cyan-700 font-medium' 
          : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      {icon}
      <span className="text-lg">{label}</span>
    </Link>
  );
};

export default Navbar;