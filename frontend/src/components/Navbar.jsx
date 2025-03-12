import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Check auth status whenever component mounts or location changes
  // This ensures navbar updates after login/logout or navigation
  useEffect(() => {
    checkAuthStatus();
  }, [location]); // Re-check when location changes

  // Function to check if user is logged in and get their role
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsLoggedIn(false);
      setUserRole(null);
      return;
    }
    
    // User has token, verify it and get user info
    axios.get('http://localhost:3000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => {
      setIsLoggedIn(true);
      setUserRole(res.data.role);
    })
    .catch(err => {
      console.error("Auth verification failed:", err);
      // Token is invalid, clear it
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setUserRole(null);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole(null);
    navigate('/');
  };

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-lg relative">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <NavLink to="/" className="text-2xl font-extrabold tracking-wide">RentWise</NavLink>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <i className="ri-close-line text-2xl"></i> : <i className="ri-menu-line text-2xl"></i>}
          </button>
        </div>
        <ul className={`absolute top-full left-0 rounded-md w-full bg-gray-800 md:static md:w-auto md:flex space-y-4 md:space-y-0 md:space-x-6 text-lg transition-all duration-300 z-50 ${isOpen ? 'block' : 'hidden md:flex'}`}>
          <li>
            <NavLink to="/" className="block px-6 py-3 hover:bg-gray-700 rounded-md">Home</NavLink>
          </li>
          <li>
            <NavLink to="/properties" className="block px-6 py-3 hover:bg-gray-700 rounded-md">Properties</NavLink>
          </li>
          
          {/* Only show dashboard link if user is a landlord */}
          {isLoggedIn && userRole === 'landlord' && (
            <li>
              <NavLink to="/dashboard" className="block px-6 py-3 hover:bg-gray-700 rounded-md">Dashboard</NavLink>
            </li>
          )}
          
          {/* Show login/register or logout based on auth state */}
          {isLoggedIn ? (
            <li>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 px-6 py-3 rounded-md hover:bg-red-600 transition"
              >
                Logout
              </button>
            </li>
          ) : (
            <>
              <li>
                <NavLink to="/login" className="block px-6 py-3 bg-blue-500 rounded-md hover:bg-blue-600 transition">Login</NavLink>
              </li>
              <li>
                <NavLink to="/register" className="block px-6 py-3 bg-green-500 rounded-md hover:bg-green-600 transition">Register</NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;