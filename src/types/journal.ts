export type JournalEntryState = 'active' | 'recently_deleted' | 'hidden';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  state?: JournalEntryState;
} 