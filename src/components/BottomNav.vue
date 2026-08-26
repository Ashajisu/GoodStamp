<script setup>
defineProps({tab: String});
defineEmits(['change'])
</script>
<template>
  <nav class="bottom-nav">
    <button :class="{active:tab==='today'}" @click="$emit('change','today')">
      <span>✓</span><small>오늘</small>
    </button>
    <button :class="{active:tab==='weekly'}" @click="$emit('change','weekly')">
      <span>▦</span><small>주간</small>
    </button>
    <button :class="{active:tab==='reward'}" @click="$emit('change','reward')">
      <span>★</span><small>보상</small>
    </button>
  </nav>
</template>
