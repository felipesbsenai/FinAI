export type Category =
  | 'Alimentação'
  | 'Transporte'
  | 'Educação'
  | 'Lazer'
  | 'Outros';

export const EXPENSE_CATEGORIES: Category[] = [
  'Alimentação',
  'Transporte',
  'Educação',
  'Lazer',
  'Outros',
];

export type TransactionType = 'expense' | 'income';

export type ScreenId = 'overview' | 'transactions' | 'budgets' | 'goals';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  /** Valor monetário em centavos inteiros (ex.: 8420 = R$ 84,20) */
  amountCents: number;
  type: TransactionType;
  category: Category;
  suggestedCategory?: Category | null;
  isSuggestionPending?: boolean;
  account: string;
  dateISO: string;
  time: string;
  notes?: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: Category;
  /** Limite mensal em centavos inteiros */
  limitCents: number;
  /** Total gasto no período em centavos inteiros */
  spentCents: number;
  month: string; // YYYY-MM
}

export interface MonthlyCashflowPoint {
  monthLabel: string;
  /** Entradas no mês em centavos inteiros */
  incomeCents: number;
  /** Saídas no mês em centavos inteiros */
  expenseCents: number;
  /** Saldo acumulado em centavos inteiros */
  netBalanceCents: number;
}

export interface AccountSummary {
  name: string;
  /** Saldo da conta em centavos inteiros */
  balanceCents: number;
}

export interface DashboardSummary {
  /** Patrimônio líquido consolidado em centavos inteiros */
  totalBalanceCents: number;
  /** Total de entradas do mês em centavos inteiros */
  monthlyIncomeCents: number;
  /** Total de saídas do mês em centavos inteiros */
  monthlyExpenseCents: number;
  /** Percentual de variação patrimonial mensal (ex.: 12.4) */
  monthlyDeltaPct: number | null;
  /** Taxa de poupança mensal (0-100) */
  savingsRatePct: number;
  accounts: AccountSummary[];
  cashflowSeries: MonthlyCashflowPoint[];
}

export interface AIExtraction {
  title: string;
  /** Valor extraído em centavos inteiros */
  amountCents: number;
  category: Category;
  type: TransactionType;
  confidence: number;
  dateISO?: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  /** Valor alvo em centavos inteiros */
  targetCents: number;
  /** Valor atual acumulado em centavos inteiros */
  currentCents: number;
  /** Aporte mensal planejado em centavos inteiros */
  monthlyContributionCents: number;
  deadlineLabel: string;
  yieldLabel?: string | null;
}

export interface UpcomingBill {
  id: string;
  title: string;
  /** Valor da conta em centavos inteiros */
  amountCents: number;
  dueDateISO: string;
  category: Category;
  account: string;
  paid: boolean;
}
