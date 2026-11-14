import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Pencil,
  PieChart,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  Budget,
  Category,
  EXPENSE_CATEGORIES,
  UpcomingBill,
} from '../types';
import {
  formatCentsInputMask,
  formatCentsToBRL,
  formatDueDate,
  parseInputToCents,
} from '../utils/formatters';
import { CATEGORY_META, CategoryBadgeIcon } from './CategoryBadgeIcon';
import { CurrencyDisplay } from './CurrencyDisplay';

interface BudgetsScreenProps {
  budgets: Budget[];
  upcomingBills: UpcomingBill[];
  loading: boolean;
  error: string | null;
  masked: boolean;
  onRetry: () => void;
  onUpsertBudget: (category: Category, limitCents: number) => Promise<void>;
  onPayBill: (billId: string) => Promise<void>;
}

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
  budgets,
  upcomingBills,
  loading,
  error,
  masked,
  onRetry,
  onUpsertBudget,
  onPayBill,
}) => {
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [draftCents, setDraftCents] = useState<number>(0);
  const [savingCat, setSavingCat] = useState<boolean>(false);

  const totalLimitCents = budgets.reduce((sum, b) => sum + b.limitCents, 0);
  const totalSpentCents = budgets.reduce((sum, b) => sum + b.spentCents, 0);
  const totalRemainingCents = totalLimitCents - totalSpentCents;

  const startEditing = (category: Category, currentLimitCents: number) => {
    setEditingCat(category);
    setDraftCents(currentLimitCents);
  };

  const commitLimit = async (category: Category) => {
    if (draftCents > 0) {
      setSavingCat(true);
      try {
        await onUpsertBudget(category, draftCents);
      } finally {
        setSavingCat(false);
      }
    }
    setEditingCat(null);
  };

  if (error) {
    return (
      <div className="surface-card rounded-[18px] p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-500 dark:text-[#ffb4ab] flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
            Erro ao carregar orçamentos
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#908fa0] max-w-md mx-auto">
            {error}
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="surface-card rounded-[18px] p-6 h-24" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 surface-card rounded-[18px] p-6 h-80" />
          <div className="lg:col-span-5 surface-card rounded-[18px] p-6 h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Summary Header */}
      <section className="surface-card rounded-[18px] p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-[#908fa0]">
              Teto mensal planejado
            </p>
            <div className="mt-1">
              <CurrencyDisplay
                cents={totalLimitCents}
                size="lg"
                masked={masked}
                className="text-slate-900 dark:text-[#dae2fd]"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-[#908fa0]">
              Realizado no mês
            </p>
            <div className="mt-1">
              <CurrencyDisplay
                cents={totalSpentCents}
                size="lg"
                masked={masked}
                className="text-indigo-600 dark:text-[#c0c1ff]"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-[#908fa0]">
              Margem restante
            </p>
            <div className="mt-1">
              <CurrencyDisplay
                cents={totalRemainingCents}
                size="lg"
                masked={masked}
                className={
                  totalRemainingCents >= 0
                    ? 'text-emerald-600 dark:text-[#4edea3]'
                    : 'text-rose-600 dark:text-[#ffb4ab]'
                }
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Envelopes */}
        <section className="lg:col-span-7 surface-card rounded-[18px] p-5 sm:p-6">
          <div className="pb-4 border-b border-slate-200/80 dark:border-white/7">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
              Envelopes por categoria
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#908fa0] mt-0.5">
              Acompanhamento sincronizado com os lançamentos da sua conta
            </p>
          </div>

          {budgets.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400 dark:text-[#908fa0]">
                <PieChart className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800 dark:text-[#dae2fd]">
                  Nenhum orçamento configurado
                </p>
                <p className="text-xs text-slate-500 dark:text-[#908fa0] max-w-sm mx-auto">
                  Defina tetos de gasto por categoria para receber alertas antes de ultrapassar o planejado.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => startEditing(cat, 0)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/12 text-slate-700 dark:text-[#dae2fd] hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    {cat}
                  </button>
                ))}
              </div>
              {editingCat && (
                <div className="mt-4 inline-flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-white/10">
                  <span className="text-xs font-medium text-slate-700 dark:text-[#dae2fd]">
                    {editingCat}: R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCentsInputMask(draftCents)}
                    onChange={(e) =>
                      setDraftCents(parseInputToCents(e.target.value))
                    }
                    className="w-28 px-2.5 py-1.5 rounded-lg text-xs font-semibold tabular-nums bg-white dark:bg-[#171f33] border border-indigo-500 text-slate-900 dark:text-[#dae2fd] focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={savingCat || draftCents <= 0}
                    onClick={() => commitLimit(editingCat)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white disabled:opacity-50 cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-white/6">
              {budgets.map((budget) => {
                const rawPct =
                  budget.limitCents > 0
                    ? Math.round((budget.spentCents / budget.limitCents) * 100)
                    : 0;
                const barPct = Math.min(100, rawPct);
                const meta =
                  CATEGORY_META[budget.category] ?? CATEGORY_META.Outros;
                const isExceeded = rawPct >= 100;
                const isWarning = rawPct >= 80 && rawPct < 100;

                return (
                  <div key={budget.id} className="py-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CategoryBadgeIcon category={budget.category} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-[#dae2fd]">
                            {meta.label}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs mt-0.5">
                            {isExceeded ? (
                              <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-[#ffb4ab]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Limite excedido ({rawPct}%)
                              </span>
                            ) : isWarning ? (
                              <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-[#ffb95f]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Próximo do teto ({rawPct}%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-[#4edea3]">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Dentro do limite ({rawPct}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {editingCat === budget.category ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatCentsInputMask(draftCents)}
                              onChange={(e) =>
                                setDraftCents(parseInputToCents(e.target.value))
                              }
                              className="w-28 px-2.5 py-1.5 rounded-lg text-xs font-semibold tabular-nums bg-slate-50 dark:bg-[#0b1326] border border-indigo-500 text-slate-900 dark:text-[#dae2fd] focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              disabled={savingCat}
                              onClick={() => commitLimit(budget.category)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white cursor-pointer"
                            >
                              Salvar
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="text-right tabular-nums">
                              <p className="text-sm font-bold text-slate-900 dark:text-[#dae2fd]">
                                {masked
                                  ? '•••••'
                                  : formatCentsToBRL(budget.spentCents)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-[#908fa0]">
                                de{' '}
                                {masked
                                  ? '•••••'
                                  : formatCentsToBRL(budget.limitCents)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(budget.category, budget.limitCents)
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#dae2fd] hover:bg-slate-100 dark:hover:bg-white/6 transition-colors cursor-pointer"
                              aria-label={`Editar teto de ${meta.label}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100 dark:bg-[#0b1326] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${barPct}%`,
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

        {/* Upcoming Bills */}
        <section className="lg:col-span-5 surface-card rounded-[18px] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/7">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-500 dark:text-[#ffb95f]" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
                Vencimentos próximos
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-[#908fa0] tabular-nums">
              {upcomingBills.filter((b) => !b.paid).length} em aberto
            </span>
          </div>

          {upcomingBills.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <p className="text-sm font-medium text-slate-700 dark:text-[#dae2fd]">
                Nenhum vencimento agendado
              </p>
              <p className="text-xs text-slate-500 dark:text-[#908fa0]">
                Suas contas recorrentes e faturas futuras aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-white/6">
              {upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="py-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        bill.paid
                          ? 'line-through text-slate-400 dark:text-[#908fa0]'
                          : 'text-slate-900 dark:text-[#dae2fd]'
                      }`}
                    >
                      {bill.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#908fa0] mt-0.5">
                      Vence em {formatDueDate(bill.dueDateISO)} · {bill.account}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <CurrencyDisplay
                      cents={bill.amountCents}
                      size="md"
                      masked={masked}
                      className="text-slate-900 dark:text-[#dae2fd]"
                    />

                    {bill.paid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-[#4edea3]">
                        <CheckCircle2 className="w-4 h-4" />
                        Pago
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPayBill(bill.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
