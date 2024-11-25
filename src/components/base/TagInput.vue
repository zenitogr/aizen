<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseInput from './BaseInput.vue';

interface Props {
  modelValue: string[]
  placeholder?: string
  suggestions?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Add tags...',
  suggestions: () => []
});

const emit = defineEmits<{
  'update:modelValue': [tags: string[]]
  'add': [tag: string]
  'remove': [tag: string]
}>();

const inputValue = ref('');
const showSuggestions = ref(false);

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && inputValue.value.trim()) {
    event.preventDefault();
    addTag(inputValue.value.trim());
  } else if (event.key === 'Backspace' && !inputValue.value && props.modelValue.length > 0) {
    removeTag(props.modelValue[props.modelValue.length - 1]);
  }
}

function addTag(tag: string) {
  const normalizedTag = tag.toLowerCase();
  if (!props.modelValue.includes(normalizedTag)) {
    emit('update:modelValue', [...props.modelValue, normalizedTag]);
    emit('add', normalizedTag);
  }
  inputValue.value = '';
  showSuggestions.value = false;
}

function removeTag(tag: string) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag));
  emit('remove', tag);
}

function handleFocus() {
  showSuggestions.value = true;
}

function handleBlur() {
  // Delay hiding suggestions to allow click events to fire
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
}

const filteredSuggestions = computed(() => {
  const input = inputValue.value.toLowerCase();
  return props.suggestions
    .filter(tag => 
      tag.toLowerCase().includes(input) && 
      !props.modelValue.includes(tag.toLowerCase())
    );
});
</script>

<template>
  <div class="tag-input">
    <div class="tags-container">
      <span 
        v-for="tag in modelValue" 
        :key="tag"
        class="tag"
      >
        {{ tag }}
        <button 
          class="remove-tag"
          @click="removeTag(tag)"
        >
          ×
        </button>
      </span>
      <BaseInput
        v-model="inputValue"
        :placeholder="placeholder"
        class="tag-input-field"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
    
    <Transition name="fade">
      <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions">
        <button
          v-for="suggestion in filteredSuggestions"
          :key="suggestion"
          class="suggestion"
          @click="addTag(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tag-input {
  position: relative;
  width: 100%;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  min-height: 40px;
}

.tag-input-field {
  flex: 1;
  min-width: 120px;
}

.tag-input-field :deep(input) {
  border: none;
  background: transparent;
  padding: 0;
  height: 24px;
}

.tag {
  background: var(--surface-light);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.remove-tag {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.remove-tag:hover {
  opacity: 1;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--spacing-xs);
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: var(--spacing-xs);
  z-index: 10;
  box-shadow: var(--shadow-md);
}

.suggestion {
  width: 100%;
  text-align: left;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
}

.suggestion:hover {
  background: var(--surface-light);
  color: var(--text-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style> 