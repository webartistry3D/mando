import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Compact currency display for KPIs: ₦1.2M, ₦850K, ₦1,200. Negative values: -₦1.2M */
export function formatCompactCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const n = abs / 1_000_000;
    const decimals = Number.isInteger(n) ? 0 : 1;
    return `${sign}₦${n.toFixed(decimals)}M`;
  }
  if (abs >= 1_000) {
    const n = abs / 1_000;
    const decimals = Number.isInteger(n) ? 0 : 1;
    return `${sign}₦${n.toFixed(decimals)}K`;
  }
  return sign ? `-${formatCurrency(abs)}` : formatCurrency(abs);
}

/** Format a raw string into a naira-style amount with thousand separators as the user types. */
export function formatAmountInput(raw: string): string {
  // Keep only digits and a single decimal point
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [intPart, ...rest] = cleaned.split('.');
  const decPart = rest.length ? '.' + rest.join('').slice(0, 2) : '';
  const intFormatted = intPart ? Number(intPart).toLocaleString('en-NG') : '';
  return intFormatted + decPart;
}

/** Parse a formatted amount string back to a number. */
export function parseAmountInput(formatted: string): number {
  return Number(formatted.replace(/,/g, '')) || 0;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}
