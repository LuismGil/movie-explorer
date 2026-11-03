import { catalogMessages } from './catalog';
import { aiMessages } from './ai';

// Complete dictionary for server rendering and existing consumers/tests.
// Catalog clients import ./catalog directly, without the Discover-only copy.
export const messages = { ...catalogMessages, ai: aiMessages } as const;
