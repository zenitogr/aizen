import { invoke } from "@tauri-apps/api/core";

export interface AIAnalysis {
  topics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  insights: string[]
  suggestedTags: string[]
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/v1/chat/completions';

export class AIService {
  private static async callGroq(prompt: string): Promise<any> {
    try {
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
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API call failed:', error);
      throw error;
    }
  }

  static async analyzeJournalEntry(content: string): Promise<AIAnalysis> {
    try {
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

      return {
        topics: analysis.topics || [],
        sentiment: analysis.sentiment || 'neutral',
        insights: analysis.insights || [],
        suggestedTags: analysis.suggestedTags || []
      };
    } catch (error) {
      console.error('AI Analysis failed:', error);
      throw error;
    }
  }

  static async generateWritingPrompt(): Promise<string> {
    try {
      const prompt = `
        Generate a thoughtful journal prompt for self-reflection and personal growth.
        The prompt should be a single question that encourages deep thinking and emotional awareness.
        Keep it concise and direct.
      `;

      return await this.callGroq(prompt);
    } catch (error) {
      console.error('Failed to generate prompt:', error);
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