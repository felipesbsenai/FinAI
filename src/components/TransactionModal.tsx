import React, { useEffect, useState } from 'react';
import { Sparkles, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import {
  Category,
  EXPENSE_CATEGORIES,
  Expense,
  TransactionType,
} from '../types';
import {
  formatCentsInputMask,
  parseInputToCents,
} from '../utils/formatters';
import { CATEGORY_META } from './CategoryBadgeIcon';

interface TransactionModalProps {
  isOpen: boolean;
  initialExpense?: Expense | null;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    title: string;
    amountCents: number;
    type: TransactionType;
    category: Category;
    account: string;
    dateISO: string;
    time: string;
    notes?: string;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialExpense,
  onClose,
  onSave,
  onDelete,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountCents, setAmountCents] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<Category>('Alimentação');
  const [account, setAccount] = useState<string>('Conta Principal');
  const [dateISO, setDateISO] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [extracting, setExtracting] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialExpense) {
        setType(initialExpense.type);
        setAmountCents(initialExpense.amountCents);
        setTitle(initialExpense.title);
        setCategory(initialExpense.category);
        setAccount(initialExpense.account);
        setDateISO(initialExpense.dateISO);
        setNotes(initialExpense.notes || '');
      } else {
        setType('expense');
        setAmountCents(0);
        setTitle('');
        setCategory('Alimentação');
        setAccount('Conta Principal');
        setDateISO(new Date().toISOString().slice(0, 10));
        setNotes('');
      }
      setAiPrompt('');
      setErrorMsg('');
      setSubmitting(false);
    }
  }, [isOpen, initialExpense]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountCents(parseInputToCents(e.target.value));
    if (errorMsg) setErrorMsg('');
  };

  const handleAIExtract = async () => {
    if (!aiPrompt.trim()) return;
    setExtracting(true);
    setErrorMsg('');
    try {
      const { extraction } = await api.ai.extractExpense(aiPrompt.trim());
      setTitle(extraction.title);
      setAmountCents(extraction.amountCents);
      setCategory(extraction.category);
      setType(extraction.type);
      if (extraction.dateISO) {
        setDateISO(extraction.dateISO);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível extrair os dados do lançamento.'
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Informe uma descrição para a movimentação.');
      return;
    }
    if (amountCents <= 0) {
      setErrorMsg('Informe um valor maior que R$ 0,00.');
      return;
    }

    const nowTime = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSave({
        id: initialExpense?.id,
        title: title.trim(),
        amountCents,
        type,
        category,
        account: account.trim() || 'Conta Principal',
        dateISO,
        time: initialExpense?.time || nowTime,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao salvar movimentação.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full sm:max-w-lg surface-elevated rounded-t-3xl sm:rounded-2xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/8">
          <h2
            id="tx-modal-title"
            className="font-display text-lg font-semibold text-slate-900 dark:text-[#dae2fd]"
          >
            {initialExpense ? 'Editar Movimentação' : 'Nova Movimentação'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-[#c7c4d7] hover:bg-slate-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Server-side AI Extraction input */}
          {!initialExpense && (
            <div className="surface-ai-glass rounded-xl p-3 space-y-2">
              <label
                htmlFor="ai-extract-input"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-[#dae2fd]"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-[#c0c1ff]" />
                Preenchimento assistido por texto
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="ai-extract-input"
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Descreva o gasto em linguagem natural..."
                  className="flex-1 px-3 py-2 rounded-lg text-xs bg-white/80 dark:bg-[#0b1326]/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  disabled={extracting || !aiPrompt.trim()}
                  onClick={handleAIExtract}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {extracting ? 'Extraindo...' : 'Extrair'}
                </button>
              </div>
            </div>
          )}

          {/* Segmented Type Selector */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0b1326] border border-slate-200 dark:border-white/8">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                type === 'expense'
                  ? 'bg-white dark:bg-[#222a3d] text-slate-900 dark:text-[#dae2fd] shadow-sm'
                  : 'text-slate-600 dark:text-[#c7c4d7]'
              }`}
            >
              Saída (Despesa)
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#c7c4d7]'
              }`}
            >
              Entrada (Receita)
            </button>
          </div>

          {/* Extra-Large Monetary Capture Input */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0b1326]/90 border border-slate-200 dark:border-white/8 focus-within:border-indigo-500 dark:focus-within:border-[#8083ff] transition-colors">
            <label
              htmlFor="monetary-amount"
              className="block text-xs font-medium text-slate-500 dark:text-[#908fa0] mb-1"
            >
              Valor da movimentação
            </label>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-medium text-slate-400 dark:text-[#908fa0] select-none">
                R$
              </span>
              <input
                id="monetary-amount"
                type="text"
                inputMode="numeric"
                value={formatCentsInputMask(amountCents)}
                onChange={handleAmountChange}
                className="w-full bg-transparent font-display text-[34px] sm:text-[40px] leading-tight font-extrabold tabular-nums text-slate-900 dark:text-[#dae2fd] focus:outline-none"
                aria-label="Valor em reais"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-title"
              className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5"
            >
              Descrição ou estabelecimento
            </label>
            <input
              id="tx-title"
              type="text"
              placeholder="Descrição do lançamento"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full px-3.5 py-3 rounded-xl text-sm bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] placeholder:text-slate-400 dark:placeholder:text-[#908fa0]/70 focus:outline-none focus:border-indigo-500 dark:focus:border-[#8083ff]"
            />
          </div>

          {/* Category Selector */}
          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-2">
              Categoria
            </span>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map((catId) => {
                const meta = CATEGORY_META[catId];
                const active = category === catId;
                return (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => setCategory(catId)}
                    className={`h-8 px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-[#2d3449] dark:text-[#dae2fd] dark:border-[#c0c1ff]/50'
                        : 'bg-slate-100/80 text-slate-700 border-slate-200 hover:bg-slate-200/70 dark:bg-[#0b1326] dark:text-[#c7c4d7] dark:border-white/8 dark:hover:bg-white/5'
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
          </div>

          {/* Account & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-account"
                className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5"
              >
                Conta ou cartão
              </label>
              <input
                id="tx-account"
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Nome da conta"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5"
              >
                Data
              </label>
              <input
                id="tx-date"
                type="date"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] focus:outline-none focus:border-indigo-500 tabular-nums"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-rose-600 dark:text-[#ffb4ab]">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {initialExpense && onDelete ? (
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onDelete(initialExpense.id);
                    onClose();
                  } catch (err) {
                    setErrorMsg(
                      err instanceof Error
                        ? err.message
                        : 'Erro ao excluir movimentação.'
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-[#ffb4ab] hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-[#c7c4d7] border border-slate-200 dark:border-white/12 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Salvando...'
                  : initialExpense
                    ? 'Salvar alterações'
                    : 'Registrar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
