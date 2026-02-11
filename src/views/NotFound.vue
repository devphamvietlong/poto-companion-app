<template>
  <div class="page-wrapper">
    <PotoHeader />
    <div class="not-found-page">
      <h1>404</h1>
      <h2>{{ t('not_found.title') }}</h2>
      <p>{{ t('not_found.desc') }}</p>
      <router-link to="/" class="home-btn">{{ t('not_found.home') }}</router-link>
    </div>
    <PotoFooter />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import PotoHeader from '../components/PotoHeader.vue';
import PotoFooter from '../components/PotoFooter.vue';

const { t } = useI18n();
</script>

<style scoped>
.not-found-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  text-align: center;
  color: var(--poto-dark);
}

h1 {
  font-size: 8rem;
  line-height: 1;
  color: var(--poto-green);
  margin-bottom: 1rem;
}

h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

p {
  max-width: 500px;
  margin-bottom: 2rem;
  font-family: var(--font-secondary);
}

.home-btn {
  display: inline-block;
  padding: 12px 32px;
  background-color: var(--poto-green);
  color: var(--poto-white);
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.home-btn:hover {
  background-color: var(--poto-olive);
}
</style>
