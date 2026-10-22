import type { CSSProperties } from 'react';
import { color } from '../../../shared/tokens/colors.json';
import { typography } from '../../../shared/tokens/typography.json';
import { spacing } from '../../../shared/tokens/spacing.json';
import { radii } from '../../../shared/tokens/radii.json';

export const aiTheme = {
  '--ai-canvas': color.surface.base.$value,
  '--ai-panel': color.alpha['obsidian-80'].$value,
  '--ai-input': color.surface.mid.$value,
  '--ai-hover': color.surface.high.$value,
  '--ai-text': color.semantic['on-surface'].$value,
  '--ai-muted': color.semantic['on-surface-variant'].$value,
  '--ai-outline': color.semantic['outline-variant'].$value,
  '--ai-accent': color.primary.container.$value,
  '--ai-on-accent': color.primary['on-container'].$value,
  '--ai-progress': color.secondary.default.$value,
  '--ai-error': color.semantic.error.$value,
  '--ai-display': typography.fontFamily.display.$value,
  '--ai-body': typography.fontFamily.body.$value,
  '--ai-mono': typography.fontFamily.mono.$value,
  '--ai-title-size': typography.scale['headline-lg'].fontSize.$value,
  '--ai-title-line': typography.scale['headline-lg'].lineHeight.$value,
  '--ai-heading-size': typography.scale['headline-md'].fontSize.$value,
  '--ai-heading-line': typography.scale['headline-md'].lineHeight.$value,
  '--ai-body-size': typography.scale['body-md'].fontSize.$value,
  '--ai-body-line': typography.scale['body-md'].lineHeight.$value,
  '--ai-label-size': typography.scale['label-md'].fontSize.$value,
  '--ai-xs': spacing.xs.$value,
  '--ai-base': spacing.base.$value,
  '--ai-sm': spacing.sm.$value,
  '--ai-gutter': spacing.gutter.$value,
  '--ai-md': spacing.md.$value,
  '--ai-lg': spacing.lg.$value,
  '--ai-radius': radii.scale['2xl'].$value,
  '--ai-card-radius': radii.scale.md.$value,
} as CSSProperties;
