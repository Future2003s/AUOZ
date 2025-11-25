/**
 * Enterprise Authentication Service
 * Secure authentication with JWT, refresh tokens, and role-based access control
 */

import { httpClient } from '@/lib/api/http-client';
import { AuthenticationError, ValidationError, ErrorCode } from '@/lib/errors/types';
import { handleError } from '@/lib/errors/error-handler';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  addresses?: Address[];
  preferences?: UserPreferences;
}

export interface Address {
  _id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';
  
  private currentUser: User | null = null;
  private tokenRefreshPromise: Promise<AuthTokens> | null = null;

  constructor() {
    // Add auth interceptor to HTTP client
    httpClient.addRequestInterceptor(this.authInterceptor.bind(this));
    httpClient.addResponseInterceptor(this.responseInterceptor.bind(this));
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      this.validateLoginCredentials(credentials);

      const response = await httpClient.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>('/auth/login', credentials);

      if (!response.success || !response.data) {
        throw new AuthenticationError('Login failed: Invalid response');
      }

      const { user, token, refreshToken } = response.data;
      
      const tokens: AuthTokens = {
        accessToken: token,
        refreshToken,
        expiresIn: this.getTokenExpiration(token),
      };

      await this.setAuthData(user, tokens);

      return { user, tokens };
    } catch (error) {
      throw handleError(error as Error, {
        additionalData: { action: 'login', email: credentials.email },
      });
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      this.validateRegisterData(data);

      const response = await httpClient.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>('/auth/register', data);

      if (!response.success || !response.data) {
        throw new AuthenticationError('Registration failed: Invalid response');
      }

      const { user, token, refreshToken } = response.data;
      
      const tokens: AuthTokens = {
        accessToken: token,
        refreshToken,
        expiresIn: this.getTokenExpiration(token),
      };

      await this.setAuthData(user, tokens);

      return { user, tokens };
    } catch (error) {
      throw handleError(error as Error, {
        additionalData: { action: 'register', email: data.email },
      });
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if we have a token
      const token = this.getStoredToken();
      if (token) {
        await httpClient.post('/auth/logout', {}, { 
          skipErrorHandling: true // Don't show errors for logout
        });
      }
    } catch (error) {
      // Ignore logout errors - we'll clear local data anyway
      console.warn('Logout API call failed:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  /**
   * Refresh access token - gọi API route để refresh (token từ cookie httpOnly)
   */
  async refreshToken(refreshToken?: string): Promise<AuthTokens> {
    // Prevent multiple simultaneous refresh requests
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh();
    
    try {
      const tokens = await this.tokenRefreshPromise;
      return tokens;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * Get current user - gọi API route để lấy user (token từ cookie httpOnly)
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      // Gọi Next.js API route để lấy user (token từ cookie httpOnly)
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.success && data?.user) {
          this.currentUser = data.user;
          this.setStoredUser(data.user);
          return data.user;
        }
      }
    } catch (error) {
      // Token might be invalid, clear auth data
      await this.clearAuthData();
    }

    return null;
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      this.validatePasswordChange(data);

      const response = await httpClient.put('/auth/change-password', data);

      if (!response.success) {
        throw new AuthenticationError('Password change failed');
      }
    } catch (error) {
      throw handleError(error as Error, {
        additionalData: { action: 'changePassword' },
      });
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      if (!email || !this.isValidEmail(email)) {
        throw new ValidationError('Valid email is required');
      }

      const response = await httpClient.post('/auth/forgot-password', { email });

      if (!response.success) {
        throw new AuthenticationError('Password reset request failed');
      }
    } catch (error) {
      throw handleError(error as Error, {
        additionalData: { action: 'forgotPassword', email },
      });
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    try {
      if (!token || !password) {
        throw new ValidationError('Token and password are required');
      }

      this.validatePassword(password);

      const response = await httpClient.put<{
        user: User;
        token: string;
        refreshToken: string;
      }>(`/auth/reset-password/${token}`, { password });

      if (!response.success || !response.data) {
        throw new AuthenticationError('Password reset failed');
      }

      const { user, token: accessToken, refreshToken } = response.data;
      
      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiration(accessToken),
      };

      await this.setAuthData(user, tokens);

      return { user, tokens };
    } catch (error) {
      throw handleError(error as Error, {
        additionalData: { action: 'resetPassword' },
      });
    }
  }

  /**
   * Check if user is authenticated
   * Vì token lưu trong cookie httpOnly, cần gọi API để check
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string | string[]): boolean {
    if (!this.currentUser) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(this.currentUser.role);
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole(['admin', 'staff']);
  }

  // Private methods

  private async performTokenRefresh(): Promise<AuthTokens> {
    // Refresh token được lưu trong cookie httpOnly
    // Gọi API route để refresh token (API sẽ đọc refreshToken từ cookie)
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new AuthenticationError('Token refresh failed');
      }

      const data = await response.json();
      
      if (!data?.success || !data?.data?.token) {
        throw new AuthenticationError('Token refresh failed');
      }

      // Token đã được set trong cookie bởi API route
      const tokens: AuthTokens = {
        accessToken: data.data.token,
        refreshToken: data.data.refreshToken || '',
        expiresIn: this.getTokenExpiration(data.data.token),
      };

      return tokens;
    } catch (error) {
      await this.clearAuthData();
      throw new AuthenticationError('Token refresh failed');
    }
  }

  private async authInterceptor(config: any): Promise<any> {
    // Token được lưu trong cookie httpOnly, sẽ tự động gửi kèm request
    // Không cần set Authorization header ở đây
    // Nếu cần refresh token, sẽ được xử lý bởi API route
    
    // Chỉ cần đảm bảo credentials được include để gửi cookie
    if (config.requireAuth !== false) {
      config.credentials = config.credentials || 'include';
    }

    return config;
  }

  private async responseInterceptor(response: Response): Promise<Response> {
    if (response.status === 401) {
      // Token might be invalid, try to refresh
      const refreshToken = this.getStoredRefreshToken();
      if (refreshToken) {
        try {
          await this.refreshToken();
          // Don't retry the original request here - let the caller handle it
        } catch (error) {
          await this.clearAuthData();
        }
      } else {
        await this.clearAuthData();
      }
    }

    return response;
  }

  private async setAuthData(user: User, tokens: AuthTokens): Promise<void> {
    this.currentUser = user;
    this.setStoredUser(user);
    // Token được set trong cookie bởi API route, không cần set ở đây
    // this.setStoredToken(tokens.accessToken);
    // this.setStoredRefreshToken(tokens.refreshToken);
  }

  private async clearAuthData(): Promise<void> {
    this.currentUser = null;
    this.removeStoredUser();
    this.removeStoredToken();
    this.removeStoredRefreshToken();
  }

  // Storage methods - Token được lưu trong cookie httpOnly, không lưu trong localStorage
  // Client-side không thể đọc token từ cookie httpOnly, nên các method này không cần thiết
  // Token sẽ được tự động gửi kèm request qua cookie
  private getStoredToken(): string | null {
    // Token không lưu ở client, chỉ trong cookie httpOnly
    // API route sẽ đọc token từ cookie
    return null;
  }

  private setStoredToken(token: string): void {
    // Token được set trong cookie bởi API route, không cần set ở đây
    // Chỉ cần gọi API để set cookie
  }

  private removeStoredToken(): void {
    // Token được xóa bởi API route khi logout, không cần xóa ở đây
  }

  private getStoredRefreshToken(): string | null {
    // Refresh token không lưu ở client, chỉ trong cookie httpOnly
    return null;
  }

  private setStoredRefreshToken(token: string): void {
    // Refresh token được set trong cookie bởi API route, không cần set ở đây
  }

  private removeStoredRefreshToken(): void {
    // Refresh token được xóa bởi API route khi logout, không cần xóa ở đây
  }

  private getStoredUser(): User | null {
    // User data được lưu trong cookie, đọc từ cookie
    if (typeof window === 'undefined') return null;
    const getCookie = (name: string): string | null => {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    };
    const userData = getCookie('auth_user');
    return userData ? JSON.parse(decodeURIComponent(userData)) : null;
  }

  private setStoredUser(user: User): void {
    // User data được set trong cookie bởi API route, không cần set ở đây
    // Chỉ cập nhật state
  }

  private removeStoredUser(): void {
    // User data được xóa bởi API route khi logout, không cần xóa ở đây
  }

  // Validation methods
  private validateLoginCredentials(credentials: LoginCredentials): void {
    if (!credentials.email || !credentials.password) {
      throw new ValidationError('Email and password are required');
    }

    if (!this.isValidEmail(credentials.email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  private validateRegisterData(data: RegisterData): void {
    if (!data.firstName || !data.lastName || !data.email || !data.password) {
      throw new ValidationError('All required fields must be provided');
    }

    if (!this.isValidEmail(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    this.validatePassword(data.password);
  }

  private validatePasswordChange(data: ChangePasswordData): void {
    if (!data.currentPassword || !data.newPassword) {
      throw new ValidationError('Current and new passwords are required');
    }

    this.validatePassword(data.newPassword);
  }

  private validatePassword(password: string): void {
    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Add more password validation rules as needed
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getTokenExpiration(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return Date.now() + 3600000; // Default to 1 hour
    }
  }

  private isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    return Date.now() >= expiration - 60000; // Refresh 1 minute before expiration
  }
}

// Export singleton instance
export const authService = new AuthService();
