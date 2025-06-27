import { API_URL } from '../config';
import { User, RegisterRequest, LoginRequest, AuthResponse } from '../types/auth';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          doctor_code: data.doctor_code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Register API error response:', result);
        throw new Error(result.detail || result.message || JSON.stringify(result) || 'Failed to register');
      }

      localStorage.setItem('token', result.access_token);
      return {
        token: result.access_token,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Login API Raw Result:', result);

      if (!response.ok) {
        console.error('Login API error response:', result);
        throw new Error(result.detail || result.message || JSON.stringify(result) || 'Failed to login');
      }

      if (result && result.token && typeof result.token.access_token === 'string' && result.token.access_token.length > 0 && result.user && result.user.id) {
        localStorage.setItem('token', result.token.access_token);
        return {
          token: result.token.access_token,
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            firstName: result.user.first_name,
            lastName: result.user.last_name,
          },
        };
      } else {
        console.error('Login successful but token (expected as result.token) or user details are missing/invalid in API response:', result);
        throw new Error('Login successful, but essential data (token or user info) was not provided by the server.');
      }
    } catch (error) {
      console.error('Login error in authService:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unknown error occurred during login.');
      }
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          ...getAuthHeader(),
          'Accept': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(result.detail || 'User is not authenticated or not authorized');
        }
        throw new Error(result.detail || result.message || 'Failed to get user info');
      }

      return {
        id: result.id,
        email: result.email,
        role: result.role,
        firstName: result.first_name,
        lastName: result.last_name,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
  },

  getUser(): User | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        firstName: payload.first_name,
        lastName: payload.last_name,
      };
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getUser();
  },
}; 