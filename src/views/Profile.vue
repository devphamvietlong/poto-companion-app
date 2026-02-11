<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '../store/user';
import { authService } from '../services/auth';
import { useI18n } from 'vue-i18n';
import PotoHeader from '../components/PotoHeader.vue';
import PotoFooter from '../components/PotoFooter.vue';
import { useRouter } from 'vue-router';
import TurnstileWidget from '../components/TurnstileWidget.vue';
import { isValidEmail, isValidPassword } from '../utils/validation';

const store = useUserStore();
const { t } = useI18n();
const router = useRouter();

// Edit Mode States
const isEditingName = ref(false);
const newDisplayName = ref('');

const isChangingPassword = ref(false);
const oldPassword = ref('');
const newPassword = ref('');
const isOldPasswordVisible = ref(false);
const isNewPasswordVisible = ref(false);
const passwordError = ref('');

const isDeletingAccount = ref(false);
const deletePassword = ref('');
const isDeletePasswordVisible = ref(false);
const deleteError = ref('');

// Linking States
const showLinkModal = ref(false);
const linkType = ref<'email' | 'phone'>('email');
const linkIdentifier = ref('');
const linkPassword = ref(''); // Actually current password
const isLinkPasswordVisible = ref(false);
const linkError = ref('');

const verificationSent = ref(false);
const verificationSentIdentifier = ref('');

const message = ref('');

const linkResult = ref<any>(null);
const linkVerificationRequestSent = ref(false);

// Computed for accounts
const accounts = computed(() => store.user.value?.accounts || []);
const emailAccount = computed(() => accounts.value.find(a => a.provider_type === 'email'));
// phoneAccount removed as phone features are disabled
const googleAccount = computed(() => accounts.value.find(a => a.provider_type === 'google'));
const zaloAccount = computed(() => accounts.value.find(a => a.provider_type === 'zalo'));

const verifiedCount = computed(() => accounts.value.filter(a => a.status === 'verified').length);

const canUnlink = (account: any) => {
    // Cannot unlink if it's the only verified account
    if (account.status === 'verified' && verifiedCount.value <= 1) return false;
    // Otherwise can unlink (unless it's the very last account, checking logic)
    if (accounts.value.length <= 1) return false;
    return true;
};

// Actions
const startEditName = () => {
    newDisplayName.value = store.user.value?.display_name || '';
    isEditingName.value = true;
};

const saveName = async () => {
    if (!newDisplayName.value.trim()) return;
    try {
        const res = await authService.updateProfile(newDisplayName.value);
        if (res.error) {
            message.value = res.error;
        } else {
            isEditingName.value = false;
            message.value = t('profile.save_success');
            setTimeout(() => message.value = '', 3000);
        }
    } catch (e: any) {
        message.value = e.message;
    }
};

const handleChangePassword = async () => {
    passwordError.value = '';
    if (!oldPassword.value || !newPassword.value) return;

    if (!isValidPassword(newPassword.value)) {
        passwordError.value = t('validation.password_format');
        return;
    }

    try {
        const res = await authService.changePassword({ 
            old_password: oldPassword.value, 
            new_password: newPassword.value 
        });
        if (res.error) {
            passwordError.value = res.error;
        } else {
            isChangingPassword.value = false;
            oldPassword.value = '';
            newPassword.value = '';
            message.value = t('profile.change_password_success');
            setTimeout(() => message.value = '', 3000);
        }
    } catch (e: any) {
        passwordError.value = t('common.error_occurred');
    }
};

const handleDeleteAccount = async () => {
    deleteError.value = '';
    if (!deletePassword.value) return;
    try {
        const res = await authService.deleteAccount(deletePassword.value);
        if (res.error) {
            deleteError.value = res.error;
        } else {
            router.push('/');
        }
    } catch (e: any) {
        deleteError.value = t('common.error_occurred');
    }
};

const loading = ref(false);
const verifyingIdentifier = ref('');
const showVerifyModal = ref(false);
const verifyModalType = ref('');
const verifyModalIdentifier = ref('');
const verifyTurnstileToken = ref('');

const openVerifyModal = (type: string, identifier: string) => {
    verifyModalType.value = type;
    verifyModalIdentifier.value = identifier;
    verifyTurnstileToken.value = '';
    showVerifyModal.value = true;
};

const startVerify = async () => {
    if (!verifyTurnstileToken.value) return;
    
    const type = verifyModalType.value;
    const identifier = verifyModalIdentifier.value;
    const token = verifyTurnstileToken.value;

    verificationSent.value = false;
    verifyingIdentifier.value = identifier;
    showVerifyModal.value = false;
    
    try {
        const res = await authService.requestVerification(type, identifier, token);
        if (res.error) {
            message.value = res.error;
            setTimeout(() => message.value = '', 3000);
        } else {
            verificationSentIdentifier.value = identifier;
            verificationSent.value = true;
            message.value = t('profile.verify_sent');
            setTimeout(() => {
                message.value = '';
            }, 5000);
        }
    } catch (e) {
        message.value = t('common.error_occurred');
        setTimeout(() => message.value = '', 3000);
    } finally {
        verifyingIdentifier.value = '';
    }
};

const startLink = (type: 'email' | 'phone') => {
    linkType.value = type;
    linkIdentifier.value = '';
    linkPassword.value = '';
    linkError.value = '';
    linkResult.value = null;
    linkVerificationRequestSent.value = false;
    showLinkModal.value = true;
};

const handleLink = async () => {
    linkError.value = '';
    if (!linkIdentifier.value || !linkPassword.value) {
        linkError.value = t('profile.link_missing_credentials');
        return;
    }

    if (linkType.value === 'email' && !isValidEmail(linkIdentifier.value)) {
        linkError.value = t('auth.invalid_email');
        return;
    }

    if (linkType.value === 'phone') {
        linkError.value = "Phone linking is temporarily disabled";
        return;
    }

    try {
        const res = await authService.linkIdentity({
            type: linkType.value,
            identifier: linkIdentifier.value,
            password: linkPassword.value
        });
        if (res.error) {
            if (res.can_verify) {
                linkResult.value = {
                    status: 'conflict',
                    type: res.type,
                    identifier: res.identifier
                };
            } else {
                linkError.value = res.error;
            }
        } else {
            showLinkModal.value = false;
            // Refresh profile to show new account immediately
            await authService.fetchProfile();
        }
    } catch (e) {
        linkError.value = t('common.error_occurred');
    }
};

const handleLinkClaim = async () => {
    if (!verifyTurnstileToken.value || !linkResult.value) return;
    loading.value = true;
    linkError.value = '';
    try {
        const res = await authService.requestVerification(
            linkResult.value.type,
            linkResult.value.identifier,
            verifyTurnstileToken.value,
            'claim'
        );
        if (res.error) {
            linkError.value = res.error;
        } else {
            linkVerificationRequestSent.value = true;
        }
    } catch (e) {
        linkError.value = t('common.error_occurred');
    } finally {
        loading.value = false;
    }
};

const unlinkAccount = async (type: string) => {
    // Find identifier
    const account = accounts.value.find(a => a.provider_type === type);
    if (!account) return;

    if (!confirm(t('profile.unlink_confirm'))) return;

    try {
        const res = await authService.unlinkIdentity(type, account.provider_id);
        if (res.error) {
            alert(res.error);
        } else {
            message.value = t('profile.unlink_success');
            setTimeout(() => message.value = '', 3000);
        }
    } catch (e) {
        alert(t('common.error_occurred'));
    }
};

const linkOAuth = (provider: string) => {
  alert(t('profile.oauth_link_placeholder', { provider }));
};

</script>

<template>
  <div class="page-wrapper">
    <PotoHeader />
    
    <div class="profile-container">
      <div v-if="message" class="toast-message">{{ message }}</div>

      <div class="profile-header">
        <div class="header-top">
            <button class="back-btn" @click="router.push('/dashboard')">
                <span class="arrow">←</span> {{ t('profile.back_to_dashboard') }}
            </button>
        </div>
        <h1>{{ t('profile.title') }}</h1>
      </div>

      <div class="profile-content" v-if="store.user.value">
        <!-- User Info Card -->
        <div class="profile-card">
          <div class="card-header">
            <h2>{{ t('profile.account_info') }}</h2>
            <button v-if="!isEditingName" class="edit-btn" @click="startEditName">{{ t('profile.edit') }}</button>
          </div>
          
          <div v-if="isEditingName" class="edit-name-group">
              <input v-model="newDisplayName" type="text" class="edit-input" :placeholder="t('profile.display_name')" />
              <div class="edit-actions">
                  <button class="save-btn" @click="saveName">{{ t('profile.save') }}</button>
                  <button class="cancel-btn" @click="isEditingName = false">{{ t('profile.cancel') }}</button>
              </div>
          </div>
          <div v-else class="info-row">
            <label>{{ t('profile.display_name') }}:</label>
            <span class="val">{{ store.user.value.display_name }}</span>
          </div>
          
          <div class="info-row">
            <label>{{ t('profile.id') }}:</label>
            <span class="mono">{{ store.user.value.id }}</span>
          </div>
          
          <div class="info-row">
            <label>{{ t('profile.join_date') }}:</label>
            <span>{{ new Date(store.user.value.created_at).toLocaleDateString() }}</span>
          </div>
        </div>

        <!-- Security & Linked Accounts -->
        <div class="profile-card">
          <div class="card-header">
             <h2>{{ t('profile.linked_accounts') }}</h2>
          </div>

          <div class="account-list">
             <!-- Email -->
             <div class="account-item">
                 <div class="account-info">
                     <span class="label">{{ t('profile.email') }}</span>
                     <template v-if="emailAccount">
                        <span class="val">{{ emailAccount.provider_id }}</span>
                        <span :class="['status-badge', emailAccount.status === 'verified' ? 'verified' : 'unverified']">
                            {{ emailAccount.status === 'verified' ? t('profile.verified') : t('profile.unverified') }}
                        </span>
                     </template>
                     <span v-else class="val placeholder">{{ t('profile.not_linked') }}</span>
                 </div>
                 <div class="account-actions">
                    <button v-if="emailAccount && emailAccount.status !== 'verified'" class="verify-btn" @click="openVerifyModal('email', emailAccount.provider_id)" :disabled="verifyingIdentifier === emailAccount.provider_id || verificationSentIdentifier === emailAccount.provider_id">
                        {{ verifyingIdentifier === emailAccount.provider_id ? t('common.loading') : (verificationSentIdentifier === emailAccount.provider_id ? t('profile.request_sent') : t('profile.verify_now')) }}
                    </button>
                    <button v-if="emailAccount" class="unlink-btn" :disabled="!canUnlink(emailAccount)" @click="unlinkAccount('email')">{{ t('profile.unlink') }}</button>
                    <button v-else class="link-btn" @click="startLink('email')">{{ t('profile.link') }}</button>
                 </div>
             </div>

             <!-- Phone -->
             <!-- Phone linking temporarily disabled -->
             <!-- <div class="account-item">
                 <div class="account-info">
                     <span class="label">{{ t('profile.phone') }}</span>
                     <template v-if="phoneAccount">
                        <span class="val">{{ phoneAccount.provider_id }}</span>
                        <span :class="['status-badge', phoneAccount.status === 'verified' ? 'verified' : 'unverified']">
                            {{ phoneAccount.status === 'verified' ? t('profile.verified') : t('profile.unverified') }}
                        </span>
                     </template>
                     <span v-else class="val placeholder">{{ t('profile.not_linked') }}</span>
                 </div>
                 <div class="account-actions">
                    <button v-if="phoneAccount && phoneAccount.status !== 'verified'" class="verify-btn" @click="openVerifyModal('phone', phoneAccount.provider_id)" :disabled="verifyingIdentifier === phoneAccount.provider_id || verificationSentIdentifier === phoneAccount.provider_id">
                        {{ verifyingIdentifier === phoneAccount.provider_id ? t('common.loading') : (verificationSentIdentifier === phoneAccount.provider_id ? t('profile.request_sent') : t('profile.verify_now')) }}
                    </button>
                    <button v-if="phoneAccount" class="unlink-btn" :disabled="!canUnlink(phoneAccount)" @click="unlinkAccount('phone')">{{ t('profile.unlink') }}</button>
                    <button v-else class="link-btn" @click="startLink('phone')">{{ t('profile.link') }}</button>
                 </div>
             </div> -->

             <!-- Google -->
             <div class="account-item">
                 <div class="account-info">
                     <span class="label">{{ t('profile.social_google') }}</span>
                     <span v-if="googleAccount" class="val">{{ googleAccount.provider_id }}</span>
                     <span v-else class="val placeholder">{{ t('profile.unverified') }}</span>
                 </div>
                 <div class="account-actions">
                    <button v-if="googleAccount" class="unlink-btn" :disabled="!canUnlink(googleAccount)" @click="unlinkAccount('google')">{{ t('profile.unlink') }}</button>
                    <button v-else class="link-btn" @click="linkOAuth('google')">{{ t('profile.link') }}</button>
                 </div>
             </div>

             <!-- Zalo -->
             <div class="account-item">
                 <div class="account-info">
                     <span class="label">{{ t('profile.social_zalo') }}</span>
                     <span v-if="zaloAccount" class="val">{{ zaloAccount.provider_id }}</span>
                     <span v-else class="val placeholder">{{ t('profile.unverified') }}</span>
                 </div>
                 <div class="account-actions">
                    <button v-if="zaloAccount" class="unlink-btn" :disabled="!canUnlink(zaloAccount)" @click="unlinkAccount('zalo')">{{ t('profile.unlink') }}</button>
                    <button v-else class="link-btn" @click="linkOAuth('zalo')">{{ t('profile.link') }}</button>
                 </div>
             </div>
          </div>
        </div>

        <!-- Change Password Section -->
        <div class="profile-card">
            <div class="card-header">
                <h2>{{ t('profile.change_password') }}</h2>
            </div>
            <p class="section-desc">{{ t('profile.change_password_desc') }}</p>
            
            <div v-if="isChangingPassword" class="password-form">
                <div class="form-group password-group-col">
                    <label>{{ t('profile.old_password') }}</label>
                    <div class="input-with-toggle">
                        <input v-model="oldPassword" :type="isOldPasswordVisible ? 'text' : 'password'" class="edit-input" />
                        <button type="button" class="toggle-password-inline" @click="isOldPasswordVisible = !isOldPasswordVisible">
                            {{ isOldPasswordVisible ? t('common.hide') : t('common.show') }}
                        </button>
                    </div>
                </div>
                <div class="form-group password-group-col">
                    <label>{{ t('profile.new_password') }}</label>
                    <div class="input-with-toggle">
                        <input v-model="newPassword" :type="isNewPasswordVisible ? 'text' : 'password'" class="edit-input" />
                        <button type="button" class="toggle-password-inline" @click="isNewPasswordVisible = !isNewPasswordVisible">
                            {{ isNewPasswordVisible ? t('common.hide') : t('common.show') }}
                        </button>
                    </div>
                </div>
                <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
                <div class="edit-actions">
                    <button class="save-btn" @click="handleChangePassword">{{ t('profile.update') }}</button>
                    <button class="cancel-btn" @click="isChangingPassword = false">{{ t('profile.cancel') }}</button>
                </div>
            </div>
            <button v-else class="action-btn-main" @click="isChangingPassword = true">{{ t('profile.change_password') }}</button>
        </div>

        <!-- Danger Zone -->
        <div class="profile-card danger">
            <div class="card-header">
                <h2>{{ t('profile.delete_account') }}</h2>
            </div>
            <p class="section-desc">{{ t('profile.delete_warning') }}</p>

            <div v-if="isDeletingAccount" class="delete-form">
                <div class="form-group password-group-col">
                    <label>{{ t('profile.delete_confirm_pass') }}</label>
                    <div class="input-with-toggle">
                        <input v-model="deletePassword" :type="isDeletePasswordVisible ? 'text' : 'password'" class="edit-input danger-border" />
                        <button type="button" class="toggle-password-inline" @click="isDeletePasswordVisible = !isDeletePasswordVisible">
                            {{ isDeletePasswordVisible ? t('common.hide') : t('common.show') }}
                        </button>
                    </div>
                </div>
                <p v-if="deleteError" class="error-text">{{ deleteError }}</p>
                <div class="edit-actions">
                    <button class="delete-confirm-btn" @click="handleDeleteAccount">{{ t('profile.delete_btn') }}</button>
                    <button class="cancel-btn" @click="isDeletingAccount = false">{{ t('profile.cancel') }}</button>
                </div>
            </div>
            <button v-else class="delete-init-btn" @click="isDeletingAccount = true">{{ t('profile.delete_account') }}</button>
        </div>
      </div>

      <div v-else class="loading-state">
          {{ t('profile.loading') }}
      </div>
    </div>

    <!-- Modals -->
    <div v-if="showLinkModal" class="modal-overlay">
        <div class="modal-content">
            <h3>{{ t('profile.link') }} {{ t('profile.email') }}</h3>
            
            <div v-if="!linkResult">
                <div class="form-group">
                    <input v-model="linkIdentifier" :placeholder="t('profile.email')" class="edit-input" />
                </div>
                <div class="form-group password-group-col">
                    <div class="input-with-toggle">
                        <input v-model="linkPassword" :type="isLinkPasswordVisible ? 'text' : 'password'" :placeholder="t('profile.confirm_current_password_placeholder')" class="edit-input" />
                        <button type="button" class="toggle-password-inline" @click="isLinkPasswordVisible = !isLinkPasswordVisible">
                            {{ isLinkPasswordVisible ? t('common.hide') : t('common.show') }}
                        </button>
                    </div>
                </div>
                <p v-if="linkError" class="error-text">{{ linkError }}</p>
                <div class="edit-actions">
                    <button class="save-btn" @click="handleLink">{{ t('profile.link') }}</button>
                    <button class="cancel-btn" @click="showLinkModal = false">{{ t('profile.cancel') }}</button>
                </div>
            </div>

            <div v-else-if="linkResult.status === 'conflict'">
                <div v-if="!linkVerificationRequestSent">
                    <p class="mb-4">{{ t('profile.conflict_exists', { identifier: linkResult.identifier }) }}</p>
                    <p class="mb-4 small-text">{{ t('profile.conflict_verify_prompt_link', { type: linkResult.type }) }}</p>
                    
                    <TurnstileWidget 
                        sitekey="0x4AAAAAACVkL3x1MJ39LV_4"
                        @verify="(token) => verifyTurnstileToken = token"
                        @expire="verifyTurnstileToken = ''"
                    />

                    <p v-if="linkError" class="error-text mt-4">{{ linkError }}</p>

                    <div class="edit-actions mt-4">
                        <button class="save-btn" @click="handleLinkClaim" :disabled="!verifyTurnstileToken">{{ t('profile.verify_now') }}</button>
                        <button class="cancel-btn" @click="linkResult = null">{{ t('profile.back') }}</button>
                    </div>
                </div>
                <div v-else class="text-center">
                    <p class="success-text">{{ t('profile.verify_sent') }}</p>
                    <p class="small-text">{{ t('profile.check_inbox_link') }}</p>
                    <button class="cancel-btn mt-4" @click="showLinkModal = false">{{ t('profile.close') }}</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Verification Modal -->
    <div v-if="showVerifyModal" class="modal-overlay">
        <div class="modal-content">
            <h3>{{ t('profile.verify_identity') }}</h3>
            <p class="text-center mb-4">{{ t('profile.verify_prompt', { identifier: verifyModalIdentifier }) }}</p>
            
            <TurnstileWidget 
                sitekey="0x4AAAAAACVkL3x1MJ39LV_4"
                @verify="(token) => verifyTurnstileToken = token"
                @expire="verifyTurnstileToken = ''"
            />

            <div class="edit-actions mt-4">
                <button class="save-btn" @click="startVerify" :disabled="!verifyTurnstileToken">{{ t('profile.verify_now') }}</button>
                <button class="cancel-btn" @click="showVerifyModal = false">{{ t('profile.cancel') }}</button>
            </div>
        </div>
    </div>

    <PotoFooter />
  </div>
</template>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--poto-beige-2);
}

.profile-container {
    flex: 1;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    padding: 2rem;
}

.toast-message {
    background-color: var(--poto-green);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    text-align: center;
    font-weight: 600;
}

.profile-header h1 {
    font-family: var(--font-primary);
    color: var(--poto-green);
    margin-bottom: 2rem;
    font-size: 2.5rem;
}

.header-top {
    margin-bottom: 1rem;
}

.back-btn {
    background: none;
    border: none;
    color: var(--poto-green);
    font-weight: 700;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0;
    text-transform: uppercase;
}

.back-btn:hover {
    text-decoration: underline;
}

.back-btn .arrow {
    font-size: 1.2rem;
}

.profile-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.profile-card.danger {
    border: 1px solid #fee2e2;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
}

.card-header h2 {
    font-size: 1.25rem;
    color: var(--poto-dark);
    margin: 0;
    font-weight: 700;
}

.section-desc {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}

.edit-btn {
    text-transform: uppercase;
    font-weight: 700;
    color: var(--poto-green);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
}

.info-row {
    display: flex;
    margin-bottom: 1rem;
    font-size: 1rem;
    align-items: center;
}

.info-row label {
    width: 150px;
    font-weight: 600;
    color: #666;
}

.val {
    color: var(--poto-dark);
    font-weight: 500;
}

.val.placeholder {
    color: #bbb;
    font-style: italic;
}

.mono {
    font-family: monospace;
    color: #666;
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
}

/* Edit Name */
.edit-name-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.edit-input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    width: 100%;
}

.edit-actions {
    display: flex;
    gap: 1rem;
}

.save-btn {
    background: var(--poto-green);
    color: white;
    border: none;
    padding: 0.6rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
}

.cancel-btn {
    background: #eee;
    color: #666;
    border: none;
    padding: 0.6rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
}

/* Account List */
.account-list {
    display: flex;
    flex-direction: column;
}

.account-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 0;
    border-bottom: 1px solid #f5f5f5;
}

.account-item:last-child {
    border-bottom: none;
}

.account-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.account-info .label {
    font-size: 0.8rem;
    color: #999;
    text-transform: uppercase;
    font-weight: 700;
}

.status-badge {
    display: inline-block;
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 700;
    margin-top: 2px;
    width: fit-content;
}

.status-badge.verified {
    background: #dcfce7;
    color: #166534;
}

.status-badge.unverified {
    background: #fee2e2;
    color: #991b1b;
}

.account-actions {
    display: flex;
    gap: 0.5rem;
}

.verify-btn {
    background: var(--poto-green);
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
}

.unlink-btn {
    background: white;
    color: #ef4444;
    border: 1px solid #fee2e2;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
}

.unlink-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.link-btn {
    background: white;
    color: var(--poto-green);
    border: 1px solid #dcfce7;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
}

/* Password Form */
.form-group {
    margin-bottom: 1.25rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #666;
    font-size: 0.9rem;
}

.input-with-toggle {
    position: relative;
    display: flex;
    align-items: center;
}

.toggle-password-inline {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: var(--poto-green);
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
}

.toggle-password-inline:hover {
    opacity: 0.8;
}

.error-text {
    color: #ef4444;
    font-size: 0.85rem;
    margin-bottom: 1rem;
}

.action-btn-main {
    background: white;
    border: 1.5px solid var(--poto-green);
    color: var(--poto-green);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn-main:hover {
    background: var(--poto-green);
    color: white;
}

/* Danger Zone Buttons */
.delete-init-btn {
    background: white;
    border: 1.5px solid #ef4444;
    color: #ef4444;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
}

.delete-init-btn:hover {
    background: #ef4444;
    color: white;
}

.delete-confirm-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.6rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
}

.danger-border {
    border-color: #fca5a5 !important;
}

.loading-state {
    text-align: center;
    padding: 4rem;
    color: #888;
}

/* Modals */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.modal-content h3 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: var(--poto-dark);
}

.modal-content .form-group {
    margin-bottom: 1rem;
}

@media (max-width: 640px) {
    .profile-container {
        padding: 1rem;
    }
    
    .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }
    
    .info-row label {
        width: 100%;
    }
}
</style>

