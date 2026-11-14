export interface FormattedCurrencyParts {
  sign: string;
  prefix: string;
  integer: string;
  decimal: string;
  full: string;
}

/**
 * Formata um valor inteiro em centavos para partes tipográficas em BRL (pt-BR).
 * A conversão de centavos para reais ocorre exclusivamente na exibição.
 */
export function formatCentsParts(
  cents: number,
  options?: { showPositiveSign?: boolean; forceNegativeSign?: boolean }
): FormattedCurrencyParts {
  const safeCents = Number.isFinite(cents) ? Math.round(cents) : 0;
  const absReais = Math.abs(safeCents) / 100;
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absReais);

  const [integer, decimal] = formatted.split(',');

  let sign = '';
  if (safeCents < 0 || options?.forceNegativeSign) {
    sign = '-';
  } else if (options?.showPositiveSign && safeCents > 0) {
    sign = '+';
  }

  return {
    sign,
    prefix: 'R$',
    integer,
    decimal,
    full: `${sign ? `${sign} ` : ''}R$ ${integer},${decimal}`,
  };
}

/**
 * Formata centavos inteiros diretamente em string BRL (ex.: 1245080 -> "R$ 12.450,80").
 */
export function formatCentsToBRL(cents: number): string {
  const safeCents = Number.isFinite(cents) ? Math.round(cents) : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeCents / 100);
}

/**
 * Converte string digitada no formato máscara monetária para centavos inteiros.
 */
export function parseInputToCents(raw: string): number {
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) return 0;
  const parsed = parseInt(digitsOnly, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Formata centavos inteiros para exibição em campo de entrada (sem prefixo R$).
 */
export function formatCentsInputMask(cents: number): string {
  const safeCents = Number.isFinite(cents) ? Math.round(cents) : 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeCents / 100);
}

export function formatCompactDate(dateISO: string): string {
  const parts = dateISO.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateISO;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatDueDate(dateISO: string): string {
  const parts = dateISO.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateISO;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
