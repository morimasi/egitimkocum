import { getToken, setToken, removeToken, login, register } from '../services/authService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth Service', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should set token to localStorage', () => {
      const token = 'test-token-123';
      setToken(token);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', token);
    });

    it('should get token from localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('test-token-123');
      const token = getToken();
      expect(token).toBe('test-token-123');
      expect(localStorage.getItem).toHaveBeenCalledWith('authToken');
    });

    it('should remove token from localStorage', () => {
      removeToken();
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('Login', () => {
    it('should login user and store token', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          token: 'jwt-token-123'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await login({ email: 'test@example.com', password: 'password123' });

      expect(result.user).toEqual(mockResponse.data.user);
      expect(result.token).toBe('jwt-token-123');
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'jwt-token-123');
    });

    it('should throw error on failed login', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(login({ email: 'wrong@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('Register', () => {
    it('should register user and store token', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', name: 'New User', email: 'new@example.com', role: 'student' },
          token: 'jwt-token-456'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const registerData = {
        id: '1',
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'student' as const,
        profilePicture: 'avatar.jpg'
      };

      const result = await register(registerData);

      expect(result.user).toEqual(mockResponse.data.user);
      expect(result.token).toBe('jwt-token-456');
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'jwt-token-456');
    });
  });
});
