<template>
  <div class="page-wrapper">
    <PotoHeader />
    
    <div class="auth-container">
      <div class="auth-card">
        <h2 class="auth-title">{{ t('auth.login_title') }}</h2>
        
        <!-- Removed error message from here -->

        <!-- Typo Correction Modal (Priority View) -->
        <div v-if="showEditIdentifier" class="edit-section">
            <h3 class="auth-subtitle">{{ t('profile.edit_identifier') }}</h3>
            <div class="form-group">
                <input 
                    type="text" 
                    v-model="newIdentifierInput" 
                    :placeholder="t('common.email')"
                    class="auth-input"
                />
            </div>
            <div class="prompt-actions">
                <button class="action-btn-main" @click="handleUpdateIdentifier" :disabled="loading || !isNewIdentifierValid">
                    {{ loading ? t('profile.save') + '...' : t('profile.save') }}
                </button>
                <button class="cancel-btn" @click="showEditIdentifier = false">{{ t('profile.cancel') }}</button>
            </div>
        </div>

        <!-- Unverified Account Prompt -->
        <div v-else-if="loginResult?.status === 'unverified'" class="verify-section">
            <h3 class="auth-subtitle">{{ t('profile.unverified_login_title') }}</h3>
            <p>{{ t('profile.unverified_login_msg', { type: loginResult.type }) }}</p>

            <div v-if="!verificationRequestSent">
                <p class="mb-4"><b>{{ loginResult.identifier }}</b></p>
                <div class="prompt-actions">
                    <TurnstileWidget 
                        ref="verifyTurnstileRef"
                        sitekey="0x4AAAAAACVkL3x1MJ39LV_4"
                        @verify="(token) => { verificationTurnstileToken = token; error = ''; }"
                        @expire="verificationTurnstileToken = ''"
                    />
                    <button class="action-btn-main" @click="handleRequestVerification" :disabled="loading || !verificationTurnstileToken">
                        {{ loading ? t('profile.verify_now') + '...' : t('profile.verify_now') }}
                    </button>
                    <div class="secondary-actions">
                        <button class="edit-btn" @click="showEditIdentifier = true">{{ t('profile.edit_identifier') }}</button>
                        <button class="cancel-btn" @click="loginResult = null">{{ t('profile.cancel') }}</button>
                    </div>
                </div>
            </div>

            <div v-else class="sent-status text-center">
                <p class="success-text">{{ t('profile.verify_sent') }}: <b>{{ loginResult.identifier }}</b></p>
                <p class="small-text">{{ t('profile.check_inbox_link') }}</p>
                <button class="action-btn-main" disabled>{{ t('profile.request_sent') }}</button>
                <button class="cancel-btn block mt-4" @click="loginResult = null">{{ t('common.or') }} {{ t('auth.login_title') }}</button>
            </div>
        </div>

        <!-- Identity Invalidated (Lost) Prompt -->
        <div v-else-if="loginResult?.status === 'invalidated'" class="suspended-prompt">
            <h3 class="auth-subtitle text-error">{{ t('profile.identity_invalidated_title') }}</h3>
            
            <div v-if="!isMigrating && !migrationSuccess">
                <p>{{ t('profile.identity_invalidated_msg', { identifier: loginResult.identifier }) }}</p>
                <div class="prompt-actions migration-actions">
                    <button class="action-btn-main" @click="loginResult = null">{{ t('auth.login_with_different') }}</button>
                    <button class="secondary-btn" @click="isMigrating = true">{{ t('auth.migrate_account') }}</button>
                </div>
            </div>

            <div v-else-if="isMigrating && !migrationSuccess" class="migration-form">
                <p class="mb-4">{{ t('auth.migrate_desc', { type: loginResult.type }) }}</p>
                <div class="form-group mb-4">
                    <input 
                        type="text" 
                        v-model="newIdentifierInput" 
                        :placeholder="t('common.new_email')"
                        class="auth-input"
                    />
                </div>
                <p v-if="error" class="error-text mb-4">{{ error }}</p>
                <div class="prompt-actions">
                    <button class="action-btn-main" @click="handleMigrateAccount" :disabled="loading || !isNewIdentifierValid">
                        {{ loading ? t('common.loading') : t('auth.migrate_now') }}
                    </button>
                    <button class="cancel-btn" @click="isMigrating = false">{{ t('profile.cancel') }}</button>
                </div>
            </div>

            <div v-else class="migration-success text-center">
                <p class="success-text">{{ t('auth.migrate_success') }}</p>
                <p class="small-text">{{ t('auth.migrate_redirect') }}</p>
            </div>
        </div>

        <!-- Account Suspended Prompt -->
        <div v-else-if="loginResult?.status === 'suspended'" class="suspended-prompt">
            <h3 class="auth-subtitle text-error">{{ t('profile.suspended_title') }}</h3>
            <p>{{ t('profile.suspended_msg', { type: loginResult.type }) }}</p>
            <p class="small-text">{{ t('profile.suspended_migration', { type: loginResult.type }) }}</p>
            <div class="prompt-actions">
                <button class="action-btn-main" @click="router.push('/register')">{{ t('auth.register_now') }}</button>
                <button class="cancel-btn" @click="loginResult = null">{{ t('profile.cancel') }}</button>
            </div>
        </div>

        <!-- Typo Correction Modal (Simple View) -> Moved up -->

        <!-- Login Form -->
        <form v-else class="auth-form" @submit.prevent="handleLogin">
            <!-- OAuth Buttons -->
            <button type="button" class="oauth-btn zalo" @click="handleOAuth('zalo')">
                <span>{{ t('auth.login_with_zalo') }}</span>
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" />
            </button>

            <button type="button" class="oauth-btn google" @click="handleOAuth('google')">
                <span>{{ t('auth.login_with_google') }}</span>
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Google_Favicon_2025.svg" alt="Google" />
            </button>

            <div class="divider">
                <span>{{ t('common.or') }}</span>
            </div>
            <div class="form-group">
                <input
                    type="text"
                    id="identifier"
                    v-model="identifier"
                    :placeholder="t('common.email')"
                    :class="['auth-input', { 'error-border': error && !loginResult && error !== t('auth.please_complete_security') }]"
                    required
                />
            </div>

            <div class="form-group password-group">
                <input
                    :type="isPasswordVisible ? 'text' : 'password'"
                    id="password"
                    v-model="password"
                    :placeholder="t('common.password')"
                    :class="['auth-input', { 'error-border': error && !loginResult && error !== t('auth.please_complete_security') }]"
                    required
                />
                <button type="button" class="toggle-password" @click="isPasswordVisible = !isPasswordVisible">
                    {{ isPasswordVisible ? t('common.hide') : t('common.show') }}
                </button>
            </div>

            <p v-if="error && !loginResult" class="error-text feedback">{{ error }}</p>

            <!-- Turnstile Widget -->
            <TurnstileWidget 
                v-if="!loginResult && !showEditIdentifier"
                ref="loginTurnstile"
                sitekey="0x4AAAAAACVkL3x1MJ39LV_4"
                @verify="(token) => { turnstileToken = token; error = ''; }"
                @expire="turnstileToken = ''"
            />

            <button type="submit" class="submit-btn" :disabled="loading || !turnstileToken">
                {{ loading ? t('common.login') + '...' : t('common.login') }}
            </button>
        </form>

        <div v-if="!loginResult && !showEditIdentifier" class="auth-footer-text">
          <p>{{ t('auth.no_account') }} <router-link to="/register">{{ t('auth.register_now') }}</router-link></p>
        </div>
      </div>
    </div>

    <PotoFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { authService } from '../services/auth';
import { isValidEmail } from '../utils/validation';
import PotoHeader from '../components/PotoHeader.vue';
import PotoFooter from '../components/PotoFooter.vue';
import TurnstileWidget from '../components/TurnstileWidget.vue';

const router = useRouter();
const { t } = useI18n();

const identifier = ref('');
const password = ref('');
const isPasswordVisible = ref(false);
const error = ref('');
const loading = ref(false);
const loginResult = ref<any>(null);

const verificationRequestSent = ref(false);
const showEditIdentifier = ref(false);
const newIdentifierInput = ref('');

const turnstileToken = ref('');
const loginTurnstile = ref<any>(null);

const verificationTurnstileToken = ref('');
const verifyTurnstileRef = ref<any>(null);

const isMigrating = ref(false);
const migrationSuccess = ref(false);

// Reset error when user types
watch([identifier, password], () => {
    if (error.value) error.value = '';
});

const isNewIdentifierValid = computed(() => {
    return isValidEmail(newIdentifierInput.value);
});

const handleLogin = async () => {
    error.value = '';
    // do not reset loginResult here if we want to stay in unverified section, 
    // but handleLogin is only called from login form via 'v-else'
    verificationRequestSent.value = false;

    if (!identifier.value || !password.value) {
        return;
    }

    if (!isValidEmail(identifier.value)) {
        error.value = t('auth.invalid_identifier');
        return;
    }

    if (!turnstileToken.value) {
        error.value = t('auth.please_complete_security');
        return;
    }

    loading.value = true;
    try {
        const res = await authService.login(identifier.value, password.value, turnstileToken.value);
        if (res.error) {
            if (res.error === 'Account suspended') {
                loginResult.value = { status: 'suspended', type: res.type, identifier: res.identifier };
            } else if (res.error === 'Account unverified') {
                loginResult.value = { status: 'unverified', type: res.type, identifier: res.identifier };
            } else if (res.error === 'Login method lost') {
                loginResult.value = { status: 'invalidated', type: res.type, identifier: res.identifier };
            } else {
                error.value = res.error;
                if (loginTurnstile.value) loginTurnstile.value.reset();
                turnstileToken.value = '';
            }
        } else {
            router.push('/dashboard');
        }
    } catch (e: any) {
        error.value = t('common.error_occurred');
        if (loginTurnstile.value) loginTurnstile.value.reset();
        turnstileToken.value = '';
    } finally {
        loading.value = false;
    }
};

const handleMigrateAccount = async () => {
    if (!isNewIdentifierValid.value) return;
    loading.value = true;
    error.value = '';
    try {
        const res = await authService.migrateAccount({
            type: loginResult.value.type,
            identifier: loginResult.value.identifier,
            password: password.value,
            new_identifier: newIdentifierInput.value
        });

        if (res.error) {
            error.value = res.error;
        } else {
            migrationSuccess.value = true;
            setTimeout(() => {
                loginResult.value = null;
                isMigrating.value = false;
                migrationSuccess.value = false;
                identifier.value = newIdentifierInput.value;
                newIdentifierInput.value = '';
                error.value = '';
            }, 3000);
        }
    } catch (e) {
        error.value = t('common.error_occurred');
    } finally {
        loading.value = false;
    }
};

const handleRequestVerification = async () => {
    if (!loginResult.value || !verificationTurnstileToken.value) return;
    loading.value = true;
    error.value = '';
    try {
        const res = await authService.requestVerification(
            loginResult.value.type, 
            loginResult.value.identifier,
            verificationTurnstileToken.value
        );
        if (res.error) {
            error.value = res.error;
            if (verifyTurnstileRef.value) verifyTurnstileRef.value.reset();
            verificationTurnstileToken.value = '';
        } else {
            verificationRequestSent.value = true;
        }
    } catch (e) {
        error.value = t('common.error_occurred');
        if (verifyTurnstileRef.value) verifyTurnstileRef.value.reset();
        verificationTurnstileToken.value = '';
    } finally {
        loading.value = false;
    }
};

const handleUpdateIdentifier = async () => {
    if (!isNewIdentifierValid.value) return;
    loading.value = true;
    error.value = '';
    try {
        const res = await authService.updateIdentity({
            type: loginResult.value.type,
            old_identifier: loginResult.value.identifier,
            new_identifier: newIdentifierInput.value
        });

        if (res.error) {
            error.value = res.error;
        } else {
            loginResult.value.identifier = newIdentifierInput.value;
            showEditIdentifier.value = false;
        }
    } catch (e) {
        error.value = t('common.error_occurred');
    } finally {
        loading.value = false;
    }
};

const handleOAuth = (provider: string) => {
    console.log(`Continue with ${provider}`);
};
</script>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.auth-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 1rem;
  background-color: var(--poto-white);
}

.auth-card {
  background: var(--poto-beige-2, #F6F5EE);
  padding: 3rem 4rem;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
}

.auth-title {
  color: var(--poto-dark);
  font-family: var(--font-primary, serif);
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 400;
  text-transform: uppercase;
}

.auth-subtitle {
    margin-bottom: 1.5rem;
    text-align: center;
    color: var(--poto-green);
    text-transform: uppercase;
    font-weight: 700;
}

.text-error {
    color: #ef4444;
}

.oauth-btn {
  width: 100%;
  padding: 0.8rem 1.5rem;
  margin-bottom: 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-family: var(--font-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--poto-dark);
  transition: all 0.2s;
}

.oauth-btn:hover {
  background-color: #f9f9f9;
}

.oauth-btn img {
  height: 24px;
  width: auto;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.divider span {
  padding: 0 10px;
  color: #888;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.auth-input {
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  background-color: white;
  border-radius: 50px;
  font-family: var(--font-secondary, sans-serif);
  font-size: 0.9rem;
  color: var(--poto-dark);
}

.auth-input:focus {
  outline: 2px solid var(--poto-green);
}

.auth-input.error-border {
  outline: 2px solid #ef4444;
  background-color: #fff5f5;
}

.auth-input::placeholder {
  color: #aaa;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.password-group {
    position: relative;
    display: flex;
    align-items: center;
}

.toggle-password {
    position: absolute;
    right: 1.5rem;
    background: none;
    border: none;
    color: var(--poto-green);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    padding: 0.5rem;
}

.toggle-password:hover {
    opacity: 0.8;
}

.submit-btn {
  width: auto;
  min-width: 200px;
  display: block;
  margin: 2rem auto 0;
  padding: 0.8rem 2rem;
  background-color: white;
  color: var(--poto-green);
  border: 1px solid var(--poto-green);
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--poto-green);
  color: white;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-footer-text {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
}

.auth-footer-text a {
  color: var(--poto-green);
  font-weight: 700;
}

.error-text {
  color: #ef4444;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.success-text {
    color: var(--poto-green);
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.verify-section, .suspended-prompt, .edit-section {
    text-align: center;
    background: white;
    padding: 2.5rem 2rem;
    border-radius: 20px;
    margin-bottom: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.small-text {
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 1.5rem;
    line-height: 1.4;
}

.prompt-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.migration-actions {
    flex-direction: row;
    justify-content: center;
}

.secondary-btn {
    background: none;
    border: 1.5px solid #ccc;
    color: #666;
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    font-size: 0.85rem;
}

.secondary-btn:hover {
    border-color: var(--poto-green);
    color: var(--poto-green);
}
.secondary-actions {
    display: flex;
    gap: 1.5rem;
}

.action-btn-main {
    background: var(--poto-green);
    color: white;
    border: none;
    padding: 0.8rem 2.5rem;
    border-radius: 50px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    font-size: 0.9rem;
    min-width: 200px;
}

.action-btn-main:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.edit-btn, .cancel-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.85rem;
    font-weight: 600;
}

.edit-btn:hover {
    color: var(--poto-green);
}

.form-group {
    margin-bottom: 1.25rem;
}

.text-center { text-align: center; }
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.block { display: block; }
</style>
