import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/'); // Redirect to home page
  };

  return (
    <nav className="bg-blue-600 p-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-white text-xl font-bold">RentWise</Link>
        <ul className="flex space-x-4 text-white">
          <li><Link to="/" className="hover:underline">Home</Link></li>
          <li><Link to="/properties" className="hover:underline">Properties</Link></li>
          <li><Link to="/dashboard" className="hover:underline">Dashboard</Link></li>
          {isLoggedIn ? (
            <li>
              <button onClick={handleLogout} className="hover:underline">Logout</button>
            </li>
          ) : (
            <>
              <li><Link to="/login" className="hover:underline">Login</Link></li>
              <li><Link to="/register" className="hover:underline">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;