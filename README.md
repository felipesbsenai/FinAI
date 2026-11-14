# FinAI — Inteligência Financeira Pessoal

Aplicação web de gestão financeira pessoal (`pt-BR`) projetada para hospedagem no **Cloudflare Pages** com **Pages Functions** e banco de dados **Cloudflare D1**.

---

## Arquitetura

- **Front-end (SPA):** React 19 + TypeScript + Vite + Tailwind CSS v4, com suporte nativo a tema escuro/claro, formatação monetária em `pt-BR` (`R$`) e estados completos de carregamento (*skeleton*), vazio (*empty state*) e erro.
- **Precisão Monetária:** Todos os valores financeiros trafegam entre cliente e servidor como **inteiros em centavos** (`amountCents`, `limitCents`, `spentCents`, `targetCents`), sendo convertidos e formatados apenas na camada de exibição (`src/utils/formatters.ts` e `CurrencyDisplay`).
- **Camada de API (`src/lib/api.ts`):** Cliente HTTP centralizado usando `fetch` para caminhos relativos `/api/...`, enviando `credentials: "include"` (cookies `HttpOnly` de sessão) e redirecionamento automático para `/login` em respostas `401`.
- **Autenticação (`src/contexts/AuthContext.tsx`):** `AuthProvider` e hook `useAuth()` expondo `user`, `login()`, `register()`, `logout()` e `loading`, com proteção de rotas privadas no front-end.
- **Back-end (próxima etapa):** Cloudflare Pages Functions em `/functions/api/[[route]].ts` com roteamento configurado via `/public/_routes.json` e migrações SQL versionadas em `/migrations`. Nenhuma chave de API ou segredo é exposta no código do front-end.

### Estrutura de Pastas

```text
├── functions/
│   └── api/
│       └── [[route]].ts     # Roteador Pages Functions (/api/*)
├── migrations/              # Migrações SQL para Cloudflare D1
├── public/
│   └── _routes.json         # Roteamento Cloudflare Pages (/api/*)
├── src/
│   ├── components/          # Telas e componentes de UI (sem dados fixos)
│   ├── contexts/
│   │   └── AuthContext.tsx  # Provedor de autenticação e hook useAuth()
│   ├── lib/
│   │   └── api.ts           # Cliente HTTP (/api/*, credentials: "include")
│   ├── utils/
│   │   └── formatters.ts    # Conversão centavos -> BRL apenas na exibição
│   ├── types.ts             # Tipos compartilhados (User, Expense, Budget, etc.)
│   └── App.tsx              # Roteamento e shell principal
└── README.md
```

---

## Endpoints Previstos (`/api/*`)

Todos os endpoints utilizam JSON (`application/json`) e sessão via cookie `HttpOnly` (`credentials: "include"`). Valores monetários nos payloads e respostas são inteiros em centavos.

### Autenticação
| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Retorna `{ user }` da sessão atual ou `401`. |
| `POST` | `/api/auth/login` | Autentica `{ email, password }`, cria cookie de sessão e retorna `{ user }`. |
| `POST` | `/api/auth/register` | Cria conta `{ name, email, password }`, inicia sessão e retorna `{ user }`. |
| `POST` | `/api/auth/logout` | Encerra a sessão atual e limpa o cookie. |

### Painel & Resumo
| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary?month=YYYY-MM` | Retorna `DashboardSummary` (saldo consolidado, entradas/saídas do mês, taxa de poupança, contas e série histórica). |

### Lançamentos (`Expense`)
| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/expenses` | Lista lançamentos `{ expenses: Expense[] }` com filtros opcionais (`search`, `type`, `category`, `account`). |
| `POST` | `/api/expenses` | Cria um novo lançamento (`amountCents` inteiro) e retorna `{ expense }`. |
| `PATCH` | `/api/expenses/:id` | Atualiza dados de um lançamento existente e retorna `{ expense }`. |
| `DELETE` | `/api/expenses/:id` | Remove um lançamento pelo `id` (`204 No Content`). |
| `POST` | `/api/expenses/:id/confirm-category` | Confirma categoria sugerida `{ category }` e retorna `{ expense }`. |
| `POST` | `/api/expenses/:id/dismiss-suggestion` | Descarta sugestão pendente de categoria e retorna `{ expense }`. |

### Extração Assistida por IA (Server-side)
| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/ai/extract` | Recebe `{ text }` em linguagem natural, processa no servidor com chave protegida no Cloudflare Workers/Pages e retorna `{ extraction: AIExtraction }`. |

### Orçamentos & Vencimentos
| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/budgets?month=YYYY-MM` | Retorna `{ budgets: Budget[], upcomingBills: UpcomingBill[] }`. |
| `PUT` | `/api/budgets` | Cria ou atualiza limite mensal `{ category, limitCents, month }` e retorna `{ budget }`. |
| `POST` | `/api/budgets/bills/:id/pay` | Marca vencimento como pago, gera lançamento correspondente e retorna `{ bill, expense }`. |

### Metas Financeiras
| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/goals` | Lista `{ goals: Goal[] }` do usuário autenticado. |
| `POST` | `/api/goals` | Cria nova meta `{ title, targetCents, monthlyContributionCents, deadlineLabel }` e retorna `{ goal }`. |
| `POST` | `/api/goals/:id/contribute` | Registra aporte `{ amountCents }`, atualiza meta e cria lançamento no extrato (`{ goal, expense }`). |
