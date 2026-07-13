import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../design-system/cn';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'small'
  | 'caption';

export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'primary'
  | 'success'
  | 'accent'
  | 'danger';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  tone?: TextTone;
  as?: ElementType;
  semibold?: boolean;
  bold?: boolean;
  children: ReactNode;
}

const variantClass: Record<TextVariant, string> = {
  display: 'ds-display',
  h1: 'ds-h1',
  h2: 'ds-h2',
  h3: 'ds-h3',
  body: 'ds-body',
  small: 'ds-small',
  caption: 'ds-caption',
};

const defaultElement: Record<TextVariant, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
  small: 'p',
  caption: 'span',
};

const toneClass: Record<TextTone, string | undefined> = {
  default: undefined,
  secondary: 'ds-text-secondary',
  muted: 'ds-text-muted',
  primary: 'ds-text-primary',
  success: 'ds-text-success',
  accent: 'ds-text-accent',
  danger: 'ds-text-danger',
};

export function Text({
  variant = 'body',
  tone = 'default',
  as,
  semibold = false,
  bold = false,
  className,
  children,
  ...rest
}: TextProps) {
  const Component = as ?? defaultElement[variant];

  return (
    <Component
      className={cn(
        variantClass[variant],
        toneClass[tone],
        semibold && 'ds-text-semibold',
        bold && 'ds-text-bold',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
