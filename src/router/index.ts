import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { authService } from '../services/auth'
import { useUserStore } from '../store/user'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home
        },
        {
            path: '/verify',
            name: 'Verify',
            meta: {
                title: "POTOLIFE - Verify"
            },
            component: () => import('../views/Verify.vue')
        },
        {
            path: '/login',
            name: 'Login',
            meta: {
                title: "POTOLIFE - Login",
                guest: true
            },
            component: () => import('../views/Login.vue'),
        },
        {
            path: '/register',
            name: 'Register',
            meta: {
                title: "POTOLIFE - Register",
                guest: true
            },
            component: () => import('../views/Register.vue'),
        },
        {
            path: '/scan',
            name: 'Scan',
            meta: {
                title: "POTOLIFE - Scan"
            },
            component: () => import('../views/Scan.vue')
        },
        {
            path: '/dashboard',
            name: 'Dashboard',
            component: () => import('../views/Dashboard.vue'),
            meta: {
                title: "POTOLIFE - Dashboard",
                requiresAuth: true
            }
        },
        {
            path: '/profile',
            name: 'Profile',
            component: () => import('../views/Profile.vue'),
            meta: {
                title: "POTOLIFE - Profile",
                requiresAuth: true
            }
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            meta: {
                title: "POTOLIFE - Not Found"
            },
            component: () => import('../views/NotFound.vue')
        }
    ]
})

router.beforeEach(async (to, _from, next) => {
    const store = useUserStore();
    const token = localStorage.getItem('accessToken');

    // If token exists but user not loaded, try to fetch
    if (token && !store.user.value) {
        // If not already loading, start fetch
        if (!store.loading.value) {
            await authService.fetchProfile();
        } else {
            // If already loading (e.g. app init), wait for it to finish
            // We can poll briefly or use a watch, but for simplicity in guard:
            while (store.loading.value) {
                await new Promise(r => setTimeout(r, 50));
            }
        }
    }

    // Set title
    document.title = to.meta.title as string || "POTOLIFE";

    // Check authentication
    if (to.meta.requiresAuth && !store.isAuthenticated.value) {
        next('/login');
    } else if (to.meta.guest && store.isAuthenticated.value) {
        next('/dashboard');
    } else {
        next();
    }
});

export default router
