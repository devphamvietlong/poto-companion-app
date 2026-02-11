<template>
  <div class="page-wrapper">
    <PotoHeader />
    
    <div class="auth-container">
      <div class="auth-card">
        <h2 class="auth-title">{{ t('auth.register_title') }}</h2>
        
        <!-- Moved error message down into the form -->

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

        <!-- Conflict Prompt -->
        <div v-else-if="registerResult?.status === 'conflict'" class="conflict-prompt">
            <h3>{{ t('profile.conflict_title') }}</h3>
            <p>{{ t('profile.conflict_exists', { identifier: registerResult.identifier }) }}</p>
            <p>{{ t('profile.conflict_verify_prompt', { type: registerResult.type }) }}</p>
            
            <div class="prompt-actions" v-if="!verificationRequestSent">
                <TurnstileWidget 
                    ref="verifyTurnstileRef"
                    sitekey="0x4AAAAAACVkL3x1MJ39LV_4"
                    @verify="(token) => { verificationTurnstileToken = token; error = ''; }"
                    @expire="verificationTurnstileToken = ''"
                />
                <button class="action-btn-main" @click="startVerifyAfterRegister" :disabled="loading || !verificationTurnstileToken">
                    {{ loading ? t('profile.verify_now') + '...' : t('profile.verify_now') }}
                </button>
                <div class="secondary-actions">
                    <button class="edit-btn" @click="showEditIdentifier = true">{{ t('profile.edit_identifier') }}</button>
                    <button class="cancel-btn" @click="registerResult = null">{{ t('profile.cancel') }}</button>
                </div>
            </div>

            <div v-else class="sent-status">
                <p class="success-text">{{ t('profile.verify_sent') }}: <b>{{ registerResult.identifier }}</b></p>
                <p class="small-text">{{ t('profile.check_inbox_link') }}</p>
                <button class="action-btn-main" disabled>{{ t('profile.request_sent') }}</button>
            </div>
        </div>

        <!-- Success/Verification Section -->
        <div v-else-if="registerResult?.status === 'success'" class="verify-section">
            <h3 class="auth-subtitle">{{ t('profile.verify_identity') }}</h3>
            
            <div v-if="!verificationRequestSent" class="verification-choice text-center">
                <p>{{ t('profile.registered_successfully_claim', { identifier: registerResult.identifier }) }}</p>
                <div class="prompt-actions">
                    <TurnstileWidget 
                        ref="verifyTurnstileRef"
                        sitekey="0x4AAAAAACVkL3x1MJ39LV_4"
                        @verify="(token) => { verificationTurnstileToken = token; error = ''; }"
                        @expire="verificationTurnstileToken = ''"
                    />
                    <button class="action-btn-main" @click="startVerifyAfterRegister" :disabled="loading || !verificationTurnstileToken">
                        {{ loading ? t('profile.verify_now') + '...' : t('profile.verify_now') }}
                    </button>
                    <div class="secondary-actions">
                        <button class="edit-btn" @click="showEditIdentifier = true">{{ t('profile.edit_identifier') }}</button>
                        <button class="cancel-btn" @click="router.push('/login')">{{ t('auth.login_now') }}</button>
                    </div>
                </div>
            </div>

            <div v-else class="sent-status text-center">
                <p class="success-text">{{ t('profile.verify_sent') }}: <b>{{ registerResult.identifier }}</b></p>
                <p class="small-text">{{ t('profile.check_inbox_link') }}</p>
                <button class="action-btn-main" disabled>{{ t('profile.request_sent') }}</button>
                <p class="mt-4"><router-link to="/login" class="green-link">{{ t('auth.login_now') }}</router-link></p>
            </div>
        </div>

        <!-- Typo Correction Modal -> Moved up -->

        <!-- Normal Registration Form -->
        <div v-else>
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

            <!-- Phone registration temporarily disabled -->
            <!-- <div class="tabs">
              <button 
                :class="['tab-btn', { active: registerMethod === 'email' }]"
                @click="manualMethod = 'email'"
              >
                {{ t('auth.email_tab') }}
              </button>
              <button 
                :class="['tab-btn', { active: registerMethod === 'phone' }]"
                @click="manualMethod = 'phone'"
              >
                {{ t('auth.phone_tab') }}
              </button>
            </div> -->

            <form @submit.prevent="handleRegister" class="auth-form">
              <div class="form-group">
                <input
                  type="text"
                  v-model="identifier"
                  :placeholder="t('common.email')"
                  :class="['auth-input', { 'error-border': error && !registerResult && error !== t('auth.please_complete_security') }]"
                  required
                />
              </div>

              <div class="form-group">
                <input
                  type="text"
                  v-model="displayName"
                  :placeholder="t('common.display_name')"
                  :class="['auth-input', { 'error-border': error && !registerResult && error !== t('auth.please_complete_security') }]"
                  required
                />
              </div>

              <div class="form-group">
                <div class="password-input-wrapper">
                    <input
                      :type="isPasswordVisible ? 'text' : 'password'"
                      v-model="password"
                      :placeholder="t('common.password')"
                      :class="['auth-input', { 'error-border': error && !registerResult && error !== t('auth.please_complete_security') }]"
                      required
                      @input="validatePasswordInput"
                    />
                    <button type="button" class="toggle-password" @click="isPasswordVisible = !isPasswordVisible">
                        {{ isPasswordVisible ? t('common.hide') : t('common.show') }}
                    </button>
                </div>
                <small class="error-hint block" v-if="validationErrors.password">{{ validationErrors.password }}</small>
              </div>

              <p v-if="error && !registerResult" class="error-text feedback">{{ error }}</p>

              <!-- Turnstile Widget -->
              <div class="turnstile-container">
                  <TurnstileWidget 
                      ref="registerTurnstile"
                      sitekey="0x4AAAAAACVkL3x1MJ39LV_4"
                      @verify="(token) => { turnstileToken = token; error = ''; }"
                      @expire="turnstileToken = ''"
                  />
              </div>

              <button type="submit" class="submit-btn" :disabled="loading || !isValid || !turnstileToken">
                {{ loading ? t('common.register') + '...' : t('common.register') }}
              </button>
            </form>
        </div>

        <div v-if="!registerResult && !showEditIdentifier" class="auth-footer-text">
          <p>{{ t('auth.has_account') }} <router-link to="/login">{{ t('auth.login_now') }}</router-link></p>
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
import { isValidEmail, isValidPassword } from '../utils/validation';
import PotoHeader from '../components/PotoHeader.vue';
import PotoFooter from '../components/PotoFooter.vue';
import TurnstileWidget from '../components/TurnstileWidget.vue';

const router = useRouter();
const { t } = useI18n();

const identifier = ref('');
const password = ref('');
const displayName = ref('');
// manualMethod ref removed as phone registration is disabled

const error = ref('');
const loading = ref(false);
const registerResult = ref<any>(null);
const isPasswordVisible = ref(false);

// Reset error when user types
watch([identifier, password, displayName], () => {
    if (error.value) error.value = '';
});

const validatePasswordInput = () => {
    if (password.value && !isValidPassword(password.value)) {
        validationErrors.value.password = t('validation.password_format');
    } else {
        validationErrors.value.password = undefined;
    }
};

const verificationRequestSent = ref(false);
const showEditIdentifier = ref(false);
const newIdentifierInput = ref('');

const validationErrors = ref<{ password?: string }>({});

// Auto-detect or manual method (Phone disabled)
const registerMethod = computed(() => {
    return 'email';
});

const isValid = computed(() => {
    const methodValid = isValidEmail(identifier.value);
    return methodValid && isValidPassword(password.value) && displayName.value.trim().length > 0;
});

const isNewIdentifierValid = computed(() => {
    if (!registerResult.value) return false;
    return isValidEmail(newIdentifierInput.value);
});

const turnstileToken = ref('');
const registerTurnstile = ref<any>(null);

const verificationTurnstileToken = ref('');
const verifyTurnstileRef = ref<any>(null);

const handleRegister = async () => {
    if (!isValid.value) return;

    if (!turnstileToken.value) {
        error.value = t('auth.please_complete_security');
        return;
    }

    error.value = '';
    registerResult.value = null;
    loading.value = true;
    verificationRequestSent.value = false;

    try {
        const payload = {
            [registerMethod.value]: identifier.value,
            password: password.value,
            display_name: displayName.value,
            'cf-turnstile-response': turnstileToken.value
        };

        const res = await authService.register(payload);
        if (res.error) {
            if (res.can_verify) {
                registerResult.value = {
                    status: 'conflict',
                    type: res.type,
                    identifier: res.identifier
                };
            } else {
                error.value = res.error;
                if (registerTurnstile.value) registerTurnstile.value.reset();
                turnstileToken.value = '';
            }
        } else {
            // Success
            registerResult.value = {
                status: 'success',
                type: registerMethod.value,
                identifier: identifier.value
            };
        }
    } catch (e: any) {
        error.value = t('common.error_occurred');
        if (registerTurnstile.value) registerTurnstile.value.reset();
        turnstileToken.value = '';
    } finally {
        loading.value = false;
    }
};

const startVerifyAfterRegister = async () => {
    if (!registerResult.value || !verificationTurnstileToken.value) return;
    loading.value = true;
    error.value = '';
    try {
        const intent = registerResult.value.status === 'conflict' ? 'claim' : 'verify';
        const res = await authService.requestVerification(
            registerResult.value.type, 
            registerResult.value.identifier,
            verificationTurnstileToken.value,
            intent
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
            type: registerResult.value.type,
            old_identifier: registerResult.value.identifier,
            new_identifier: newIdentifierInput.value
        });

        if (res.error) {
            error.value = res.error;
        } else {
            // Update local state and return to verification choice
            registerResult.value.identifier = newIdentifierInput.value;
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

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: center;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  font-weight: 700;
  cursor: pointer;
  color: #888;
  text-transform: uppercase;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.tab-btn.active {
  color: var(--poto-green);
  border-bottom: 2px solid var(--poto-green);
}

.auth-form {
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
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

.password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.error-hint.block {
    display: block;
    margin-top: 0.5rem;
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

.error-hint {
  display: block;
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  margin-left: 1rem;
}

.conflict-prompt, .verify-section, .edit-section {
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
    gap: 1.25rem;
    align-items: center;
    margin-top: 1.5rem;
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

.text-center { text-align: center; }
.mt-4 { margin-top: 1rem; }
.green-link { 
    color: var(--poto-green); 
    font-weight: 700; 
    text-transform: uppercase; 
    font-size: 0.85rem;
}

.turnstile-container {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

@media (max-width: 768px) {
  .auth-card {
    padding: 2rem;
  }
}
</style>

