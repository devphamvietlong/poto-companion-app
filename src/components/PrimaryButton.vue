<script setup lang="ts">
defineProps<{
  text: string;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'hero' | 'secondary';
}>();
</script>

<template>
  <button 
    :type="type || 'button'" 
    class="poto-button" 
    :class="variant ? `is-${variant}` : 'is-primary'"
  >
    {{ text }}
  </button>
</template>

<style scoped>
.poto-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--poto-green);
  padding: 0.8rem 2.5rem;
  font-family: var(--font-secondary);
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 700;
  text-transform: uppercase;
  width: fit-content;
}

.is-primary {
  background-color: white;
  color: var(--poto-green);
}

.is-primary:hover {
  background-color: var(--poto-green);
  color: white;
}

.is-hero {
  background-color: var(--poto-green);
  color: white;
  border-color: white;
}

.is-hero:hover {
  background-color: white;
  color: var(--poto-green);
}

.is-secondary {
  background-color: transparent;
  border-color: var(--poto-green);
  color: var(--poto-green);
}

@media (max-width: 768px) {
  .poto-button {
    font-size: 0.9rem;
    padding: 0.6rem 1.5rem;
  }
}
</style>
