<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="auth-card">
    <h2 class="auth-title">{{ title }}</h2>
    <div class="auth-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.auth-card {
  background-color: var(--poto-beige-2);
  border-radius: 40px;
  padding: 3rem 4rem;
  width: 100%;
  max-width: 800px;
  margin: 4rem auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-title {
  font-size: 3rem;
  margin-bottom: 3rem;
  text-align: center;
}

.auth-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

@media (max-width: 768px) {
  .auth-card {
    padding: 2rem;
    border-radius: 20px;
    margin: 2rem auto;
  }
  .auth-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
}
</style>
