<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import PotoHeader from '../components/PotoHeader.vue';
import PotoFooter from '../components/PotoFooter.vue';
import PrimaryButton from '../components/PrimaryButton.vue';

const router = useRouter();
const { t } = useI18n();

const navigateToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="home-page">
    <PotoHeader />

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title" v-html="t('home.hero_title').replace('\n', '<br />')"></h1>
        <p class="hero-subtitle">{{ t('home.hero_subtitle') }}</p>
        <PrimaryButton :text="t('common.start_now')" variant="hero" @click="navigateToLogin" />
      </div>
    </section>

    <!-- Bamboo Feature Section -->
    <section class="bamboo-section">
      <div class="container section-padding">
        <h2 class="section-title bold-title center">{{ t('home.bamboo_promo') }}</h2>
        <div class="bamboo-content">
          <div class="bamboo-image">
            <img src="../assets/bamboo_stalk.png" alt="Bamboo" />
          </div>
          <div class="feature-cards">
            <div class="feature-card">
              <div class="card-icon">
                <img src="../assets/poto-pot-preview.jpg" alt="Pot Preview" />
              </div>
              <div class="card-text">
                <h3>{{ t('home.scan_title') }}</h3>
                <p>{{ t('home.scan_desc') }}</p>
              </div>
            </div>
            <div class="feature-card">
              <div class="card-icon">
                <img src="../assets/bamboo_shoot.png" alt="Theo dõi" />
              </div>
              <div class="card-text">
                <h3>{{ t('home.track_title') }}</h3>
                <p>{{ t('home.track_desc') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tracker Section -->
    <section class="tracker-section">
      <div class="container section-padding">
        <h2 class="section-title center tracker-title bold-title">{{ t('home.tracker_title') }}</h2>
        <div class="tracker-grid">
          <div class="tracker-info-column left">
            <div class="info-card">
              <h3><span class="bold">{{ t('home.know') }}</span> {{ t('home.know_desc') }}</h3>
            </div>
            <div class="info-card">
              <h3><span class="bold">{{ t('home.build') }}</span> {{ t('home.build_desc') }}</h3>
            </div>
          </div>
          
          <div class="tracker-main-image">
            <img src="../assets/poto-tracker-preview.png" alt="Poto Tracker" />
          </div>
          
          <div class="tracker-info-column right">
            <div class="info-card">
              <h3><span class="bold">{{ t('home.remind') }}</span> {{ t('home.remind_desc') }}</h3>
            </div>
            <div class="info-card">
              <h3><span class="bold">{{ t('home.alert') }}</span> {{ t('home.alert_desc') }}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>

    <PotoFooter />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Hero Section */
.hero {
  background-color: var(--poto-green);
  color: white;
  min-height: 75vh;
  display: flex;
  align-items: flex-end;
  padding: 0 4rem 10rem;
}

.hero-content {
  width: 100%;
}

.hero-title {
  font-size: 6rem;
  line-height: 0.85;
  margin-bottom: 1.5rem;
  letter-spacing: -0.01em;
  font-weight: 400;
}

.hero-subtitle {
  font-size: 1rem;
  margin-bottom: 2.5rem;
  letter-spacing: 0.05em;
  line-height: 1.2;
  font-weight: 400;
  opacity: 0.9;
}

/* Bamboo Section */
.bamboo-section {
  background-color: var(--poto-beige-2);
}

.section-title {
  font-size: 2.8rem;
  margin-bottom: 4rem;
  line-height: 1.1;
  color: var(--poto-dark);
}

.section-title.center {
  text-align: center;
}

.bold-title {
  font-weight: 700 !important;
}

.bamboo-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rem;
  max-width: 1200px;
  margin: 0 auto;
}

.bamboo-image {
  flex: 0 0 320px;
}

.bamboo-image img {
  width: 100%;
  height: auto;
}

.feature-cards {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 800px;
}

.feature-card {
  background-color: white;
  display: flex;
  align-items: center;
  padding: 2.5rem;
  gap: 3rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.card-icon {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-text h3 {
  font-size: 1.6rem;
  margin-bottom: 0.6rem;
  font-weight: 700;
  font-family: var(--font-secondary);
  letter-spacing: 0.05em;
}

.card-text p {
  font-size: 1rem;
  color: #555;
  letter-spacing: 0.02em;
  line-height: 1.3;
  font-weight: 400;
}

/* Tracker Section */
.tracker-section {
  background-color: white;
}

.tracker-title {
  text-align: center;
  letter-spacing: 0.05em;
}

.tracker-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  max-width: 1400px;
  margin: 0 auto;
}

.tracker-info-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.tracker-info-column.left, .tracker-info-column.right {
  text-align: left;
}

.tracker-main-image {
  flex: 1.8;
  padding: 0 2rem;
}

.tracker-main-image img {
  width: 100%;
  border-radius: 12px;
}

.info-card {
  background-color: var(--poto-beige-2);
  padding: 2rem;
  border-radius: 8px;
  min-height: 120px;
  display: flex;
  align-items: center;
  text-align: left;
}

.info-card h3 {
  font-size: 1.4rem;
  line-height: 1.25;
  font-weight: 400;
  font-family: var(--font-secondary);
  text-transform: none;
}

.info-card .bold {
  font-weight: 700;
  display: inline-block;
  margin-right: 0.5rem;
}

@media (max-width: 1200px) {
  .hero-title {
    font-size: 5rem;
  }
}

@media (max-width: 1024px) {
  .hero {
    padding: 0 3rem 8rem;
    min-height: 60vh;
  }

  .bamboo-content {
    flex-direction: column;
    align-items: center;
    gap: 3rem;
  }

  .tracker-grid {
    flex-direction: column;
    gap: 3rem;
  }

  .tracker-main-image {
    order: -1;
    width: 100%;
    max-width: 600px;
    padding: 0;
  }

  .tracker-info-column {
    width: 100%;
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 0 1.5rem 6rem;
    min-height: 55vh;
  }

  .hero-title {
    font-size: 3.5rem;
    line-height: 0.9;
  }

  .hero-subtitle {
    font-size: 0.9rem;
    margin-bottom: 2.5rem;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 2.5rem;
  }

  .bamboo-image {
    flex: 0 0 200px;
  }

  .feature-card {
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .card-icon {
    width: 80px;
    height: 80px;
  }

  .card-text h3 {
    font-size: 1.3rem;
  }

  .info-card {
    padding: 1.5rem;
    min-height: auto;
  }

  .info-card h3 {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2.8rem;
  }

  .hero-subtitle {
    font-size: 0.8rem;
  }

  .section-title {
    font-size: 1.6rem;
  }

  .feature-card {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .card-text h3 {
    font-size: 1.2rem;
  }
}
</style>
