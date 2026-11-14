import React from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  PiggyBank,
  Plus,
  ReceiptText,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  Budget,
  Category,
  DashboardSummary,
  Expense,
  Goal,
  ScreenId,
} from '../types';
import { formatCentsToBRL, formatCompactDate } from '../utils/formatters';
import { CashflowChart } from './CashflowChart';
import { CATEGORY_META, CategoryBadgeIcon } from './CategoryBadgeIcon';
import { CurrencyDisplay } from './CurrencyDisplay';

interface OverviewScreenProps {
  summary: DashboardSummary | null;
  expenses: Expense[];
  budgets: Budget[];
  goals: Goal[];
  loading: boolean;
  error: string | null;
  masked: boolean;
  onRetry: () => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenNewModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onConfirmSuggestion: (expenseId: string, category: Category) => Promise<void>;
  onDismissSuggestion: (expenseId: string) => Promise<void>;
  onQuickSaveToGoal: (goalId: string, amountCents: number) => Promise<void>;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  summary,
  expenses,
  budgets,
  goals,
  loading,
  error,
  masked,
  onRetry,
  onNavigate,
  onOpenNewModal,
  onEditExpense,
  onConfirmSuggestion,
  onDismissSuggestion,
  onQuickSaveToGoal,
}) => {
  if (error) {
    return (
      <div className="surface-card rounded-[18px] p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-500 dark:text-[#ffb4ab] flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
            Não foi possível carregar o resumo financeiro
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#908fa0] max-w-md mx-auto">
            {error}
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-pulse"
        aria-busy="true"
      >
        <div className="lg:col-span-7 space-y-6">
          <div className="surface-card rounded-[18px] p-6 space-y-6">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-3 w-36 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-10 w-56 rounded bg-slate-200 dark:bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-7 w-16 rounded bg-slate-200 dark:bg-white/10" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-200/70 dark:border-white/7">
              <div className="h-12 rounded bg-slate-100 dark:bg-white/5" />
              <div className="h-12 rounded bg-slate-100 dark:bg-white/5" />
              <div className="h-12 rounded bg-slate-100 dark:bg-white/5" />
            </div>
            <div className="h-56 rounded-xl bg-slate-100 dark:bg-white/5" />
          </div>

          <div className="surface-card rounded-[18px] p-6 space-y-4">
            <div className="h-5 w-44 rounded bg-slate-200 dark:bg-white/10" />
            <div className="space-y-3">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="h-14 rounded-xl bg-slate-100 dark:bg-white/5"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="surface-card rounded-[18px] p-6 h-40" />
          <div className="surface-card rounded-[18px] p-6 h-64" />
          <div className="surface-card rounded-[18px] p-6 h-44" />
        </div>
      </div>
    );
  }

  const totalBalanceCents = summary?.totalBalanceCents ?? 0;
  const monthlyIncomeCents = summary?.monthlyIncomeCents ?? 0;
  const monthlyExpenseCents = summary?.monthlyExpenseCents ?? 0;
  const savingsRatePct = summary?.savingsRatePct ?? 0;
  const monthlyDeltaPct = summary?.monthlyDeltaPct ?? null;
  const cashflowSeries = summary?.cashflowSeries ?? [];

  const pendingSuggestions = expenses.filter(
    (item) => item.isSuggestionPending && item.suggestedCategory
  );
  const recentExpenses = expenses.slice(0, 6);
  const topGoal = goals[0] ?? null;

  const totalBudgetLimitCents = budgets.reduce(
    (sum, b) => sum + b.limitCents,
    0
  );
  const totalBudgetSpentCents = budgets.reduce(
    (sum, b) => sum + b.spentCents,
    0
  );
  const totalBudgetUsedPct =
    totalBudgetLimitCents > 0
      ? Math.round((totalBudgetSpentCents / totalBudgetLimitCents) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 Columns */}
      <div className="lg:col-span-7 space-y-6">
        <section className="surface-card rounded-[18px] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/7">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-[#908fa0]">
                Patrimônio líquido consolidado
              </p>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
                <CurrencyDisplay
                  cents={totalBalanceCents}
                  size="hero"
                  masked={masked}
                  className="text-slate-900 dark:text-[#dae2fd]"
                />
                {monthlyDeltaPct !== null && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
                      monthlyDeltaPct >= 0
                        ? 'text-emerald-600 dark:text-[#4edea3]'
                        : 'text-rose-600 dark:text-[#ffb4ab]'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    {monthlyDeltaPct >= 0 ? '+' : ''}
                    {monthlyDeltaPct.toFixed(1).replace('.', ',')}% este mês
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-medium text-slate-500 dark:text-[#908fa0]">
                Taxa de poupança mensal
              </p>
              <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-[#dae2fd] tabular-nums">
                {savingsRatePct.toFixed(1).replace('.', ',')}%
              </p>
              <p className="text-xs text-slate-500 dark:text-[#908fa0] tabular-nums">
                Superávit sobre receitas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-b border-slate-200/80 dark:border-white/7">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#908fa0]">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 dark:text-[#4edea3]" />
                Entradas do mês
              </div>
              <div className="mt-1">
                <CurrencyDisplay
                  cents={monthlyIncomeCents}
                  size="lg"
                  masked={masked}
                  className="text-emerald-600 dark:text-[#4edea3]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#908fa0]">
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500 dark:text-[#c0c1ff]" />
                Saídas do mês
              </div>
              <div className="mt-1">
                <CurrencyDisplay
                  cents={monthlyExpenseCents}
                  size="lg"
                  masked={masked}
                  className="text-slate-900 dark:text-[#dae2fd]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#908fa0]">
                <PiggyBank className="w-3.5 h-3.5 text-amber-500 dark:text-[#ffb95f]" />
                Saldo mensal
              </div>
              <div className="mt-1">
                <CurrencyDisplay
                  cents={monthlyIncomeCents - monthlyExpenseCents}
                  size="lg"
                  masked={masked}
                  className="text-slate-900 dark:text-[#dae2fd]"
                />
              </div>
            </div>
          </div>

          <div className="pt-5">
            <CashflowChart data={cashflowSeries} masked={masked} />
          </div>
        </section>

        {/* Recent Expenses Ledger */}
        <section className="surface-card rounded-[18px] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/7">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
                Movimentações recentes
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#908fa0] mt-0.5">
                Últimos lançamentos sincronizados com sua conta
              </p>
            </div>
            {recentExpenses.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('transactions')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-[#c0c1ff] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ver extrato completo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentExpenses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400 dark:text-[#908fa0]">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800 dark:text-[#dae2fd]">
                  Nenhuma movimentação registrada
                </p>
                <p className="text-xs text-slate-500 dark:text-[#908fa0] max-w-xs mx-auto">
                  Registre sua primeira receita ou despesa para acompanhar seu fluxo financeiro.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenNewModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar primeira movimentação
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-white/6">
              {recentExpenses.map((tx) => {
                const catMeta = CATEGORY_META[tx.category] ?? CATEGORY_META.Outros;
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => onEditExpense(tx)}
                    className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryBadgeIcon category={tx.category} type={tx.type} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-[#dae2fd] truncate">
                          {tx.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-[#908fa0] truncate mt-0.5">
                          {catMeta.label} · {tx.account} ·{' '}
                          {formatCompactDate(tx.dateISO)} às {tx.time}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <CurrencyDisplay
                        cents={tx.amountCents}
                        size="md"
                        showPositiveSign={tx.type === 'income'}
                        forceNegativeSign={tx.type === 'expense'}
                        masked={masked}
                        className={
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-[#4edea3]'
                            : 'text-slate-900 dark:text-[#dae2fd]'
                        }
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Right 5 Columns */}
      <div className="lg:col-span-5 space-y-6">
        {/* Contextual Insights */}
        <section className="surface-ai-glass rounded-[18px] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-[#c0c1ff]" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
                Inteligência Contextual
              </h2>
            </div>
            <span className="text-xs font-medium text-indigo-600 dark:text-[#c0c1ff] tabular-nums">
              {pendingSuggestions.length > 0
                ? `${pendingSuggestions.length} pendente${
                    pendingSuggestions.length > 1 ? 's' : ''
                  }`
                : 'Sem pendências'}
            </span>
          </div>

          {pendingSuggestions.length > 0 ? (
            <div className="divide-y divide-indigo-500/15 dark:divide-white/8">
              {pendingSuggestions.map((tx) => {
                const suggested = tx.suggestedCategory!;
                return (
                  <div
                    key={tx.id}
                    className="py-3 first:pt-0 last:pb-0 space-y-2.5"
                  >
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-[#dae2fd]">
                      Sugestão para{' '}
                      <strong className="font-semibold">{tx.title}</strong> (
                      {masked ? '•••••' : formatCentsToBRL(tx.amountCents)}):
                      categorizar como{' '}
                      <strong className="font-semibold text-indigo-700 dark:text-[#c0c1ff]">
                        {suggested}
                      </strong>
                      ?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onConfirmSuggestion(tx.id, suggested)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirmar {suggested}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismissSuggestion(tx.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-[#c7c4d7] hover:bg-slate-200/60 dark:hover:bg-white/8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Ignorar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-[#c7c4d7] leading-relaxed">
              Nenhum insight ou sugestão de categorização pendente no momento.
            </p>
          )}
        </section>

        {/* Monthly Budget Summary */}
        <section className="surface-card rounded-[18px] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
                Orçamento mensal
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#908fa0] mt-0.5 tabular-nums">
                {budgets.length > 0
                  ? `${totalBudgetUsedPct}% do teto mensal utilizado`
                  : 'Nenhum orçamento configurado'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('budgets')}
              className="text-xs font-semibold text-indigo-600 dark:text-[#c0c1ff] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Configurar
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="py-6 text-center space-y-2 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-[#908fa0]">
                Defina limites por categoria para acompanhar seus gastos.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {budgets.map((budget) => {
                const pct =
                  budget.limitCents > 0
                    ? Math.min(
                        100,
                        (budget.spentCents / budget.limitCents) * 100
                      )
                    : 0;
                const rawPct =
                  budget.limitCents > 0
                    ? Math.round((budget.spentCents / budget.limitCents) * 100)
                    : 0;
                const meta = CATEGORY_META[budget.category] ?? CATEGORY_META.Outros;
                const isExceeded = rawPct >= 100;
                const isWarning = rawPct >= 80 && rawPct < 100;

                return (
                  <div key={budget.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="font-medium text-slate-800 dark:text-[#dae2fd] truncate">
                          {meta.label}
                        </span>
                      </div>
                      <span className="tabular-nums text-slate-600 dark:text-[#c7c4d7] shrink-0">
                        {masked ? '•••••' : formatCentsToBRL(budget.spentCents)} /{' '}
                        <span className="text-slate-400 dark:text-[#908fa0]">
                          {masked
                            ? '•••••'
                            : formatCentsToBRL(budget.limitCents)}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-[#0b1326] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isExceeded
                            ? '#EF4444'
                            : isWarning
                              ? '#F59E0B'
                              : meta.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Priority Goal Card */}
        <section className="surface-card rounded-[18px] p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-[#908fa0]">
                Meta prioritária
              </p>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd] mt-0.5">
                {topGoal ? topGoal.title : 'Nenhuma meta cadastrada'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('goals')}
              className="text-xs font-semibold text-emerald-600 dark:text-[#4edea3] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              {topGoal ? 'Ver metas' : 'Criar meta'}
            </button>
          </div>

          {topGoal ? (
            <>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-xs tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-[#dae2fd]">
                    {masked ? '•••••' : formatCentsToBRL(topGoal.currentCents)}
                  </span>
                  <span className="text-slate-500 dark:text-[#908fa0]">
                    Objetivo:{' '}
                    {masked ? '•••••' : formatCentsToBRL(topGoal.targetCents)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-[#0b1326] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 dark:bg-[#4edea3] transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        topGoal.targetCents > 0
                          ? (topGoal.currentCents / topGoal.targetCents) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onQuickSaveToGoal(topGoal.id, 50000)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  + Aportar R$ 500
                </button>
                <button
                  type="button"
                  onClick={() => onQuickSaveToGoal(topGoal.id, 100000)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-[#4edea3] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-colors whitespace-nowrap cursor-pointer"
                >
                  + Aportar R$ 1.000
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-2 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              <Target className="w-5 h-5 mx-auto text-slate-400 dark:text-[#908fa0]" />
              <p className="text-xs text-slate-500 dark:text-[#908fa0]">
                Crie sua primeira meta financeira para acompanhar aportes.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
