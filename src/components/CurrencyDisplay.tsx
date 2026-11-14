import React from 'react';
import { formatCentsParts } from '../utils/formatters';

interface CurrencyDisplayProps {
  /** Valor monetário inteiro em centavos */
  cents: number;
  size?: 'hero' | 'lg' | 'md' | 'sm';
  showPositiveSign?: boolean;
  forceNegativeSign?: boolean;
  masked?: boolean;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  cents,
  size = 'md',
  showPositiveSign = false,
  forceNegativeSign = false,
  masked = false,
  className = '',
}) => {
  if (masked) {
    return (
      <span
        className={`font-display tabular-nums whitespace-nowrap tracking-wider opacity-70 ${
          size === 'hero'
            ? 'text-3xl sm:text-[40px] font-extrabold'
            : size === 'lg'
              ? 'text-xl sm:text-2xl font-bold'
              : size === 'sm'
                ? 'text-xs font-semibold'
                : 'text-sm font-bold'
        } ${className}`}
      >
        R$ •••••
      </span>
    );
  }

  const parts = formatCentsParts(cents, {
    showPositiveSign,
    forceNegativeSign,
  });

  const sizeStyles = {
    hero: {
      container:
        'text-[32px] sm:text-[40px] leading-[40px] sm:leading-[48px] tracking-[-0.03em]',
      prefix: 'text-xl sm:text-2xl font-medium mr-1.5 opacity-65',
      digits: 'font-extrabold',
      cents: 'text-xl sm:text-2xl font-bold opacity-85',
    },
    lg: {
      container: 'text-xl sm:text-[24px] leading-7 tracking-[-0.02em]',
      prefix: 'text-sm sm:text-base font-medium mr-1 opacity-65',
      digits: 'font-bold',
      cents: 'text-sm sm:text-base font-semibold opacity-85',
    },
    md: {
      container: 'text-[14px] leading-[18px] tracking-[-0.01em]',
      prefix: 'text-[12px] font-medium mr-1 opacity-70',
      digits: 'font-bold',
      cents: 'font-semibold opacity-90',
    },
    sm: {
      container: 'text-xs leading-4',
      prefix: 'text-[11px] font-medium mr-0.5 opacity-70',
      digits: 'font-semibold',
      cents: 'font-medium opacity-90',
    },
  }[size];

  return (
    <span
      className={`inline-flex items-baseline font-display tabular-nums whitespace-nowrap ${sizeStyles.container} ${className}`}
    >
      {parts.sign && <span className="font-semibold mr-0.5">{parts.sign}</span>}
      <span className={sizeStyles.prefix}>{parts.prefix}</span>
      <span className={sizeStyles.digits}>{parts.integer}</span>
      <span className={sizeStyles.cents}>,{parts.decimal}</span>
    </span>
  );
};
