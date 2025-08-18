// src/services/api.js - COMPLETE VERSION
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      data: response.data,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Login function
  login: async (username, password) => {
    console.log('📝 Login attempt:', { username, password: '***' });
    
    // Validate inputs
    if (!username || !password) {
      throw {
        success: false,
        message: 'Username and password are required',
        missing: {
          username: !username,
          password: !password
        }
      };
    }
    
    try {
      const response = await api.post('/login', {
        username: username.trim(),
        password: password.trim()
      });
      
      console.log('✅ Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Login failed' };
    }
  },

  // Registration function - FIXED
  register: async (newUsername, email, newPassword) => {
    console.log('📤 Sending registration data:', { 
      newUsername, 
      email, 
      newPassword: newPassword ? '***' : 'MISSING' 
    });
    
    // Validate on frontend too
    if (!newUsername || !email || !newPassword) {
      throw {
        success: false,
        message: 'All fields are required on frontend',
        missing: {
          newUsername: !newUsername,
          email: !email,
          newPassword: !newPassword
        }
      };
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw {
        success: false,
        message: 'Please enter a valid email address'
      };
    }
    
    // Password strength check
    if (newPassword.length < 6) {
      throw {
        success: false,
        message: 'Password must be at least 6 characters long'
      };
    }
    
    try {
      const response = await api.post('/register', {
        newUsername: newUsername.trim(),
        email: email.trim().toLowerCase(),
        newPassword: newPassword.trim()
      });
      
      console.log('✅ Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Registration API error:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  // Logout function
  logout: async () => {
    console.log('📝 Logout attempt');
    try {
      const response = await api.post('/logout');
      console.log('✅ Logout successful');
      return response.data;
    } catch (error) {
      console.error('❌ Logout failed:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Logout failed' };
    }
  },

  // Get profile function
  getProfile: async () => {
    console.log('📝 Getting user profile');
    try {
      const response = await api.get('/profile');
      console.log('✅ Profile retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Profile fetch failed:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Failed to get profile' };
    }
  },

  // Google OAuth login
  googleLogin: () => {
    console.log('📝 Redirecting to Google OAuth');
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Test backend connection
  testConnection: async () => {
    try {
      console.log('🧪 Testing backend connection...');
      const response = await api.get('/');
      console.log('✅ Backend connection test successful');
      return { success: true, message: 'Backend is responsive' };
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      throw { success: false, message: 'Cannot connect to backend' };
    }
  },

  // Get all available routes (for debugging)
  getRoutes: async () => {
    try {
      console.log('🧪 Getting available routes...');
      const response = await api.get('/debug/routes');
      console.log('✅ Routes retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get routes:', error);
      throw error.response?.data || { success: false, message: 'Failed to get routes' };
    }
  },

  // Test body parsing (for debugging)
  testBodyParsing: async (testData) => {
    try {
      console.log('🧪 Testing body parsing with data:', testData);
      const response = await api.post('/test-body', testData);
      console.log('✅ Body parsing test successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Body parsing test failed:', error);
      throw error.response?.data || { success: false, message: 'Body parsing test failed' };
    }
  },

  // Check authentication status
  checkAuth: async () => {
    try {
      console.log('🔍 Checking authentication status...');
      const response = await api.get('/profile');
      return {
        success: true,
        isAuthenticated: true,
        user: response.data.user
      };
    } catch (error) {
      console.log('🔍 User not authenticated');
      return {
        success: false,
        isAuthenticated: false,
        user: null
      };
    }
  }
};

// Export default for easier imports
export default authAPI;

// Helper function to handle API errors
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    console.error('API Error Response:', error.response.data);
    return error.response.data;
  } else if (error.request) {
    // Request made but no response received
    console.error('API Error Request:', error.request);
    return {
      success: false,
      message: 'No response from server. Please check your connection.'
    };
  } else {
    // Something else happened
    console.error('API Error:', error.message);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred'
    };
  }
};

// Helper function to validate email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate password strength
export const validatePassword = (password) => {
  return {
    isValid: password && password.length >= 6,
    message: password ? 
      (password.length < 6 ? 'Password must be at least 6 characters long' : 'Password is valid') :
      'Password is required'
  };
};
