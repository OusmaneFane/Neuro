import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles tailwind merge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});
