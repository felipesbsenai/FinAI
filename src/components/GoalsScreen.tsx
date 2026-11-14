import React, { useState } from 'react';
import { AlertCircle, Plus, RefreshCw, Target, X } from 'lucide-react';
import { Goal } from '../types';
import {
  formatCentsInputMask,
  formatCentsToBRL,
  parseInputToCents,
} from '../utils/formatters';
import { CurrencyDisplay } from './CurrencyDisplay';

interface GoalsScreenProps {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  masked: boolean;
  onRetry: () => void;
  onQuickSaveToGoal: (goalId: string, amountCents: number) => Promise<void>;
  onCreateGoal: (payload: {
    title: string;
    targetCents: number;
    monthlyContributionCents: number;
    deadlineLabel: string;
  }) => Promise<void>;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  loading,
  error,
  masked,
  onRetry,
  onQuickSaveToGoal,
  onCreateGoal,
}) => {
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [customCents, setCustomCents] = useState<number>(0);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newTargetCents, setNewTargetCents] = useState(0);
  const [newMonthlyCents, setNewMonthlyCents] = useState(0);
  const [newDeadline, setNewDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalSavedCents = goals.reduce((s, g) => s + g.currentCents, 0);
  const totalTargetCents = goals.reduce((s, g) => s + g.targetCents, 0);

  const handleContribution = async (goalId: string) => {
    if (customCents > 0) {
      await onQuickSaveToGoal(goalId, customCents);
    }
    setContributingId(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTargetCents <= 0) return;

    setSubmitting(true);
    try {
      await onCreateGoal({
        title: newTitle.trim(),
        targetCents: newTargetCents,
        monthlyContributionCents: newMonthlyCents,
        deadlineLabel: newDeadline.trim() || 'Sem prazo definido',
      });
      setNewTitle('');
      setNewTargetCents(0);
      setNewMonthlyCents(0);
      setNewDeadline('');
      setIsNewModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="surface-card rounded-[18px] p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-500 dark:text-[#ffb4ab] flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
            Erro ao carregar metas
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="surface-card rounded-[18px] p-6 h-44" />
          <div className="surface-card rounded-[18px] p-6 h-44" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[18px] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-[#908fa0]">
              Total acumulado em metas
            </p>
            <div className="mt-1">
              <CurrencyDisplay
                cents={totalSavedCents}
                size="lg"
                masked={masked}
                className="text-emerald-600 dark:text-[#4edea3]"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-[#908fa0]">
              Objetivo global combinado
            </p>
            <div className="mt-1">
              <CurrencyDisplay
                cents={totalTargetCents}
                size="lg"
                masked={masked}
                className="text-slate-900 dark:text-[#dae2fd]"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Meta Financeira
        </button>
      </section>

      {goals.length === 0 ? (
        <section className="surface-card rounded-[18px] py-14 px-6 text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-[#4edea3] flex items-center justify-center mx-auto">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
            Nenhuma meta financeira criada
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#908fa0] max-w-md mx-auto">
            Defina reservas de emergência ou objetivos de longo prazo para acompanhar sua evolução com aportes mensais.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar primeira meta
            </button>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {goals.map((goal) => {
            const pct =
              goal.targetCents > 0
                ? Math.min(
                    100,
                    Math.round((goal.currentCents / goal.targetCents) * 100)
                  )
                : 0;
            const isContributing = contributingId === goal.id;

            return (
              <section
                key={goal.id}
                className="surface-card rounded-[18px] p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Target className="w-[18px] h-[18px] text-emerald-500 dark:text-[#4edea3]" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#dae2fd]">
                        {goal.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#908fa0] mt-0.5">
                        Prazo {goal.deadlineLabel} · Aporte planejado{' '}
                        {masked
                          ? '•••••'
                          : formatCentsToBRL(goal.monthlyContributionCents)}
                        /mês
                      </p>
                    </div>
                  </div>

                  <span className="font-display text-sm font-bold text-emerald-600 dark:text-[#4edea3] tabular-nums">
                    {pct}% concluído
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs tabular-nums">
                    <span className="font-semibold text-slate-900 dark:text-[#dae2fd]">
                      {masked ? '•••••' : formatCentsToBRL(goal.currentCents)}
                    </span>
                    <span className="text-slate-500 dark:text-[#908fa0]">
                      Meta:{' '}
                      {masked ? '•••••' : formatCentsToBRL(goal.targetCents)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-[#0b1326] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 dark:bg-[#4edea3] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {isContributing ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0b1326] border border-emerald-500/50">
                      <span className="text-xs text-slate-400">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCentsInputMask(customCents)}
                        onChange={(e) =>
                          setCustomCents(parseInputToCents(e.target.value))
                        }
                        className="w-24 bg-transparent text-sm font-bold tabular-nums text-slate-900 dark:text-[#dae2fd] focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleContribution(goal.id)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    >
                      Confirmar aporte
                    </button>
                    <button
                      type="button"
                      onClick={() => setContributingId(null)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-[#c7c4d7] hover:bg-slate-100 dark:hover:bg-white/6 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setContributingId(goal.id);
                        setCustomCents(goal.monthlyContributionCents);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                    >
                      + Realizar aporte
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-md surface-elevated rounded-t-3xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/8">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-[#dae2fd]">
                Criar Nova Meta
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5">
                  Nome do objetivo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome da meta financeira"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5">
                    Valor alvo (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatCentsInputMask(newTargetCents)}
                    onChange={(e) =>
                      setNewTargetCents(parseInputToCents(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm tabular-nums bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5">
                    Aporte mensal (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCentsInputMask(newMonthlyCents)}
                    onChange={(e) =>
                      setNewMonthlyCents(parseInputToCents(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm tabular-nums bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5">
                  Prazo previsto
                </label>
                <input
                  type="text"
                  placeholder="MM/AAAA"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/12 text-slate-700 dark:text-[#c7c4d7] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || newTargetCents <= 0}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white cursor-pointer"
                >
                  {submitting ? 'Salvando...' : 'Criar meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
