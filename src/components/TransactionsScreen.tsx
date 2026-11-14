import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  Category,
  EXPENSE_CATEGORIES,
  Expense,
  TransactionType,
} from '../types';
import { formatCompactDate } from '../utils/formatters';
import { CATEGORY_META, CategoryBadgeIcon } from './CategoryBadgeIcon';
import { CurrencyDisplay } from './CurrencyDisplay';

interface TransactionsScreenProps {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  masked: boolean;
  onRetry: () => void;
  onEditExpense: (expense: Expense) => void;
  onOpenNewModal: () => void;
  onConfirmSuggestion: (expenseId: string, category: Category) => Promise<void>;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  expenses,
  loading,
  error,
  masked,
  onRetry,
  onEditExpense,
  onOpenNewModal,
  onConfirmSuggestion,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const availableAccounts = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.account) set.add(e.account);
    });
    return Array.from(set).sort();
  }, [expenses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      if (accountFilter !== 'all' && tx.account !== accountFilter) return false;
      if (q) {
        const hay = `${tx.title} ${tx.account} ${tx.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, search, typeFilter, categoryFilter, accountFilter]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, tx) => {
        if (tx.type === 'income') acc.incomeCents += tx.amountCents;
        else acc.expenseCents += tx.amountCents;
        return acc;
      },
      { incomeCents: 0, expenseCents: 0 }
    );
  }, [filtered]);

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Data',
      'Hora',
      'Descrição',
      'Categoria',
      'Conta',
      'Tipo',
      'Valor (BRL)',
    ];
    const rows = filtered.map((tx) => [
      tx.dateISO,
      tx.time,
      `"${tx.title.replace(/"/g, '""')}"`,
      tx.category,
      tx.account,
      tx.type === 'income' ? 'Entrada' : 'Saída',
      ((tx.type === 'expense' ? -tx.amountCents : tx.amountCents) / 100)
        .toFixed(2)
        .replace('.', ','),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'finai-extrato.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="surface-card rounded-[18px] p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-500 dark:text-[#ffb4ab] flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
            Erro ao carregar extrato
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

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[18px] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#908fa0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descrição, categoria ou conta..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-white/8 text-slate-900 dark:text-[#dae2fd] placeholder:text-slate-400 dark:placeholder:text-[#908fa0]/70 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0b1326] border border-slate-200 dark:border-white/8">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'expense', label: 'Saídas' },
                { id: 'income', label: 'Entradas' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setTypeFilter(opt.id as 'all' | TransactionType)
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    typeFilter === opt.id
                      ? 'bg-white dark:bg-[#222a3d] text-slate-900 dark:text-[#dae2fd] shadow-sm'
                      : 'text-slate-600 dark:text-[#c7c4d7]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              aria-label="Filtrar por conta"
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#dae2fd] focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas as contas</option>
              {availableAccounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={filtered.length === 0}
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#dae2fd] border border-slate-200 dark:border-white/12 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`h-8 px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-[#2d3449] dark:text-[#dae2fd] dark:border-[#c0c1ff]/50'
                : 'bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200/70 dark:bg-[#0b1326] dark:text-[#c7c4d7] dark:border-white/8 dark:hover:bg-white/5'
            }`}
          >
            Todas
          </button>

          {EXPENSE_CATEGORIES.map((cat) => {
            const active = categoryFilter === cat;
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`h-8 px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-[#2d3449] dark:text-[#dae2fd] dark:border-[#c0c1ff]/50'
                    : 'bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200/70 dark:bg-[#0b1326] dark:text-[#c7c4d7] dark:border-white/8 dark:hover:bg-white/5'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface-card rounded-[18px] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/7">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-[#908fa0]">
            <span>
              <strong className="font-semibold text-slate-900 dark:text-[#dae2fd] tabular-nums">
                {filtered.length}
              </strong>{' '}
              lançamento{filtered.length === 1 ? '' : 's'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Entradas:{' '}
              <CurrencyDisplay
                cents={totals.incomeCents}
                size="sm"
                masked={masked}
                className="text-emerald-600 dark:text-[#4edea3]"
              />
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Saídas:{' '}
              <CurrencyDisplay
                cents={totals.expenseCents}
                size="sm"
                masked={masked}
                className="text-slate-900 dark:text-[#dae2fd]"
              />
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-4 space-y-3 animate-pulse" aria-busy="true">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-14 rounded-xl bg-slate-100 dark:bg-white/5"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400 dark:text-[#908fa0]">
              <ReceiptText className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-[#dae2fd]">
              {expenses.length === 0
                ? 'Seu extrato ainda está vazio.'
                : 'Nenhuma movimentação encontrada para os filtros selecionados.'}
            </p>
            <p className="text-xs text-slate-500 dark:text-[#908fa0]">
              {expenses.length === 0
                ? 'Registre uma nova movimentação para começar a acompanhar seus lançamentos.'
                : 'Limpe os filtros ou registre um novo lançamento financeiro.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              {expenses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('all');
                    setCategoryFilter('all');
                    setAccountFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/12 text-slate-700 dark:text-[#dae2fd] hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
              <button
                type="button"
                onClick={onOpenNewModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova movimentação
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/70 dark:divide-white/6">
            {filtered.map((tx) => {
              const catMeta = CATEGORY_META[tx.category] ?? CATEGORY_META.Outros;
              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onEditExpense(tx)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <CategoryBadgeIcon category={tx.category} type={tx.type} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-[#dae2fd] truncate">
                        {tx.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#908fa0] truncate mt-0.5">
                        {catMeta.label} · {tx.account} ·{' '}
                        {formatCompactDate(tx.dateISO)} · {tx.time}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    {tx.isSuggestionPending && tx.suggestedCategory && (
                      <button
                        type="button"
                        onClick={() =>
                          onConfirmSuggestion(tx.id, tx.suggestedCategory!)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-500/15 text-indigo-700 dark:text-[#c0c1ff] hover:bg-indigo-500/25 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        Confirmar {tx.suggestedCategory}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditExpense(tx)}
                      className="text-right cursor-pointer"
                    >
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
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
