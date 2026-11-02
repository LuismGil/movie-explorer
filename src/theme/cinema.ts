import type { CSSProperties } from 'react';
import { color } from '../../shared/tokens/colors.json';

/** Shared cinema palette, also used by the AI panel. */
export const cinemaTheme = {
  '--cinema-void': color.surface.lowest.$value,
  '--cinema-surface': color.surface.base.$value,
  '--cinema-raised': color.surface.low.$value,
  '--cinema-rim': color.semantic['outline-variant'].$value,
  '--cinema-accent': color.primary.container.$value,
  '--cinema-on-accent': color.primary['on-container'].$value,
  '--cinema-text': color.semantic['on-surface'].$value,
  '--cinema-muted': color.semantic['on-surface-variant'].$value,
  '--cinema-purple': color.secondary.default.$value,
  '--cinema-glass': color.alpha['obsidian-80'].$value,
} as CSSProperties;
