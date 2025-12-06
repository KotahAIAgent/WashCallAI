// Statuses that count toward billing (actual conversations)
export const BILLABLE_STATUSES = ['answered', 'interested', 'not_interested', 'callback', 'completed']

// Statuses that do NOT count (no real conversation)
export const NON_BILLABLE_STATUSES = ['voicemail', 'no_answer', 'wrong_number', 'failed', 'queued', 'pending', 'calling', 'ringing']

