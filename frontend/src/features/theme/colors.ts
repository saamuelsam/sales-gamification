export const COLORS = {
  primary: '#123450',
  accent: '#F9A60C',
  highlight: '#FC6E22',
  neutral: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof COLORS;
