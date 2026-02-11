<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import PotoHeader from '../components/PotoHeader.vue';
import PotoFooter from '../components/PotoFooter.vue';
import { bambooService } from '../services/bamboo';

const router = useRouter(); 
const { t } = useI18n();
const activeTab = ref('bamboo');
const bambooFilter = ref('all'); // 'all', 'mine', 'followed'

interface BambooItem {
  bambooId: string;
  batchId: string;
  sig: string;
  bambooName?: string;
  commonName: string;
  regionName: string;
  daysOld: number;
  co2_kg: string;
  isOwner: boolean;
}

const ownedBamboo = ref<BambooItem[]>([]);
const followedBamboo = ref<BambooItem[]>([]);
const loading = ref(true);

const fetchBamboo = async () => {
  try {
    const data = await bambooService.getMyBamboo();
    ownedBamboo.value = data.owned;
    followedBamboo.value = data.followed;
  } catch (e: any) {
    if (e.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

const filteredBamboo = computed(() => {
  if (bambooFilter.value === 'mine') return ownedBamboo.value;
  if (bambooFilter.value === 'followed') return followedBamboo.value;
  
  // For 'all', merge and unique
  const all = [...ownedBamboo.value, ...followedBamboo.value];
  const unique = Array.from(new Set(all.map(b => b.bambooId)))
    .map(id => all.find(b => b.bambooId === id)!);
  return unique;
});

const getFormattedAge = (days: number) => {
  if (days < 365) {
    return t('scan.age_format_days', { days });
  } else {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    return t('scan.age_format_years', { years, days: remainingDays });
  }
};

onMounted(fetchBamboo);

const navigateToScan = (item: BambooItem) => {
  router.push({ 
    path: '/scan', 
    query: { 
      bambooId: item.bambooId, 
      batchId: item.batchId, 
      sig: item.sig 
    } 
  });
};
</script>

<template>
  <div class="dashboard-page">
    <PotoHeader :title="t('dashboard.title')" showMenu />
    
    <main class="main-content">
      <div class="tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'bamboo' }"
          @click="activeTab = 'bamboo'"
        >
          {{ t('dashboard.your_bamboo') }}
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'tracker' }"
          @click="activeTab = 'tracker'"
        >
          {{ t('dashboard.poto_tracker') }}
        </button>
      </div>

      <div v-if="activeTab === 'bamboo'">
        <!-- Filter Chips -->
        <div class="filters">
          <button 
            v-for="f in ['all', 'mine', 'followed']" 
            :key="f"
            :class="['filter-chip', { active: bambooFilter === f }]"
            @click="bambooFilter = f"
          >
            {{ t(`dashboard.filter_${f}`) }}
          </button>
        </div>

        <div v-if="loading" class="loader-container">
          <div class="loader"></div>
        </div>

        <div v-else-if="filteredBamboo.length > 0" class="plant-grid">
          <div v-for="plant in filteredBamboo" :key="plant.bambooId" class="plant-card">
            <div class="card-bg" @click="navigateToScan(plant)">
              <div class="card-header">
                <span v-if="plant.isOwner" class="owner-badge">{{ t('dashboard.owner') }}</span>
                <span class="co2-badge">{{ plant.co2_kg }} KG CO<sub>2</sub></span>
              </div>
              <img src="../assets/bamboo_stalk.png" alt="Bamboo" class="plant-img" />
              <div class="plant-details">
                <p class="name" :title="plant.commonName">{{ plant.bambooName || plant.commonName }}</p>
                <p class="location">{{ getFormattedAge(plant.daysOld) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="tracker-empty">
           <p>{{ t('dashboard.no_tracker') }}</p>
        </div>
      </div>

      <div v-else class="tracker-empty">
        <p>{{ t('dashboard.no_tracker') }}</p>
        <router-link to="/" class="buy-link">{{ t('common.buy_now') }}</router-link>
      </div>
    </main>

    <PotoFooter />
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: white;
}

.main-content {
  flex: 1;
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.tabs {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 3rem;
  justify-content: flex-start;
}

.tab-button {
  padding: 0.8rem 2rem;
  font-family: var(--font-secondary);
  font-weight: 700;
  font-size: 1.1rem;
  border: 1.5px solid var(--poto-green);
  background: transparent;
  color: var(--poto-green);
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.tab-button.active {
  background-color: #3e9447; /* Slightly darker green from mockup */
  color: white;
}

.plant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.plant-card {
  aspect-ratio: 4 / 3.5;
  cursor: pointer;
}

.card-bg {
  background-color: var(--poto-beige-2);
  height: 100%;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  transition: transform 0.2s;
  overflow: hidden;
}

.card-bg:hover {
  transform: translateY(-4px);
}

.plant-img {
  height: 120px;
  width: auto;
  object-fit: contain;
}

.plant-details {
  width: 100%;
  font-family: var(--font-secondary);
  font-weight: 600;
  color: var(--poto-dark);
  overflow: hidden;
}

.plant-details .name {
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plant-details .location {
  font-size: 0.9rem;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plant-img {
  height: 160px;
  width: auto;
  object-fit: contain;
}

.plant-details {
  font-family: var(--font-secondary);
  font-weight: 600;
  color: var(--poto-dark);
}

.plant-details .age {
  font-size: 1rem;
  margin-bottom: 0.2rem;
}

.plant-details .location {
  font-size: 0.9rem;
  opacity: 0.8;
}

.tracker-empty {
  text-align: center;
  padding: 5rem 0;
  color: #666;
  font-family: var(--font-secondary);
}

.buy-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--poto-green);
  font-weight: 700;
  text-decoration: underline;
}

.filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  background: #f1f5f9;
  color: #64748b;
  font-weight: 700;
  font-size: 0.875rem;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.filter-chip.active {
  background: var(--poto-green);
  color: white;
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--poto-green);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

.card-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.owner-badge {
  background: #dcfce7;
  color: #166534;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.co2-badge {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
}

.plant-details .name {
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 0.2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .tabs {
    flex-direction: row; /* Keep horizontal on mobile if possible, or scroll */
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  .tab-button {
    white-space: nowrap;
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
  .plant-grid {
    grid-template-columns: 1fr;
  }
}
</style>
