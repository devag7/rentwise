import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
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
        <ul className={`absolute top-full left-0 rounded-md w-full bg-gray-800 md:static md:w-auto md:flex space-y-4 md:space-y-0 md:space-x-6 text-lg transition-all duration-300 ${isOpen ? 'block' : 'hidden md:flex'}`}>
          <li>
            <NavLink to="/" className="block px-6 py-3 hover:bg-gray-700 rounded-md">Home</NavLink>
          </li>
          <li>
            <NavLink to="/properties" className="block px-6 py-3 hover:bg-gray-700 rounded-md">Properties</NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" className="block px-6 py-3 hover:bg-gray-700 rounded-md">Dashboard</NavLink>
          </li>
          {isLoggedIn ? (
            <li>
              <button onClick={handleLogout} className="bg-red-500 px-6 py-3 rounded-md hover:bg-red-600 transition">Logout</button>
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
