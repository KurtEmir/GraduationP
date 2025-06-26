import axios from 'axios';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

const API_URL = 'http://localhost:8000/api/v1';

const authApi = {
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            const authData = response.data as AuthResponse;
            if (authData.token) {
                localStorage.setItem('token', authData.token);
            }
            return authData;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            const authData = response.data as AuthResponse;
            if (authData.token) {
                localStorage.setItem('token', authData.token);
            }
            return authData;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        localStorage.removeItem('token');
    },

    getCurrentUser: async (): Promise<AuthResponse> => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found');
        }
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
        return response.data as AuthResponse;
    }
};

export default authApi; 