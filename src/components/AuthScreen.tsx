import React, { useState } from 'react';
import { Lock, Mail, Moon, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthScreenProps {
  initialMode?: 'login' | 'register';
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  theme,
  onToggleTheme,
  onSuccess,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg('Preencha e-mail e senha.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      onSuccess();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir a autenticação.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd]">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-display font-extrabold text-sm">
            F
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            FinAI
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 dark:text-[#c7c4d7] border border-slate-200 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/6 transition-colors cursor-pointer"
          aria-label={
            theme === 'dark'
              ? 'Alternar para tema claro'
              : 'Alternar para tema escuro'
          }
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md surface-card rounded-[18px] p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-[#dae2fd]">
              {mode === 'login' ? 'Entrar na sua conta' : 'Criar nova conta'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#908fa0] mt-1">
              {mode === 'login'
                ? 'Acesse seu painel financeiro, orçamentos e metas pessoais.'
                : 'Comece a organizar suas finanças pessoais em centavos com precisão.'}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0b1326] border border-slate-200 dark:border-white/8">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#222a3d] text-slate-900 dark:text-[#dae2fd] shadow-sm'
                  : 'text-slate-600 dark:text-[#c7c4d7]'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#222a3d] text-slate-900 dark:text-[#dae2fd] shadow-sm'
                  : 'text-slate-600 dark:text-[#c7c4d7]'
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5"
                >
                  Nome
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-slate-600 dark:text-[#c7c4d7] mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dae2fd] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-medium text-rose-600 dark:text-[#ffb4ab]">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors cursor-pointer"
            >
              {submitting
                ? 'Autenticando...'
                : mode === 'login'
                  ? 'Entrar'
                  : 'Criar conta'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
