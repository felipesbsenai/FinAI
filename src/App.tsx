import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  LogOut,
  Moon,
  PieChart,
  Plus,
  Sun,
  Target,
  Wallet,
} from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { BudgetsScreen } from './components/BudgetsScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { OverviewScreen } from './components/OverviewScreen';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsScreen } from './components/TransactionsScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { api } from './lib/api';
import {
  Budget,
  Category,
  DashboardSummary,
  Expense,
  Goal,
  ScreenId,
  TransactionType,
  UpcomingBill,
} from './types';
import { formatCentsToBRL } from './utils/formatters';

const THEME_STORAGE_KEY = 'finai_theme';

const NAV_ITEMS: Array<{
  id: ScreenId;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
}> = [
  {
    id: 'overview',
    path: '/',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    subtitle: 'Consolidado patrimonial e fluxo financeiro mensal',
  },
  {
    id: 'transactions',
    path: '/extrato',
    label: 'Extrato',
    icon: ArrowLeftRight,
    subtitle: 'Lançamentos, filtros por categoria e exportação CSV',
  },
  {
    id: 'budgets',
    path: '/orcamentos',
    label: 'Orçamentos',
    icon: PieChart,
    subtitle: 'Limites mensais por categoria e vencimentos próximos',
  },
  {
    id: 'goals',
    path: '/metas',
    label: 'Metas & Reservas',
    icon: Target,
    subtitle: 'Objetivos financeiros e acompanhamento de aportes',
  },
];

function pathToScreen(pathname: string): ScreenId {
  if (pathname === '/extrato') return 'transactions';
  if (pathname === '/orcamentos') return 'budgets';
  if (pathname === '/metas') return 'goals';
  return 'overview';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function FinAIWorkspace() {
  const { user, loading: authLoading, logout } = useAuth();

  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [masked, setMasked] = useState(false);

  // Remote state (empty by default, populated via /api/*)
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [budgetsError, setBudgetsError] = useState<string | null>(null);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const navigate = useCallback((nextPath: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setPathname(nextPath);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Redirect protected routes to /login when unauthenticated
  useEffect(() => {
    if (
      !authLoading &&
      !user &&
      pathname !== '/login' &&
      pathname !== '/register'
    ) {
      navigate('/login');
    }
  }, [authLoading, user, pathname, navigate]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setOverviewError(null);
    setExpensesError(null);
    setBudgetsError(null);
    setGoalsError(null);

    const [summaryRes, expensesRes, budgetsRes, goalsRes] =
      await Promise.allSettled([
        api.dashboard.getSummary(),
        api.expenses.list(),
        api.budgets.list(),
        api.goals.list(),
      ]);

    if (summaryRes.status === 'fulfilled') {
      setSummary(summaryRes.value);
    } else {
      setOverviewError(
        summaryRes.reason instanceof Error
          ? summaryRes.reason.message
          : 'Erro ao carregar resumo.'
      );
    }

    if (expensesRes.status === 'fulfilled') {
      setExpenses(expensesRes.value.expenses);
    } else {
      setExpensesError(
        expensesRes.reason instanceof Error
          ? expensesRes.reason.message
          : 'Erro ao carregar extrato.'
      );
    }

    if (budgetsRes.status === 'fulfilled') {
      setBudgets(budgetsRes.value.budgets);
      setUpcomingBills(budgetsRes.value.upcomingBills);
    } else {
      setBudgetsError(
        budgetsRes.reason instanceof Error
          ? budgetsRes.reason.message
          : 'Erro ao carregar orçamentos.'
      );
    }

    if (goalsRes.status === 'fulfilled') {
      setGoals(goalsRes.value.goals);
    } else {
      setGoalsError(
        goalsRes.reason instanceof Error
          ? goalsRes.reason.message
          : 'Erro ao carregar metas.'
      );
    }

    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    } else {
      setSummary(null);
      setExpenses([]);
      setBudgets([]);
      setUpcomingBills([]);
      setGoals([]);
    }
  }, [user, fetchAllData]);

  const handleSaveExpense = async (payload: {
    id?: string;
    title: string;
    amountCents: number;
    type: TransactionType;
    category: Category;
    account: string;
    dateISO: string;
    time: string;
    notes?: string;
  }) => {
    if (payload.id) {
      const { expense } = await api.expenses.update(payload.id, payload);
      setExpenses((prev) =>
        prev.map((item) => (item.id === expense.id ? expense : item))
      );
      showToast('Movimentação atualizada.');
    } else {
      const { expense } = await api.expenses.create(payload);
      setExpenses((prev) => [expense, ...prev]);
      showToast('Movimentação registrada.');
    }
    setEditingExpense(null);
    fetchAllData();
  };

  const handleDeleteExpense = async (id: string) => {
    await api.expenses.remove(id);
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    showToast('Movimentação removida.');
    fetchAllData();
  };

  const handleConfirmSuggestion = async (
    expenseId: string,
    category: Category
  ) => {
    const { expense } = await api.expenses.confirmCategory(expenseId, category);
    setExpenses((prev) =>
      prev.map((item) => (item.id === expense.id ? expense : item))
    );
    showToast('Categoria confirmada.');
  };

  const handleDismissSuggestion = async (expenseId: string) => {
    const { expense } = await api.expenses.dismissSuggestion(expenseId);
    setExpenses((prev) =>
      prev.map((item) => (item.id === expense.id ? expense : item))
    );
  };

  const handleUpsertBudget = async (category: Category, limitCents: number) => {
    const month = new Date().toISOString().slice(0, 7);
    const { budget } = await api.budgets.upsert({
      category,
      limitCents,
      month,
    });
    setBudgets((prev) => {
      const exists = prev.some((b) => b.category === budget.category);
      if (exists) {
        return prev.map((b) => (b.category === budget.category ? budget : b));
      }
      return [...prev, budget];
    });
    showToast('Orçamento atualizado.');
  };

  const handlePayBill = async (billId: string) => {
    const { bill, expense } = await api.budgets.payBill(billId);
    setUpcomingBills((prev) =>
      prev.map((b) => (b.id === bill.id ? bill : b))
    );
    setExpenses((prev) => [expense, ...prev]);
    showToast(`Pagamento de ${formatCentsToBRL(bill.amountCents)} registrado.`);
    fetchAllData();
  };

  const handleQuickSaveToGoal = async (goalId: string, amountCents: number) => {
    const { goal, expense } = await api.goals.contribute(goalId, amountCents);
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    setExpenses((prev) => [expense, ...prev]);
    showToast(`Aporte de ${formatCentsToBRL(amountCents)} registrado.`);
    fetchAllData();
  };

  const handleCreateGoal = async (payload: {
    title: string;
    targetCents: number;
    monthlyContributionCents: number;
    deadlineLabel: string;
  }) => {
    const { goal } = await api.goals.create(payload);
    setGoals((prev) => [...prev, goal]);
    showToast('Meta criada com sucesso.');
  };

  // Auth loading skeleton
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0b1326]">
        <div className="surface-card rounded-[18px] p-8 w-full max-w-sm space-y-4 animate-pulse">
          <div className="h-6 w-32 rounded bg-slate-200 dark:bg-white/10 mx-auto" />
          <div className="h-4 w-48 rounded bg-slate-100 dark:bg-white/5 mx-auto" />
          <div className="h-10 rounded-xl bg-slate-100 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  // Public auth routes (/login, /register) or unauthenticated redirect
  if (!user || pathname === '/login' || pathname === '/register') {
    return (
      <AuthScreen
        initialMode={pathname === '/register' ? 'register' : 'login'}
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
        }
        onSuccess={() => navigate('/')}
      />
    );
  }

  const activeScreen = pathToScreen(pathname);
  const activeNav = NAV_ITEMS.find((n) => n.id === activeScreen)!;
  const accounts = summary?.accounts ?? [];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[264px] lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:h-screen border-r border-slate-200 dark:border-white/7 bg-white dark:bg-[#060e20] px-4 py-6 justify-between">
        <div className="space-y-8">
          <div className="px-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-display font-extrabold text-sm">
              F
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-[#dae2fd]">
              FinAI
            </span>
          </div>

          <nav className="space-y-1" aria-label="Navegação principal">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-[#171f33] dark:text-[#c0c1ff]'
                      : 'text-slate-600 dark:text-[#c7c4d7] hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Connected Accounts Summary */}
          <div className="px-2 pt-4 border-t border-slate-200 dark:border-white/7 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-[#908fa0]">
              <Wallet className="w-3.5 h-3.5" />
              Contas
            </div>
            {accounts.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-[#908fa0]">
                Nenhuma conta registrada ainda.
              </p>
            ) : (
              <div className="space-y-2.5">
                {accounts.map((acc) => (
                  <div
                    key={acc.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-slate-600 dark:text-[#c7c4d7] truncate">
                      {acc.name}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-[#dae2fd] shrink-0">
                      {masked ? '•••••' : formatCentsToBRL(acc.balanceCents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Authenticated User Profile & Logout */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/7">
          <div className="flex items-center gap-3 px-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/15"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(user.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-[#dae2fd] truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#908fa0] truncate">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium text-slate-600 dark:text-[#c7c4d7] hover:text-rose-600 dark:hover:text-[#ffb4ab] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-[#F8FAFC]/85 dark:bg-[#0b1326]/80 border-b border-slate-200/80 dark:border-white/7 px-4 sm:px-6 lg:px-10 py-3.5">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="lg:hidden w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-display font-extrabold text-sm shrink-0">
                F
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-[#dae2fd] truncate">
                  {activeNav.label}
                </h1>
                <p className="hidden sm:block text-xs text-slate-500 dark:text-[#908fa0] truncate">
                  {activeNav.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setMasked((prev) => !prev)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 dark:text-[#c7c4d7] border border-slate-200 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/6 transition-colors cursor-pointer"
                aria-label={masked ? 'Mostrar valores' : 'Ocultar valores'}
                title={masked ? 'Mostrar valores' : 'Ocultar valores'}
              >
                {masked ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
                }
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 dark:text-[#c7c4d7] border border-slate-200 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/6 transition-colors cursor-pointer"
                aria-label={
                  theme === 'dark'
                    ? 'Alternar para tema claro'
                    : 'Alternar para tema escuro'
                }
                title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setIsTxModalOpen(true);
                }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nova Movimentação</span>
                <span className="sm:hidden">Lançar</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 pt-6">
          <div className="max-w-[1280px] mx-auto">
            {activeScreen === 'overview' && (
              <OverviewScreen
                summary={summary}
                expenses={expenses}
                budgets={budgets}
                goals={goals}
                loading={dataLoading}
                error={overviewError}
                masked={masked}
                onRetry={fetchAllData}
                onNavigate={(screen) => {
                  const target = NAV_ITEMS.find((n) => n.id === screen);
                  if (target) navigate(target.path);
                }}
                onOpenNewModal={() => {
                  setEditingExpense(null);
                  setIsTxModalOpen(true);
                }}
                onEditExpense={(tx) => {
                  setEditingExpense(tx);
                  setIsTxModalOpen(true);
                }}
                onConfirmSuggestion={handleConfirmSuggestion}
                onDismissSuggestion={handleDismissSuggestion}
                onQuickSaveToGoal={handleQuickSaveToGoal}
              />
            )}

            {activeScreen === 'transactions' && (
              <TransactionsScreen
                expenses={expenses}
                loading={dataLoading}
                error={expensesError}
                masked={masked}
                onRetry={fetchAllData}
                onEditExpense={(tx) => {
                  setEditingExpense(tx);
                  setIsTxModalOpen(true);
                }}
                onOpenNewModal={() => {
                  setEditingExpense(null);
                  setIsTxModalOpen(true);
                }}
                onConfirmSuggestion={handleConfirmSuggestion}
              />
            )}

            {activeScreen === 'budgets' && (
              <BudgetsScreen
                budgets={budgets}
                upcomingBills={upcomingBills}
                loading={dataLoading}
                error={budgetsError}
                masked={masked}
                onRetry={fetchAllData}
                onUpsertBudget={handleUpsertBudget}
                onPayBill={handlePayBill}
              />
            )}

            {activeScreen === 'goals' && (
              <GoalsScreen
                goals={goals}
                loading={dataLoading}
                error={goalsError}
                masked={masked}
                onRetry={fetchAllData}
                onQuickSaveToGoal={handleQuickSaveToGoal}
                onCreateGoal={handleCreateGoal}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-15 backdrop-blur-lg bg-white/90 dark:bg-[#060e20]/90 border-t border-slate-200 dark:border-white/10 px-2 flex items-center justify-around"
        aria-label="Navegação mobile"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-[#c0c1ff]'
                  : 'text-slate-500 dark:text-[#908fa0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      <TransactionModal
        isOpen={isTxModalOpen}
        initialExpense={editingExpense}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
      />

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 px-4 py-3 rounded-xl surface-elevated text-xs font-semibold text-slate-900 dark:text-[#dae2fd]"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinAIWorkspace />
    </AuthProvider>
  );
}
