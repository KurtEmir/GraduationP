export type UserRole = 'DOCTOR' | 'PATIENT' | 'ADMIN';

export interface User {
    id: number;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    doctor_code?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    doctor_code?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
} 