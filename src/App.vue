<script setup lang="ts">
import { onMounted } from 'vue';
import { authService } from './services/auth';

onMounted(() => {
  authService.fetchProfile();
});
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <Transition :name="(route.meta.transition as string) || 'page'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </router-view>
</template>

<style>
#app {
  width: 100%;
}

/* Page Transition Animations */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.page-enter-to,
.page-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
