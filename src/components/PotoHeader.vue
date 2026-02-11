<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { authService } from '../services/auth';
import { setLanguage } from '../i18n';

defineProps<{
  title?: string;
  showMenu?: boolean;
}>();

const { locale, t } = useI18n();
const store = useUserStore();
const router = useRouter();
const showUserMenu = ref(false);

const toggleLanguage = () => {
  const newLang = locale.value === 'vi' ? 'en' : 'vi';
  setLanguage(newLang);
};

const handleLogout = () => {
    authService.logout();
    router.push('/login');
    showUserMenu.value = false;
};

const goToProfile = () => {
    router.push('/profile');
    showUserMenu.value = false;
};

const logoLink = computed(() => {
    return router.currentRoute.value.path === '/profile' ? '/dashboard' : '/';
});
</script>

<template>
  <header class="header">
    <div class="logo-container">
      <router-link :to="logoLink" class="logo-link">
        <img src="../assets/logo-cropped.svg" alt="Poto Logo" class="header-logo" />
        <span class="header-title">{{ title || t('common.brand_name') }}</span>
      </router-link>
    </div>
    
    <div class="header-actions">
      <button class="lang-toggle" @click="toggleLanguage">
        {{ locale === 'vi' ? 'EN' : 'VI' }}
      </button>

      <div v-if="store.isAuthenticated.value" class="user-menu-container">
          <div class="avatar-circle" @click="showUserMenu = !showUserMenu">
              {{ store.user.value?.display_name?.charAt(0).toUpperCase() || 'U' }}
          </div>
          
          <div v-if="showUserMenu" class="dropdown-menu">
              <div class="menu-item" @click="goToProfile">
                  {{ t('header.profile') }}
              </div>
              <div class="menu-item logout" @click="handleLogout">
                  {{ t('header.logout') }}
              </div>
          </div>
      </div>
      <div v-else>
          <router-link to="/login" class="login-link">
              {{ t('common.login') }}
          </router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: var(--header-height);
  padding: 0 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--poto-beige-1);
  border-bottom: 1px solid #d4d0c8;
  position: relative; /* For dropdown positioning if needed context */
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
}

.header-logo {
  height: 50px;
}

.header-title {
  font-family: var(--font-primary);
  font-size: 1.6rem;
  letter-spacing: 0.05em;
  font-weight: 500;
  color: var(--poto-dark);
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.lang-toggle {
  background: transparent;
  border: 1.5px solid var(--poto-green);
  color: var(--poto-green);
  padding: 0.4rem 1rem;
  font-family: var(--font-secondary);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.lang-toggle:hover {
  background-color: var(--poto-green);
  color: white;
}

/* User Menu */
.user-menu-container {
    position: relative;
}

.avatar-circle {
    width: 40px;
    height: 40px;
    background-color: var(--poto-green);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    cursor: pointer;
    user-select: none;
}

.dropdown-menu {
    position: absolute;
    top: 120%;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 150px;
    padding: 0.5rem 0;
    z-index: 100;
}

.menu-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.2s;
    font-size: 0.9rem;
    color: var(--poto-dark);
}

.menu-item:hover {
    background-color: #f5f5f5;
}

.menu-item.logout {
    color: #ef4444;
    border-top: 1px solid #eee;
}

.login-link {
    color: var(--poto-green);
    font-weight: 700;
    text-decoration: none;
    font-size: 0.9rem;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hamburger span {
  width: 32px;
  height: 2px;
  background-color: var(--poto-dark);
}

@media (max-width: 1024px) {
  .header {
    padding: 0 2rem;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0 1rem;
  }
  .header-logo {
    height: 40px;
  }
  .header-title {
    font-size: 1.2rem;
  }
  
  .header-actions {
      gap: 1rem;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 1rem;
  }
}
</style>
