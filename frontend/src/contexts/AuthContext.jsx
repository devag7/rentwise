import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context with default values to avoid null errors
export const AuthContext = createContext({
  isAuthenticated: false,
  userRole: null,
  userId: null,
  isLoading: true,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on component mount
    const checkAuthState = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('http://localhost:3000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data) {
            setIsAuthenticated(true);
            setUserRole(response.data.role);
            setUserId(response.data.user_id);
          } else {
            // Invalid token or response
            logout();
          }
        } catch (error) {
          console.error('Auth check error:', error);
          logout();
        }
      }
      setIsLoading(false);
    };
    
    checkAuthState();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email); // Debug log
      
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password
      });
      
      console.log('Login response:', response.data); // Debug log
      
      const { token, userId, role } = response.data;
      
      if (!token) {
        console.error('No token received in login response');
        return { success: false, message: 'Authentication failed: No token received' };
      }
      
      localStorage.setItem('token', token);
      
      setIsAuthenticated(true);
      setUserRole(role);
      setUserId(userId || response.data.user_id); // Try both field names
      
      return { success: true, role };
    } catch (error) {
      console.error('Login error details:', error);
      
      // More detailed error handling
      if (error.response) {
        // Server responded with a non-2xx status
        console.error('Server error:', error.response.data);
        return { 
          success: false, 
          message: error.response.data.error || 'Invalid credentials. Please try again.'
        };
      } else if (error.request) {
        // Request made but no response received
        console.error('No response from server');
        return { success: false, message: 'Server not responding. Please try again later.' };
      } else {
        // Error setting up the request
        console.error('Request setup error:', error.message);
        return { success: false, message: 'Connection error. Please check your network.' };
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
  };

  const authContextValue = {
    isAuthenticated,
    userRole,
    userId,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};