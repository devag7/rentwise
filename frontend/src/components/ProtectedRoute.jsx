import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

import PropTypes from 'prop-types';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, userRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-800 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-cyan-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.string,
};

export default ProtectedRoute;
