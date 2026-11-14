import {
  AIExtraction,
  Budget,
  Category,
  DashboardSummary,
  Expense,
  Goal,
  TransactionType,
  UpcomingBill,
  User,
} from '../types';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type UnauthorizedListener = () => void;
let unauthorizedListener: UnauthorizedListener | null = null;

export function setUnauthorizedListener(listener: UnauthorizedListener | null) {
  unauthorizedListener = listener;
}

function redirectToLogin() {
  if (unauthorizedListener) {
    unauthorizedListener();
  }
  if (
    typeof window !== 'undefined' &&
    window.location.pathname !== '/login' &&
    window.location.pathname !== '/register'
  ) {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

interface RequestOptions extends RequestInit {
  skipUnauthorizedRedirect?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipUnauthorizedRedirect = false, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(path, {
      ...rest,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    );
  }

  if (response.status === 401) {
    if (!skipUnauthorizedRedirect) {
      redirectToLogin();
    }
    throw new ApiError(401, 'Sessão expirada ou não autenticada.');
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const errorBody = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        code?: string;
      };
      throw new ApiError(
        response.status,
        errorBody.message ||
          errorBody.error ||
          `Erro na requisição (${response.status}).`,
        errorBody.code
      );
    }
    throw new ApiError(
      response.status,
      `Serviço indisponível (${response.status}).`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!isJson) {
    throw new ApiError(
      503,
      'API ainda não disponível neste ambiente.'
    );
  }

  return (await response.json()) as T;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface CreateExpensePayload {
  title: string;
  amountCents: number;
  type: TransactionType;
  category: Category;
  account: string;
  dateISO: string;
  time: string;
  notes?: string;
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export interface UpsertBudgetPayload {
  category: Category;
  limitCents: number;
  month: string;
}

export interface CreateGoalPayload {
  title: string;
  targetCents: number;
  monthlyContributionCents: number;
  deadlineLabel: string;
  yieldLabel?: string;
}

export const api = {
  auth: {
    me: () =>
      request<AuthResponse>('/api/auth/me', {
        method: 'GET',
        skipUnauthorizedRedirect: true,
      }),
    login: (payload: LoginPayload) =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipUnauthorizedRedirect: true,
      }),
    register: (payload: RegisterPayload) =>
      request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipUnauthorizedRedirect: true,
      }),
    logout: () =>
      request<void>('/api/auth/logout', {
        method: 'POST',
        skipUnauthorizedRedirect: true,
      }),
  },

  dashboard: {
    getSummary: (month?: string) => {
      const query = month ? `?month=${encodeURIComponent(month)}` : '';
      return request<DashboardSummary>(`/api/dashboard/summary${query}`, {
        method: 'GET',
      });
    },
  },

  expenses: {
    list: (params?: {
      search?: string;
      type?: TransactionType;
      category?: Category;
      account?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.account) searchParams.set('account', params.account);
      const qs = searchParams.toString();
      return request<{ expenses: Expense[] }>(
        `/api/expenses${qs ? `?${qs}` : ''}`,
        { method: 'GET' }
      );
    },
    create: (payload: CreateExpensePayload) =>
      request<{ expense: Expense }>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: UpdateExpensePayload) =>
      request<{ expense: Expense }>(`/api/expenses/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      request<void>(`/api/expenses/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    confirmCategory: (id: string, category: Category) =>
      request<{ expense: Expense }>(
        `/api/expenses/${encodeURIComponent(id)}/confirm-category`,
        {
          method: 'POST',
          body: JSON.stringify({ category }),
        }
      ),
    dismissSuggestion: (id: string) =>
      request<{ expense: Expense }>(
        `/api/expenses/${encodeURIComponent(id)}/dismiss-suggestion`,
        {
          method: 'POST',
        }
      ),
  },

  ai: {
    extractExpense: (text: string) =>
      request<{ extraction: AIExtraction }>('/api/ai/extract', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
  },

  budgets: {
    list: (month?: string) => {
      const query = month ? `?month=${encodeURIComponent(month)}` : '';
      return request<{ budgets: Budget[]; upcomingBills: UpcomingBill[] }>(
        `/api/budgets${query}`,
        { method: 'GET' }
      );
    },
    upsert: (payload: UpsertBudgetPayload) =>
      request<{ budget: Budget }>('/api/budgets', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    payBill: (billId: string) =>
      request<{ bill: UpcomingBill; expense: Expense }>(
        `/api/budgets/bills/${encodeURIComponent(billId)}/pay`,
        { method: 'POST' }
      ),
  },

  goals: {
    list: () =>
      request<{ goals: Goal[] }>('/api/goals', {
        method: 'GET',
      }),
    create: (payload: CreateGoalPayload) =>
      request<{ goal: Goal }>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    contribute: (id: string, amountCents: number) =>
      request<{ goal: Goal; expense: Expense }>(
        `/api/goals/${encodeURIComponent(id)}/contribute`,
        {
          method: 'POST',
          body: JSON.stringify({ amountCents }),
        }
      ),
  },
};
