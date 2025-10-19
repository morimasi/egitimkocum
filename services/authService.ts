import axios from 'axios';

const API_BASE_URL = '/api';

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Set token to localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

// Create axios instance with auth interceptor
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (token expired or invalid)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      removeToken();
      window.location.href = '/'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'coach' | 'student' | 'parent';
  profilePicture: string;
}

export interface AuthResponse {
  user: any;
  token: string;
}

// Login user
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/login`, credentials);
  const { user, token } = response.data;
  setToken(token);
  return { user, token };
};

// Register user
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/register`, data);
  const { user, token } = response.data;
  setToken(token);
  return { user, token };
};

// Verify token and get current user
export const verifyToken = async (): Promise<any> => {
  const response = await apiClient.get('/auth/verify');
  return response.data;
};

// Logout user
export const logout = (): void => {
  removeToken();
};
