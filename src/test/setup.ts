import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Mock next/link to render a standard anchor tag
vi.mock('next/link', () => {
  return {
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => {
      return React.createElement('a', { href, ...props }, children);
    },
  };
});

// Mock next/navigation router hooks
vi.mock('next/navigation', () => {
  const pushMock = vi.fn();
  const replaceMock = vi.fn();
  return {
    usePathname: () => '/',
    useRouter: () => ({
      push: pushMock,
      replace: replaceMock,
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
  };
});
