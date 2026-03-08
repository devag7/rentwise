import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsLoggedIn(false);
        setUserRole(null);
        return;
      }

      axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          setIsLoggedIn(true);
          setUserRole(res.data.role);
        })
        .catch(err => {
          console.error("Auth verification failed:", err);
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          setUserRole(null);
        });
    };

    checkAuthStatus();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole(null);
    navigate('/');
  };

  return (
    <nav className="fixed w-full z-50 glass-dark text-white p-4 shadow-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <NavLink to="/" className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          RentWise
        </NavLink>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none hover:text-blue-400 transition">
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
        <ul className={`absolute top-full left-0 w-full bg-gray-900 md:bg-transparent md:static md:w-auto md:flex items-center space-y-4 md:space-y-0 md:space-x-8 text-lg font-medium transition-all duration-300 ${isOpen ? 'block p-6 border-b border-gray-700 shadow-2xl' : 'hidden md:flex'}`}>
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? "text-blue-400 block" : "hover:text-blue-400 transition block"}>Home</NavLink>
          </li>
          <li>
            <NavLink to="/properties" className={({ isActive }) => isActive ? "text-blue-400 block" : "hover:text-blue-400 transition block"}>Properties</NavLink>
          </li>

          {isLoggedIn && userRole === 'landlord' && (
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "text-blue-400 block" : "hover:text-blue-400 transition block"}>Dashboard</NavLink>
            </li>
          )}

          {isLoggedIn ? (
            <li>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white px-6 py-2 rounded-full transition-all duration-300 w-full md:w-auto"
              >
                Logout
              </button>
            </li>
          ) : (
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <li>
                <NavLink to="/login" className="block text-center px-6 py-2 border border-gray-600 rounded-full hover:border-gray-400 hover:bg-gray-800 transition-all duration-300">Login</NavLink>
              </li>
              <li>
                <NavLink to="/register" className="block text-center px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5">Register</NavLink>
              </li>
            </div>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;