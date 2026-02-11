<template>
  <div ref="container" class="turnstile-wrapper"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
}>();

const emit = defineEmits<{
  (e: 'verify', token: string): void;
  (e: 'expire'): void;
  (e: 'error', code: string): void;
}>();

const container = ref<HTMLElement | null>(null);
const widgetId = ref<string | null>(null);

const loadScript = () => {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).turnstile) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

const renderWidget = () => {
  if (!container.value || !(window as any).turnstile) return;

  try {
    widgetId.value = (window as any).turnstile.render(container.value, {
      sitekey: props.sitekey,
      theme: props.theme || 'light',
      callback: (token: string) => {
        emit('verify', token);
      },
      'expired-callback': () => {
        emit('expire');
      },
      'error-callback': (code: string) => {
        emit('error', code);
      },
    });
  } catch (e) {
    console.error('Turnstile render error:', e);
  }
};

const reset = () => {
  if (widgetId.value && (window as any).turnstile) {
    (window as any).turnstile.reset(widgetId.value);
  }
};

const remove = () => {
  if (widgetId.value && (window as any).turnstile) {
    (window as any).turnstile.remove(widgetId.value);
    widgetId.value = null;
  }
};

onMounted(async () => {
  try {
    await loadScript();
    renderWidget();
  } catch (e) {
    console.error('Failed to load Turnstile script:', e);
    emit('error', 'script_load_failed');
  }
});

onUnmounted(() => {
  remove();
});

defineExpose({
  reset,
  remove,
});
</script>

<style scoped>
.turnstile-wrapper {
  display: flex;
  justify-content: center;
  min-height: 65px;
}
</style>
