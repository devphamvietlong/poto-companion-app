<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<template>
  <footer class="footer">
    <div class="container section-padding">
      <div class="footer-content">
        <div class="contact-info">
          <h4>{{ t('common.contact_info') }}</h4>
          <p>{{ t('footer.phone_number') }}</p>
          <p>{{ t('footer.facebook_link') }}</p>
          <p>{{ t('footer.tiktok_handle') }}</p>
          <p>{{ t('footer.instagram_handle') }}</p>
          <p>{{ t('footer.website_link') }}</p>
        </div>
      </div>
      <div class="copyright">
        {{ t('common.copyright') }}
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--poto-beige-1);
  margin-top: 4rem;
}

.contact-info h4 {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  font-weight: 700;
  font-family: var(--font-secondary);
}

.contact-info p {
  font-size: 1rem;
  margin-bottom: 0.6rem;
  font-weight: 500;
  color: #333;
}

.copyright {
  font-size: 0.7rem;
  color: #666;
  border-top: 1px solid #cbc7bf;
  padding-top: 2rem;
  margin-top: 3rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-padding {
  padding: 4rem 2rem;
}

@media (max-width: 768px) {
  .section-padding {
    padding: 3rem 1.5rem;
  }
}
</style>
