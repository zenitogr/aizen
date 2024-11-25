<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseButton from '../base/BaseButton.vue';
import BaseInput from '../base/BaseInput.vue';
import BaseCard from '../base/BaseCard.vue';
import { AIService } from '../../services/ai';
import { useAppStore } from '../../stores/app';

const appStore = useAppStore();

interface Props {
  initialContent?: string;
  initialTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialContent: '',
  initialTitle: ''
});

const emit = defineEmits<{
  save: [{ title: string, content: string, aiAnalysis?: any }]
  cancel: []
}>();

const title = ref(props.initialTitle);
const content = ref(props.initialContent);
const titleError = ref('');
const contentError = ref('');
const isAnalyzing = ref(false);
const aiAnalysis = ref<any>(null);
const writingPrompt = ref('');

const wordCount = computed(() => {
  return content.value.trim().split(/\s+/).filter(Boolean).length;
});

async function getWritingPrompt() {
  try {
    appStore.setLoading(true);
    writingPrompt.value = await AIService.generateWritingPrompt();
  } catch (error) {
    appStore.addError('Failed to generate writing prompt');
  } finally {
    appStore.setLoading(false);
  }
}

async function analyzeContent() {
  if (!content.value.trim()) {
    contentError.value = 'Please write something first';
    return;
  }

  try {
    isAnalyzing.value = true;
    aiAnalysis.value = await AIService.analyzeJournalEntry(content.value);
  } catch (error) {
    appStore.addError('Failed to analyze content');
  } finally {
    isAnalyzing.value = false;
  }
}

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

async function handleSave() {
  if (validate()) {
    if (!aiAnalysis.value) {
      await analyzeContent();
    }
    
    emit('save', {
      title: title.value.trim(),
      content: content.value.trim(),
      aiAnalysis: aiAnalysis.value
    });
  }
}
</script>

<template>
  <div class="editor-container">
    <BaseCard variant="elevated" class="journal-editor">
      <div class="editor-header">
        <BaseInput
          v-model="title"
          placeholder="Entry Title..."
          :error="titleError"
          class="title-input"
        />
        <div class="editor-actions">
          <div class="action-buttons">
            <BaseButton 
              variant="ghost"
              size="sm"
              @click="getWritingPrompt"
            >
              Get Prompt
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              :loading="isAnalyzing"
              @click="analyzeContent"
            >
              Analyze
            </BaseButton>
          </div>
          <span class="word-count">{{ wordCount }} words</span>
        </div>
      </div>

      <div v-if="writingPrompt" class="prompt-card">
        <p>{{ writingPrompt }}</p>
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

      <div class="editor-footer">
        <div class="ai-analysis" v-if="aiAnalysis">
          <div class="analysis-item">
            <h4>Topics</h4>
            <div class="tags">
              <span 
                v-for="topic in aiAnalysis.topics" 
                :key="topic"
                class="tag"
              >
                {{ topic }}
              </span>
            </div>
          </div>
          <div class="analysis-item">
            <h4>Insights</h4>
            <ul>
              <li 
                v-for="insight in aiAnalysis.insights" 
                :key="insight"
              >
                {{ insight }}
              </li>
            </ul>
          </div>
        </div>

        <div class="button-group">
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
    </BaseCard>
  </div>
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

.editor-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.prompt-card {
  background: var(--surface-light);
  border-radius: 8px;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  font-style: italic;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
}

.ai-analysis {
  border-top: 1px solid var(--border-color);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
}

.analysis-item {
  margin-bottom: var(--spacing-md);
}

.analysis-item h4 {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.tag {
  background: var(--surface-light);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-xs);
}

@media (max-width: 768px) {
  .editor-actions {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
}
</style> 