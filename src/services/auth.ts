import { useUserStore } from '../store/user';
import axiosInstance, { setLoggingOut } from '../utils/axios';
import router from '../router';

export interface AuthResponse {
    message?: string;
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
    error?: string;
    can_verify?: boolean;
    type?: string;
    identifier?: string;
}

export const authService = {
    async register(payload: { email?: string; phone?: string; password: string; display_name?: string; 'cf-turnstile-response'?: string }): Promise<AuthResponse> {
        try {
            const res = await axiosInstance.post('/auth/register', payload);
            return res.data;
        } catch (e: any) {
            if (e.response && e.response.data) {
                return e.response.data;
            }
            console.error('Register API error:', e);
            throw e;
        }
    },

    async login(identifier: string, password: string, turnstileToken?: string): Promise<AuthResponse> {
        try {
            const res = await axiosInstance.post('/auth/login', {
                identifier,
                password,
                'cf-turnstile-response': turnstileToken
            });
            const data = res.data;
            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
                await this.fetchProfile();
            }
            return data;
        } catch (e: any) {
            if (e.response && e.response.data) {
                return e.response.data;
            }
            console.error('Login API error:', e);
            throw e;
        }
    },

    async logout() {
        try {
            setLoggingOut(true);
            // Call backend to revoke refresh token
            await axiosInstance.post('/auth/logout');
        } finally {
            localStorage.removeItem('accessToken');
            const store = useUserStore();
            store.clearUser();
            setLoggingOut(false);
            // Redirect to login after logout
            router.push('/login');
        }
    },

    async fetchProfile() {
        const store = useUserStore();
        store.setLoading(true);
        const token = localStorage.getItem('accessToken');

        if (!token) {
            store.clearUser();
            store.setLoading(false);
            return;
        }

        try {
            const res = await axiosInstance.get('/auth/me');

            if (res.status === 200) {
                store.setUser(res.data.user);
            } else {
                // Token might be invalid or expired, interceptor handles refresh, so this is a forced logout
                this.logout();
            }
        } catch (e) {
            console.error('Fetch profile error:', e);
            this.logout();
        } finally {
            store.setLoading(false);
        }
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('accessToken');
    },

    async updateProfile(display_name: string) {
        try {
            const res = await axiosInstance.patch('/auth/profile', { display_name });
            const data = res.data;
            if (res.status === 200) {
                await this.fetchProfile();
            }
            return data;
        } catch (e: any) {
            if (e.response && e.response.data) return e.response.data;
            throw e;
        }
    },

    async changePassword(payload: { old_password: string; new_password: string }) {
        try {
            const res = await axiosInstance.post('/auth/change-password', payload);
            return res.data;
        } catch (e: any) {
            if (e.response && e.response.data) return e.response.data;
            throw e;
        }
    },

    async deleteAccount(password: string) {
        try {
            const res = await axiosInstance.delete('/auth/account', { data: { password } });
            const data = res.data;
            if (res.status === 200) {
                this.logout();
            }
            return data;
        } catch (e: any) {
            if (e.response && e.response.data) return e.response.data;
            throw e;
        }
    },

    async linkIdentity(payload: { type: string; identifier: string; password?: string }) {
        try {
            const res = await axiosInstance.post('/auth/link-identity', payload);
            return res.data;
        } catch (e: any) {
            if (e.response && e.response.data) return e.response.data;
            throw e;
        }
    },

    async verifyToken(token: string) {
        try {
            const res = await axiosInstance.post('/auth/verify-token', { token });
            const data = res.data;
            if (res.status === 200) {
                await this.fetchProfile();
            }
            return data;
        } catch (e: any) {
            if (e.response && e.response.data) return e.response.data;
            throw e;
        }
    },

    async updateIdentity(payload: { type: string; old_identifier: string; new_identifier: string }) {
        try {
            const res = await axiosInstance.patch('/auth/identity', payload);
            return res.data;
        } catch (e: any) {
            if (e.response && e.response.data) return e.response.data;
            throw e;
        }
    },

    async migrateAccount(payload: { type: string; identifier: string; password?: string; new_identifier: string }) {
        try {
            const res = await axiosInstance.post('/auth/migrate', payload);
            return res.data;
        } catch (e: any) {
            if (e.response && e.response.data) return e.response.data;
            throw e;
        }
    },

    async unlinkIdentity(type: string, identifier: string) {
        try {
            const res = await axiosInstance.post('/auth/unlink-identity', { type, identifier });
            const data = res.data;
            if (res.status === 200) {
                await this.fetchProfile();
            }
            return data;
        } catch (e: any) {
            if (e.response && e.response.data) return e.response.data;
            throw e;
        }
    },

    async requestVerification(type: string, identifier: string, turnstileToken?: string, intent: 'verify' | 'claim' = 'verify') {
        try {
            const res = await axiosInstance.post('/auth/verify-request', {
                type,
                identifier,
                'cf-turnstile-response': turnstileToken,
                intent
            });
            return res.data;
        } catch (e: any) {
            if (e.response && e.response.data) return e.response.data;
            throw e;
        }
    }
};
