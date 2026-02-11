import { reactive, computed } from 'vue';

interface Account {
    provider_type: 'email' | 'phone' | 'google' | 'zalo';
    provider_id: string;
    verified?: boolean; // Keep for backward compatibility if needed, or remove
    status: 'unverified' | 'verified' | 'invalidated';
}

interface User {
    id: string;
    display_name: string;
    accounts: Account[];
    created_at: string;
}

interface UserState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
}

const state = reactive<UserState>({
    user: null,
    isAuthenticated: false,
    loading: true,
});

export const useUserStore = () => {
    const setUser = (userData: User | null) => {
        state.user = userData;
        state.isAuthenticated = !!userData;
    };

    const setLoading = (isLoading: boolean) => {
        state.loading = isLoading;
    };

    const clearUser = () => {
        state.user = null;
        state.isAuthenticated = false;
    };

    return {
        state, // Expose reactive state
        user: computed(() => state.user),
        isAuthenticated: computed(() => state.isAuthenticated),
        loading: computed(() => state.loading),
        setUser,
        setLoading,
        clearUser
    };
};
