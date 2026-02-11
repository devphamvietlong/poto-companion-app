<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import PotoHeader from '../components/PotoHeader.vue';
import PotoFooter from '../components/PotoFooter.vue';
import PrimaryButton from '../components/PrimaryButton.vue';
import { bambooService, type BambooInfo } from '../services/bamboo';
import { useUserStore } from '../store/user';
import { Heart, UserCheck, MapPin, Calendar, Info, AlertCircle, IdCardLanyard, PenLine, Dna, Dices } from 'lucide-vue-next';

const store = useUserStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const bambooData = ref<BambooInfo | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showClaimPopup = ref(false);
const showRenamePopup = ref(false);
const claiming = ref(false);
const renaming = ref(false);
const newName = ref('');
const claimName = ref('');
const following = ref(false);
const isAuthenticated = computed(() => store.isAuthenticated.value || !!localStorage.getItem('token'));

// --- Impact Logic ---
const currentQuoteIndex = ref(0);
const fadeTransition = ref(false);
let quoteInterval: ReturnType<typeof setInterval> | null = null;

// Conversion factors per 1kg CO2
const IMPACT_CONFIG = {
  stage1: {
    maxDays: 180,
    quotes: [
      { key: 'q1', factor: 120 }, // Smartphone Charges
      { key: 'q2', factor: 5000 }, // Google Searches
      { key: 'q3', factor: 25 },   // Netflix Hours
      { key: 'q4', factor: 10 },   // Espressos (≈0.1 kg CO2 per cup → ~10 cups/kg)
      { key: 'q5', factor: 100 }    // Single-use plastic bags (~0.01 kg CO2 per bag → ~100 bags/kg)
    ]
  },
  stage2: {
    maxDays: 547, // ~1.5 years
    quotes: [
      { key: 'q1', factor: 4 },    // Driving km
      { key: 'q2', factor: 2 },    // Hot Showers (~0.5 kg CO2 per shower → ~2 showers/kg)
      { key: 'q3', factor: 12.5 }, // Plastic Bottles
      { key: 'q4', factor: 37 },   // Beef grams
      { key: 'q5', factor: 20 }    // 100W lightbulb hours (~0.5 kg CO2/kWh → ~20 hours/kg)
    ]
  },
  stage3: {
    maxDays: 1460, // 4 years
    quotes: [
      { key: 'q1', factor: 0.05 }, // Jeans
      { key: 'q2', factor: 35 },   // Gaming Hours
      { key: 'q3', factor: 1 },    // Laundry Loads
      { key: 'q4', factor: 0.016 },// Smartphones mfg
      { key: 'q5', factor: 0.05 },  // Oak Trees (annual absorption)
      { key: 'q6', factor: 0.433 }, // Liters of gasoline burned (~2.31 kg CO2 per L)
      { key: 'q7', factor: 2 },     // kWh of electricity (grid avg ~0.5 kg CO2/kWh)
      { key: 'q8', factor: 200 }    // Hours of a 10W LED (1 kg CO2 ≈ 200 hours at 10W)
    ]
  },
  stage4: {
    maxDays: Infinity,
    quotes: [
      { key: 'q1', factor: 0.005 }, // Macbook mfg (~200 kg CO2 per laptop → 0.005 units/kg)
      { key: 'q2', factor: 4 },     // Flight miles (~0.25 kg CO2 per passenger-mile → ~4 miles/kg)
      { key: 'q3', factor: 4 },    // Road Trip km
      { key: 'q4', factor: 0 },    // Locked kg (special case, uses raw kg)
      { key: 'q5', factor: 10 }    // Grass Lawn sq m
    ]
  }
};

const currentStage = computed(() => {
  if (!bambooData.value) return 'stage1';
  const days = bambooData.value.daysOld;
  if (days <= IMPACT_CONFIG.stage1.maxDays) return 'stage1';
  if (days <= IMPACT_CONFIG.stage2.maxDays) return 'stage2';
  if (days <= IMPACT_CONFIG.stage3.maxDays) return 'stage3';
  return 'stage4';
});

const currentImpact = computed(() => {
  if (!bambooData.value) return '';

  // Non-growing statuses have fixed messages
  if (bambooData.value.status === 'harvested') {
    return t('scan.status_quotes.harvested', { n: bambooData.value.co2_kg });
  }
  if (bambooData.value.status === 'failed') {
    return t('scan.status_quotes.failed');
  }
  if (bambooData.value.status === 'scheduled') {
    return t('scan.status_quotes.scheduled');
  }

  const stageConfig = IMPACT_CONFIG[currentStage.value];
  const quoteConfig = stageConfig.quotes[currentQuoteIndex.value];

  if (!quoteConfig) return '';

  // Calculate n value
  let n = 0;
  const co2 = parseFloat(bambooData.value.co2_kg);

  // If no impact yet, show "Just started" message
  if (co2 <= 0) {
    return t('scan.no_impact_yet');
  }

  // Special case for "Locked kg" in Stage 4 (q4) where we just show the kg value itself if needed,
  // but the quote text says "At {n} kg...", so we just use the CO2 value.
  if (currentStage.value === 'stage4' && quoteConfig.key === 'q4') {
    n = Math.round(co2 * 10) / 10;
    return t(`scan.impact_quotes.${currentStage.value}.${quoteConfig.key}`, {
      n: n.toLocaleString()
    });
  }

  n = Math.ceil(co2 * quoteConfig.factor);
  // Ensure at least 1 for better UX unless it's strictly 0
  if (n === 0 && co2 > 0) n = 1;

  return t(`scan.impact_quotes.${currentStage.value}.${quoteConfig.key}`, {
    n: n.toLocaleString()
  });
});

const startQuoteRotation = () => {
  // Only rotate for growing plants
  if (bambooData.value?.status !== 'growing') return;
  
  quoteInterval = setInterval(() => {
    fadeTransition.value = true;
    setTimeout(() => {
      const stageConfig = IMPACT_CONFIG[currentStage.value];
      currentQuoteIndex.value = (currentQuoteIndex.value + 1) % stageConfig.quotes.length;
      fadeTransition.value = false;
    }, 500); // Wait for fade out
  }, 120000); // Change every 2 minutes
};

const handleNextQuote = () => {
    // Only allow manual rotation if growing
  if (bambooData.value?.status !== 'growing') return;

  fadeTransition.value = true;
  setTimeout(() => {
    const stageConfig = IMPACT_CONFIG[currentStage.value];
    currentQuoteIndex.value = (currentQuoteIndex.value + 1) % stageConfig.quotes.length;
    fadeTransition.value = false;
  }, 500); // Wait for fade out
};

const formattedAge = computed(() => {
  if (!bambooData.value) return '';
  
  if (bambooData.value.status === 'harvested' && bambooData.value.harvestedDate) {
    const date = new Date(bambooData.value.harvestedDate).toLocaleDateString();
    return t('scan.status_badge.harvested_date', { date });
  }

  const days = bambooData.value.daysOld;
  if (days < 365) {
    return t('scan.age_format_days', { days });
  } else {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    return t('scan.age_format_years', { years, days: remainingDays });
  }
});

const statusBadge = computed(() => {
  if (!bambooData.value) return null;
  const s = bambooData.value.status || 'growing';
  return {
    text: t(`scan.status_badge.${s}`),
    class: `status-${s}`
  };
});

const fetchData = async () => {
  const bambooId = route.query.bambooId as string || route.query.potId as string;
  const batchId = route.query.batchId as string;
  const sig = route.query.sig as string;

  if (!bambooId || !batchId || !sig) {
    error.value = 'error_signature';
    loading.value = false;
    return;
  }

  try {
    const data = await bambooService.getInfo(bambooId, batchId, sig);
    bambooData.value = data;
    following.value = !!data.isFollowing;

    // Randomize initial quote index based on current stage
    const stageConfig = IMPACT_CONFIG[currentStage.value];
    currentQuoteIndex.value = Math.floor(Math.random() * stageConfig.quotes.length);

    // Show claim popup if no owner and user is authenticated
    if (!data.ownerId && isAuthenticated.value) {
      showClaimPopup.value = true;
    }
    
    // Start rotation only if applicable
    if (data.status === 'growing') {
        startQuoteRotation();
    }
  } catch (e: any) {
    if (e.response?.data?.error === 'Batch capacity reached') {
      error.value = 'error_batch_full';
    } else if (e.response?.status === 403) {
      error.value = 'error_signature';
    } else if (e.response?.status === 404) {
      error.value = 'error_not_found';
    } else {
      error.value = 'error_generic';
    }
  } finally {
    loading.value = false;
  }
};

const handleFollow = async () => {
  if (!bambooData.value) return;
  try {
    if (following.value) {
      await bambooService.unfollow(bambooData.value.bambooId);
      following.value = false;
    } else {
      await bambooService.follow(bambooData.value.bambooId);
      following.value = true;
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      router.push('/login');
    }
  }
};

const handleClaim = async () => {
  if (!bambooData.value) return;
  claiming.value = true;
  try {
    await bambooService.claim(bambooData.value.bambooId, claimName.value);
    showClaimPopup.value = false;
    await fetchData(); // Refresh data
  } catch (e: any) {
    if (e.response?.status === 401) {
      router.push('/login');
    } else {
      alert(e.response?.data?.error || 'Claim failed');
    }
  } finally {
    claiming.value = false;
  }
};

const handleEditName = () => {
  newName.value = bambooData.value?.bambooName || '';
  showRenamePopup.value = true;
};

const submitRename = async () => {
  if (!bambooData.value) return;
  renaming.value = true;
  try {
    await bambooService.rename(bambooData.value.bambooId, newName.value);
    bambooData.value.bambooName = newName.value;
    showRenamePopup.value = false;
  } catch (e: any) {
    alert(e.response?.data?.error || 'Rename failed');
  } finally {
    renaming.value = false;
  }
};

onMounted(() => {
  fetchData();
});

onUnmounted(() => {
  if (quoteInterval) clearInterval(quoteInterval);
});
</script>

<template>
  <div class="scan-page">
    <PotoHeader />

    <main class="main-content">
      <template v-if="loading">
        <div class="loading-state">
          <h1 class="status-text">{{ t('scan.loading') }}</h1>
          <div class="loader"></div>
        </div>
      </template>

      <template v-else-if="error">
        <div class="error-state">
          <AlertCircle class="error-icon" :size="64" />
          <h1 class="status-text">{{ t(`scan.${error}`) }}</h1>
          <PrimaryButton :text="t('not_found.home')" @click="router.push('/')" />
        </div>
      </template>

      <template v-else-if="bambooData">
        <div class="header-top" v-if="isAuthenticated">
          <button class="back-btn" @click="router.push('/dashboard')">
            <span class="arrow">←</span> {{ t('dashboard.title') }}
          </button>
        </div>
        <div class="panels-container">
          <!-- Panel 1: Impact -->
          <section class="panel impact-panel">
            <h2 class="panel-title">{{ t('scan.impact') }}</h2>
            <div class="impact-content">
              <div class="co2-value">
                <span class="number">{{ bambooData.co2_kg }}</span>
                <span class="unit">KG CO<sub>2</sub></span>
              </div>
              <p :class="['impact-description', { 'fade-out': fadeTransition }]">
                {{ currentImpact }}
              </p>
              <button v-if="bambooData.status === 'growing'" class="dices-btn" @click="handleNextQuote" title="Next quote">
                <Dices :size="30" />
              </button>
            </div>
          </section>

          <!-- Panel 2: Growth -->
          <section class="panel growth-panel">
            <h2 class="panel-title">{{ t('scan.growth') }}</h2>
            <div class="growth-content">
              <div v-if="statusBadge" :class="['status-badge', statusBadge.class]">
                {{ statusBadge.text }}
              </div>
              <img src="../assets/bamboo_stalk.png" alt="Bamboo" class="bamboo-img" />
              <div class="growth-stats">
                <div class="stat">
                  <Calendar :size="20" />
                  <span>{{ formattedAge }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Panel 3: Details & Actions -->
          <section class="panel details-panel">
            <h2 class="panel-title">{{ t('scan.details') }}</h2>
            <div class="details-content">
              <div class="info-row">
                <IdCardLanyard :size="20" />
                <div class="info-text">
                  <p class="label">{{ t('scan.bamboo_name') }}</p>
                  <p class="value">{{ bambooData.bambooName || t('scan.unnamed') }}
                    <PenLine v-if="bambooData.isOwner" :size="20" @click="handleEditName" class="edit-icon" />
                  </p>
                </div>
              </div>

              <div class="info-row">
                <Dna :size="20" />
                <div class="info-text">
                  <p class="label">{{ t('scan.species') }}</p>
                  <p class="value">{{ bambooData.commonName }}</p>
                </div>
              </div>

              <div class="info-row">
                <MapPin :size="20" />
                <div class="info-text">
                  <p class="label">{{ t('scan.location') }}</p>
                  <a :href="`https://www.google.com/maps/place/${bambooData.location.lat},${bambooData.location.lng}`"
                    target="_blank" class="value">{{ bambooData.regionName }}</a>
                </div>
              </div>

              <div class="info-row owner-info">
                <UserCheck :size="20" />
                <div class="info-text">
                  <p class="label">{{ t('scan.ownership') }}</p>
                  <p class="value" v-if="bambooData.ownerId">
                    {{ t('scan.owned_by', { name: bambooData.isOwner ? t('scan.you') : t('scan.other') }) }}
                  </p>
                  <p class="value unclaimed" v-else>
                    {{ t('scan.unclaimed') }}
                  </p>
                </div>
              </div>

              <div class="action-buttons">
                <button @click="handleFollow" :class="['follow-btn', { active: following }]">
                  <Heart :size="20" :fill="following ? 'currentColor' : 'none'" />
                  {{ following ? t('scan.unfollow') : t('scan.follow') }}
                </button>
              </div>
            </div>
          </section>
        </div>
      </template>
    </main>

    <!-- Claim Modal -->
    <div v-if="showClaimPopup" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <Info class="info-icon" :size="32" />
          <h3>{{ t('scan.claim_title') }}</h3>
        </div>
        <p>{{ t('scan.claim_desc') }}</p>

        <div class="input-group">
          <label>{{ t('scan.bamboo_name') }} ({{ t('common.optional') }})</label>
          <input type="text" v-model="claimName" :placeholder="t('scan.unnamed')" class="modal-input" />
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showClaimPopup = false">{{ t('scan.close') }}</button>
          <button class="claim-btn" @click="handleClaim" :disabled="claiming">
            <span v-if="claiming" class="loader small"></span>
            <span v-else>{{ t('scan.claim_btn') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Rename Modal -->
    <div v-if="showRenamePopup" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <PenLine class="info-icon" :size="32" />
          <h3>{{ t('scan.bamboo_name') }}</h3>
        </div>

        <div class="input-group">
          <input type="text" v-model="newName" class="modal-input" maxlength="50" />
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showRenamePopup = false">{{ t('common.cancel') }}</button>
          <button class="claim-btn" @click="submitRename" :disabled="renaming">
            <span v-if="renaming" class="loader small"></span>
            <span v-else>{{ t('profile.save') }}</span>
          </button>
        </div>
      </div>
    </div>

    <PotoFooter />
  </div>
</template>

<style scoped>
.scan-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.loading-state,
.error-state {
  height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.status-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--poto-dark);
  margin-bottom: 2rem;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1.5rem;
}

.panels-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.panel {
  background: white;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  display: flex;
  flex-direction: column;
}

.panel-title {
  font-size: 0.875rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 2rem;
}

/* Impact Panel */
.impact-panel {
  border-top: 6px solid var(--poto-lime);
  position: relative;
}

.impact-content {
  display: flex;
  flex-direction: column;
}

.co2-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.co2-value .number {
  font-size: 4rem;
  font-weight: 800;
  color: var(--poto-dark);
}

.co2-value .unit {
  font-size: 1.25rem;
  font-weight: 700;
  color: #64748b;
}

.impact-description {
  font-size: 1.3rem;
  line-height: 1.6;
  color: #475569;
  transition: opacity 0.5s ease-in-out;
  opacity: 1;
}

.impact-description.fade-out {
  opacity: 0;
}

.next-quote-btn {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--poto-lime);
  color: var(--poto-dark);
  border: none;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.next-quote-btn:hover {
  background: var(--poto-green);
  color: white;
  transform: translateY(-2px);
}

.next-quote-btn:active {
  transform: translateY(0);
}

.dices-btn {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--poto-lime);
  transition: all 0.3s ease;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dices-btn:hover {
  color: var(--poto-green);
  transform: rotate(90deg) scale(1.1);
}

.dices-btn:active {
  transform: rotate(90deg) scale(0.95);
}

/* Growth Panel */
.growth-panel {
  border-top: 6px solid #10b981;
}

.growth-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.bamboo-img {
  height: 350px;
  object-fit: contain;
  margin-bottom: 2rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--poto-dark);
}

/* Details Panel */
.details-panel {
  border-top: 6px solid var(--poto-olive);
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.info-text .label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}

.info-text .value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--poto-dark);
}

.value.unclaimed {
  color: #f59e0b;
}

.action-buttons {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.follow-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  font-weight: 700;
  color: #64748b;
  transition: all 0.2s;
}

.follow-btn:hover {
  border-color: #f43f5e;
  color: #f43f5e;
}

.follow-btn.active {
  background: #fff1f2;
  border-color: #f43f5e;
  color: #f43f5e;
}

.header-top {
  margin-bottom: 2rem;
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

.edit-icon {
  cursor: pointer;
  color: var(--poto-green);
}

.edit-icon:hover {
  color: var(--poto-green-hover);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 2rem;
  padding: 2.5rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-icon {
  color: var(--poto-blue);
}

.modal-content h3 {
  font-size: 1.5rem;
  font-weight: 800;
}

.modal-content p {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 2.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.cancel-btn {
  flex: 1;
  padding: 1rem;
  font-weight: 700;
  color: #64748b;
  border-radius: 1rem;
  transition: background 0.2s;
  cursor: pointer;
}

.cancel-btn:hover {
  background: red;
  color: white;
}

.claim-btn {
  flex: 2;
  padding: 1rem;
  background: var(--poto-white);
  font-weight: 800;
  border-radius: 1rem;
  transition: transform 0.2s, background 0.2s;
  cursor: pointer;
  font-family: var(--font-secondary);
}

.claim-btn:hover {
  background: var(--poto-green);
  color: white;
}

.claim-btn:active {
  transform: scale(0.98);
}

/* Loader */
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--poto-blue);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

.loader.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .panels-container {
    grid-template-columns: 1fr;
  }
}

.input-group {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #64748b;
}

.modal-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  font-size: 1.1rem;
  outline: none;
  transition: border-color 0.2s;
}

.modal-input:focus {
  border-color: var(--poto-blue);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 800;
  font-size: 0.875rem;
  text-transform: uppercase;
  margin-bottom: 1rem;
  letter-spacing: 0.05em;
  display: inline-block;
}

.status-growing {
  background-color: #dcfce7;
  color: #166534;
}

.status-harvested {
  background-color: #fef3c7;
  color: #92400e;
}

.status-failed {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-scheduled {
  background-color: #dbeafe;
  color: #1e40af;
}
</style>
