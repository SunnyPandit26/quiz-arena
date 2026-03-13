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


// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
    });
    return config;
  },
  (error) => Promise.reject(error)
);


// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);


export const authAPI = {
  login: async (username, password) => {
    if (!username || !password) {
      throw { success: false, message: 'Username and password required' };
    }
    const response = await api.post('/login', {
      username: username.trim(),
      password: password.trim()
    });
    return response.data;
  },


  register: async (newUsername, email, newPassword) => {
    const response = await api.post('/register', {
      newUsername: newUsername.trim(),
      email: email.trim().toLowerCase(),
      newPassword: newPassword.trim()
    });
    return response.data;
  },


  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },


  // ✅ CRITICAL FIX: Use /me instead of /profile
  getProfile: async () => {
    console.log('🔍 Fetching profile from /me...');
    const response = await api.get('/me');
    console.log('✅ Profile response:', response.data);
    return response.data;
  },


  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },


  checkAuth: async () => {
    try {
      const res = await authAPI.getProfile();
      return {
        success: true,
        isAuthenticated: res.success && res.authenticated,
        user: res.user
      };
    } catch (error) {
      return { success: false, isAuthenticated: false, user: null };
    }
  }
};

export default authAPI; 
