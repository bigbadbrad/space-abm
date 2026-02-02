// /src/lib/auth/client.ts
import type { User } from '@/types/user';

export interface SignInWithPasswordParams {
  phone: string;
  password: string;
}

interface ResetPasswordParams {
  phone: string;
}

export interface SignUpParams {
  password: string;
  phone: string;
  name: string;
  timezone?: string;
}

interface ConfirmResetPasswordParams {
  token: string;
  password: string;
}

class AuthClient {
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  login(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ data?: User; error?: string }> {
    const { phone, password } = params;
    const API_BASE_URL = process.env.NEXT_PUBLIC_SPACE_API_BASE_URL;
    const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !API_BASE_URL;

    // Demo mode: allow any credentials, return demo user
    if (DEMO_MODE) {
      const demoUser: User = {
        id: 'demo-user-1',
        name: 'Demo User',
        email: 'demo@spacebilt.com',
        avatar: undefined,
        phone: phone || '1234567890',
        role: 'internal_admin',
        createdAt: new Date().toISOString(),
      };
      const demoToken = 'demo-token-' + Date.now();
      this.login(demoToken, demoUser);
      return { data: demoUser };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Invalid credentials' };
      }

      const result = await response.json();
      // space-api returns { user: {...}, token }
      const { token, user: apiUser } = result;
      const user = apiUser || result.user; // Handle both formats
      
      // Map space-api user format to frontend User type
      const mappedUser: User = {
        id: user.id,
        name: user.name || undefined,
        email: user.email || undefined,
        phone: user.phone,
        role: user.role || 'customer_member',
        avatar: undefined,
        createdAt: user.created_at || new Date().toISOString(),
      };
      
      this.login(token, mappedUser);

      return { data: mappedUser };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      return { error: errorMessage };
    }
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { data: null };
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_SPACE_API_BASE_URL;
    const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !API_BASE_URL;

    // Demo mode: return user from localStorage if available, or demo user
    if (DEMO_MODE) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          return { data: user };
        } catch {
          // If parsing fails, create demo user
        }
      }
      // Return demo user if token exists but no stored user
      if (token.startsWith('demo-token-')) {
        const demoUser: User = {
          id: 'demo-user-1',
          name: 'Demo User',
          email: 'demo@spacebilt.com',
          avatar: undefined,
          phone: '1234567890',
          role: 'internal_admin',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('user', JSON.stringify(demoUser));
        return { data: demoUser };
      }
      return { data: null };
    }

    try {
      if (!API_BASE_URL) {
        return { data: null };
      }
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return { data: null };
      }

      const apiUser = await response.json();
      // Map space-api user format to frontend User type
      const user: User = {
        id: apiUser.id,
        name: apiUser.name || undefined,
        email: apiUser.email || undefined,
        phone: apiUser.phone,
        role: apiUser.role || 'customer_member',
        avatar: undefined,
        createdAt: apiUser.created_at || new Date().toISOString(),
      };
      
      localStorage.setItem('user', JSON.stringify(user));

      return { data: user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      return { error: errorMessage };
    }
  }

  async signUp(params: SignUpParams): Promise<{ data?: User; error?: string }> {
    const { password, phone, name, timezone } = params;
    const API_BASE_URL = process.env.NEXT_PUBLIC_SPACE_API_BASE_URL;

    try {
      if (!API_BASE_URL) {
        return { error: 'API URL not configured' };
      }
      const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, phone, name, timezone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Unable to sign up' };
      }

      const result = await response.json();
      const { token, user } = result;
      this.login(token, user);

      return { data: user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      return { error: errorMessage };
    }
  }

  // CLAIM THE BOOKING SITE & SIGN UP
  async claimSignUp(params: SignUpParams & { slug: string }) {
    const { password, phone, name, timezone, slug } = params;
    const API_BASE_URL = process.env.NEXT_PUBLIC_SPACE_API_BASE_URL;
  
    try {
      if (!API_BASE_URL) {
        return { error: 'API URL not configured' };
      }
      const response = await fetch(`${API_BASE_URL}/api/users/claim-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, phone, name, timezone, slug }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Unable to sign up and claim' };
      }
  
      const result = await response.json();
      const { token, user } = result;
      this.login(token, user);
  
      return { data: user };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Something went wrong' };
    }
  }
  

  async resetPassword({ phone }: ResetPasswordParams) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_SPACE_API_BASE_URL;
    try {
      if (!API_BASE_URL) {
        return { error: 'API URL not configured' };
      }
      const response = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Unable to reset password' };
      }

      const result = await response.json();
      return { data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      return { error: errorMessage };
    }
  }

  async confirmResetPassword({ token, password }: ConfirmResetPasswordParams): Promise<{ data?: any; error?: string }> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_SPACE_API_BASE_URL;
    try {
      if (!API_BASE_URL) {
        return { error: 'API URL not configured' };
      }
      const response = await fetch(`${API_BASE_URL}/api/users/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Unable to reset password' };
      }

      const result = await response.json();
      return { data: result };
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      return { error: errorMessage };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    this.logout();
    return {};
  }
}

export const authClient = new AuthClient();
