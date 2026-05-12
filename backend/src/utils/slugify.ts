/**
 * Utility to generate URL-safe slugs from poll titles.
 * @module utils/slugify
 */

import { nanoid } from 'nanoid';

/**
 * Converts a title string into a URL-safe slug with a unique suffix.
 * Example: "My Awesome Poll" → "my-awesome-poll-x7k3j2"
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  const suffix = nanoid(6);
  return `${base}-${suffix}`;
}
