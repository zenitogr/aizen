import { useAppStore } from '../stores/app'
import { useLogsStore } from '../stores/logs'

export interface AIAnalysis {
  topics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  insights: string[]
  suggestedTags: string[]
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class AIService {
  private static async callGroq(prompt: string): Promise<any> {
    const logsStore = useLogsStore()
    const appStore = useAppStore()
    
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'ai',
        action: 'api_call',
        message: 'Making API call to Groq',
        details: { prompt_length: prompt.length },
        status: 'pending'
      })

      if (!GROQ_API_KEY) {
        appStore.addError('Groq API key not configured')
        throw new Error('Groq API key not configured')
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant helping with personal journaling and reflection.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `Groq API error (${response.status}): ${errorData.error?.message || response.statusText}`;
        appStore.addError(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      await logsStore.addLog({
        level: 'info',
        category: 'ai',
        action: 'api_call',
        message: 'Successfully received response from Groq',
        details: {
          prompt_length: prompt.length,
          response_length: data.choices[0].message.content.length,
          model: 'mixtral-8x7b-32768',
          tokens_used: data.usage?.total_tokens
        },
        status: 'success'
      })

      return data.choices[0].message.content;
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'ai',
        action: 'api_call',
        message: 'Groq API call failed',
        error: error instanceof Error ? error.message : String(error),
        details: { prompt_length: prompt.length },
        status: 'failure'
      })

      appStore.addError('AI service temporarily unavailable');
      return JSON.stringify({
        topics: ['personal'],
        sentiment: 'neutral',
        insights: ['AI analysis temporarily unavailable'],
        suggestedTags: ['journal']
      });
    }
  }

  static async analyzeJournalEntry(content: string): Promise<AIAnalysis> {
    const logsStore = useLogsStore()
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'ai',
        action: 'analyze_entry',
        message: 'Starting journal entry analysis',
        details: { content_length: content.length },
        status: 'pending'
      })

      const prompt = `
        Analyze the following journal entry and provide:
        1. Main topics discussed (max 3)
        2. Overall sentiment (positive, neutral, or negative)
        3. Key insights or observations (max 2)
        4. Suggested tags (max 3)

        Format the response as JSON.

        Journal entry:
        ${content}
      `;

      const response = await this.callGroq(prompt);
      const analysis = JSON.parse(response);

      await logsStore.addLog({
        level: 'info',
        category: 'ai',
        action: 'analyze_entry',
        message: 'Successfully analyzed journal entry',
        details: {
          content_length: content.length,
          topics: analysis.topics,
          sentiment: analysis.sentiment
        },
        status: 'success'
      })

      return {
        topics: analysis.topics || [],
        sentiment: analysis.sentiment || 'neutral',
        insights: analysis.insights || [],
        suggestedTags: analysis.suggestedTags || []
      };
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'ai',
        action: 'analyze_entry',
        message: 'Failed to analyze journal entry',
        error: error instanceof Error ? error.message : String(error),
        details: { content_length: content.length },
        status: 'failure'
      })
      throw error;
    }
  }

  static async generateWritingPrompt(): Promise<string> {
    const logsStore = useLogsStore()
    try {
      await logsStore.addLog({
        level: 'info',
        category: 'ai',
        action: 'generate_prompt',
        message: 'Generating writing prompt',
        status: 'pending'
      })

      const prompt = `
        Generate a thoughtful journal prompt for self-reflection and personal growth.
        The prompt should be a single question that encourages deep thinking and emotional awareness.
        Keep it concise and direct.
      `;

      const response = await this.callGroq(prompt);

      await logsStore.addLog({
        level: 'info',
        category: 'ai',
        action: 'generate_prompt',
        message: 'Successfully generated writing prompt',
        details: { prompt_length: response.length },
        status: 'success'
      })

      return response;
    } catch (error) {
      await logsStore.addLog({
        level: 'error',
        category: 'ai',
        action: 'generate_prompt',
        message: 'Failed to generate writing prompt',
        error: error instanceof Error ? error.message : String(error),
        status: 'failure'
      })
      throw error;
    }
  }

  static async getSentimentColor(sentiment: string): Promise<string> {
    const colors = {
      positive: '#4CAF50',
      neutral: '#2196F3',
      negative: '#FF5252'
    };
    return colors[sentiment as keyof typeof colors] || colors.neutral;
  }
}

export async function analyzeContent() {
  // This is just a stub - replace with actual implementation
  return {
    topics: ['daily life', 'reflection'],
    sentiment: 'neutral',
    insights: ['Consider exploring this topic further']
  }
} 