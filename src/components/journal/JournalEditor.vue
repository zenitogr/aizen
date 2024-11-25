<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseButton from '../base/BaseButton.vue';
import BaseInput from '../base/BaseInput.vue';
import BaseCard from '../base/BaseCard.vue';

interface Props {
  initialContent?: string;
  initialTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialContent: '',
  initialTitle: ''
});

const emit = defineEmits<{
  save: [{ title: string, content: string }]
  cancel: []
}>();

const title = ref(props.initialTitle);
const content = ref(props.initialContent);
const titleError = ref('');
const contentError = ref('');

const wordCount = computed(() => {
  return content.value.trim().split(/\s+/).filter(Boolean).length;
});

function validate(): boolean {
  let isValid = true;
  
  if (!title.value.trim()) {
    titleError.value = 'Title is required';
    isValid = false;
  } else {
    titleError.value = '';
  }
  
  if (!content.value.trim()) {
    contentError.value = 'Content is required';
    isValid = false;
  } else {
    contentError.value = '';
  }
  
  return isValid;
}

function handleSave() {
  if (validate()) {
    emit('save', {
      title: title.value.trim(),
      content: content.value.trim()
    });
  }
}
</script>

<template>
  <BaseCard variant="elevated" class="journal-editor">
    <div class="editor-header">
      <BaseInput
        v-model="title"
        placeholder="Entry Title..."
        :error="titleError"
        class="title-input"
      />
      <div class="editor-actions">
        <span class="word-count">{{ wordCount }} words</span>
        <div class="buttons">
          <BaseButton 
            variant="ghost"
            @click="emit('cancel')"
          >
            Cancel
          </BaseButton>
          <BaseButton
            @click="handleSave"
          >
            Save Entry
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="editor-content">
      <textarea
        v-model="content"
        placeholder="Write your thoughts..."
        :class="{ 'has-error': contentError }"
        class="content-area"
      ></textarea>
      <p v-if="contentError" class="error-message">{{ contentError }}</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.journal-editor {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.editor-header {
  margin-bottom: var(--spacing-md);
}

.title-input {
  margin-bottom: var(--spacing-sm);
}

.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-count {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.editor-content {
  position: relative;
}

.content-area {
  width: 100%;
  min-height: 400px;
  padding: var(--spacing-md);
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-family-base);
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  transition: var(--transition-default);
}

.content-area:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.1);
}

.content-area.has-error {
  border-color: var(--status-error);
}

.error-message {
  color: var(--status-error);
  font-size: 0.75rem;
  margin: var(--spacing-xs) 0 0;
}

@media (max-width: 768px) {
  .editor-actions {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
  
  .buttons {
    flex-direction: column;
  }
  
  .content-area {
    min-height: 300px;
  }
}
</style> 