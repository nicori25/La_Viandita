<script setup>
defineProps({
  variant: { type: String, default: "standard" },
  decorative: { type: Boolean, default: false },
});
const logoUrl = import.meta.env.BASE_URL + "branding/la-viandita-logo.png";
</script>
<template>
  <span class="brand-logo" :class="'brand-logo--' + variant"
    ><img
      :src="logoUrl"
      :alt="
        decorative
          ? ''
          : 'La Viandita · Precooperativa escolar · Mejor, entre todos.'
      "
      width="1537"
      height="1023"
      decoding="async"
  /></span>
</template>
