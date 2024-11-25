<script setup lang="ts">
import { computed } from 'vue';
import { createHighlightedHTML } from '../../utils/highlight';

interface Props {
  text: string
  query: string
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'span'
});

const highlightedHTML = computed(() => 
  createHighlightedHTML(props.text, props.query)
);
</script>

<template>
  <component 
    :is="tag" 
    v-html="highlightedHTML"
    class="highlighted-text"
  />
</template>

<style>
.highlighted-text mark {
  background-color: rgba(138, 43, 226, 0.2);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}
</style> 