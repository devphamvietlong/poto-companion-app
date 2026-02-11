<template>
  <div class="page-wrapper">
    <PotoHeader />
    
    <div class="verify-container">
      <div class="verify-card">
        <h2 class="verify-title">{{ t('profile.verify_identity') }}</h2>
        
        <div v-if="loading" class="status-box">
            <div class="spinner"></div>
            <p>{{ t('profile.loading') }}</p>
        </div>

        <div v-if="success" class="status-box success">
            <div class="icon-circle">✓</div>
            <h3>{{ isClaim ? t('profile.claim_success_title') : t('profile.verify_success') }}</h3>
            <p v-if="isClaim">{{ t('profile.claim_success_desc') }}</p>
            <p v-else>{{ t('profile.verify_success_msg') }}</p>
            <button class="action-btn" @click="router.push(isClaim ? '/register' : '/login')">
                {{ isClaim ? t('auth.register_now') : t('auth.login_now') }}
            </button>
        </div>

        <div v-else class="status-box error">
            <div class="icon-circle">!</div>
            <h3>{{ t('common.error_occurred') }}</h3>
            <p v-if="error">{{ error }}</p>
            <p v-else>{{ t('common.error_occurred') }}</p>
            <button class="action-btn" @click="router.push('/login')">{{ t('auth.login_now') }}</button>
        </div>
      </div>
    </div>

    <PotoFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { authService } from '../services/auth';
import PotoHeader from '../components/PotoHeader.vue';
import PotoFooter from '../components/PotoFooter.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const success = ref(false);
const isClaim = ref(false);
const error = ref('');

onMounted(async () => {
    const token = route.query.token as string;
    
    if (!token) {
        loading.value = false;
        error.value = t('verify.missing_token_error');
        return;
    }

    try {
        const res = await authService.verifyToken(token);
        if (res.error) {
            error.value = res.error;
        } else {
            success.value = true;
            if (res.is_claim) {
                isClaim.value = true;
            }
        }
    } catch (e) {
        error.value = t('common.error_occurred');
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.verify-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 1rem;
  background-color: var(--poto-white);
}

.verify-card {
  background: var(--poto-beige-2, #F6F5EE);
  padding: 3rem;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.verify-title {
  color: var(--poto-dark);
  font-family: var(--font-primary, serif);
  font-size: 2rem;
  margin-bottom: 2rem;
  font-weight: 400;
  text-transform: uppercase;
}

.status-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
}

.icon-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
}

.success .icon-circle {
    background: var(--poto-green);
    color: white;
}

.error .icon-circle {
    background: #ef4444;
    color: white;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(0,0,0,0.1);
    border-top-color: var(--poto-green);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.action-btn {
    background: var(--poto-green);
    color: white;
    border: none;
    padding: 0.8rem 2.5rem;
    border-radius: 50px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    font-size: 0.9rem;
    margin-top: 1rem;
}

@media (max-width: 768px) {
  .verify-card {
    padding: 2rem;
  }
}
</style>
