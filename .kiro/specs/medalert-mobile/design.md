# Design Document

## Overview

O app mobile do MedAlert é desenvolvido em React Native (TypeScript) para Android 10+ e iOS 14+. É o único cliente do sistema, comunicando-se com o backend via HTTPS/TLS 1.2+. A interface é projetada para acessibilidade de usuários com baixa familiaridade tecnológica. Timestamps vindos da API estão em UTC e são convertidos para o fuso local antes de exibir.

## Architecture

```
mobile/src/
├── navigation/
│   ├── AppNavigator.tsx         # raiz: Auth Stack vs Main Stack
│   ├── AuthStack.tsx            # Login, Cadastro
│   └── MainTabNavigator.tsx     # tabs por tipo de usuário
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── CadastroScreen.tsx
│   ├── agenda/
│   │   └── AgendaScreen.tsx
│   ├── medicamentos/
│   │   ├── MedicamentosScreen.tsx
│   │   ├── MedicamentoFormScreen.tsx
│   │   └── AgendaFormScreen.tsx
│   ├── historico/
│   │   └── HistoricoScreen.tsx
│   ├── notificacoes/
│   │   └── NotificacoesScreen.tsx
│   └── perfil/
│       ├── PerfilScreen.tsx
│       └── VinculosScreen.tsx
├── components/
│   └── RegistroTomadaCard.tsx
├── services/
│   ├── api.ts                   # instância axios + interceptor de refresh
│   ├── authService.ts           # login, logout, refresh
│   ├── usuariosService.ts
│   ├── vinculosService.ts
│   ├── medicamentosService.ts
│   ├── agendasService.ts
│   ├── registrosTomadaService.ts
│   ├── notificacoesService.ts
│   └── pushService.ts           # obter e atualizar push_token
├── contexts/
│   └── AuthContext.tsx          # access_token, refresh_token, tipo de usuário
├── constants/
│   ├── colors.ts
│   └── typography.ts
├── hooks/
│   └── useAuth.ts
└── types/
    └── index.ts                 # tipos TypeScript espelhando os schemas da API
```

## Components and Interfaces

### Navigation

#### AppNavigator (`src/navigation/AppNavigator.tsx`)
- Componente raiz que decide entre Auth Stack e Main Stack baseado no estado de autenticação do `AuthContext`.

#### MainTabNavigator (`src/navigation/MainTabNavigator.tsx`)
- Tabs condicionais por tipo de usuário:
  - `PACIENTE` / `CUIDADOR`: Agenda, Histórico, Alertas, Perfil
  - `RESPONSAVEL`: Remédios, Histórico, Alertas, Perfil
- Badge de notificações não lidas na tab de Alertas.

### Contexts

#### AuthContext (`src/contexts/AuthContext.tsx`)
- Estado global: `accessToken`, `refreshToken`, `user` (tipo de usuário), `isAuthenticated`
- Métodos: `login()`, `logout()`, `refreshSession()`
- Tokens armazenados com `react-native-keychain`

### Services

#### api.ts (`src/services/api.ts`)
- Instância axios com `baseURL` configurável
- Interceptor de request: injeta `Authorization: Bearer <accessToken>`
- Interceptor de response: ao receber HTTP 401, tenta refresh automático e retry da requisição original

#### pushService.ts (`src/services/pushService.ts`)
- `getDevicePushToken(): Promise<string>` — obtém token via FCM (Android) ou APNs (iOS)
- `updatePushToken(token: string): Promise<void>` — chama `PUT /usuarios/me/push-token`

### Screens

#### LoginScreen
- Campos: e-mail, senha
- Ação: `POST /auth/login` com `push_token` no payload
- Sucesso: armazena tokens e navega para Main Stack

#### CadastroScreen
- Campos condicionais por tipo de usuário (RN09, RN10)
- Validação frontend antes de `POST /usuarios`
- Sucesso: redireciona para LoginScreen

#### AgendaScreen
- Endpoint: `GET /pacientes/{id}/registros-tomada` (filtro: data de hoje)
- Exibe lista de `RegistroTomadaCard` ordenados por horário
- Pull-to-refresh

#### MedicamentosScreen / MedicamentoFormScreen / AgendaFormScreen
- CRUD de medicamentos e agendas para responsáveis
- Formulários com validação de campos obrigatórios
- Campos condicionais (ex: `dias_semana` quando frequência != DIARIA)

#### HistoricoScreen
- Seletor de período (7/15/30 dias)
- Percentual de adesão em destaque (vermelho se < 80%)
- Lista de registros filtráveis por status

#### NotificacoesScreen
- Lista de notificações com destaque visual para não lidas
- Ícones por tipo: LEMBRETE (sino), FALHA_TOMADA (alerta), RETORNO_MEDICO (calendário)
- Toque marca como lida via `PUT /notificacoes/{id}/lida`
- Tab label: "Alertas" (conforme design system)

#### PerfilScreen / VinculosScreen
- Exibição e edição do perfil do usuário autenticado
- Gestão de vínculos (criar/encerrar) para responsáveis e cuidadores

### Components

#### RegistroTomadaCard (`src/components/RegistroTomadaCard.tsx`)
- Props: `registro: RegistroTomada`, `onConfirm: (id) => void`
- Estilo visual por status: `status-confirmed` (confirmado), `status-delayed` (atrasado), `status-ignored` (ignorado), `status-pending` (pendente)
- Botão "Confirmar" visível apenas para PENDENTE ou ATRASADO

## Data Models

```typescript
type TipoUsuario = 'PACIENTE' | 'RESPONSAVEL' | 'CUIDADOR'
type NivelAutonomia = 'TOTAL' | 'PARCIAL' | 'DEPENDENTE'
type FrequenciaTomada = 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA'
type StatusTomada = 'PENDENTE' | 'CONFIRMADO' | 'ATRASADO' | 'IGNORADO'
type TipoNotificacao = 'LEMBRETE' | 'FALHA_TOMADA' | 'RETORNO_MEDICO'

interface Usuario {
  id: number
  nome: string
  email: string
  telefone?: string
  tipo: TipoUsuario
  ativo: boolean
  criado_em: string
  data_nascimento?: string
  obs_medicas?: string
  nivel_autonomia?: NivelAutonomia
  grau_parentesco?: string
  recebe_notificacoes?: boolean
}

interface Vinculo {
  id: number
  responsavel_id: number
  paciente_id: number
  data_inicio: string
  data_fim?: string
  ativo: boolean
}

interface Medicamento {
  id: number
  paciente_id: number
  categoria_id?: number
  nome: string
  dosagem: string
  instrucoes: string
  uso_continuo: boolean
  necessita_retorno: boolean
  intervalo_retorno_dias?: number
  data_inicio_tratamento: string
  data_proximo_retorno?: string
  ativo: boolean
  criado_em: string
  criado_por: number
  atualizado_em?: string
  atualizado_por?: number
}

interface Agenda {
  id: number
  medicamento_id: number
  horario: string
  frequencia: FrequenciaTomada
  dias_semana?: string
  tolerancia_minutos: number
  data_inicio: string
  data_fim?: string
  ativo: boolean
}

interface RegistroTomada {
  id: number
  agenda_id: number
  paciente_id: number
  data_hora_prevista: string
  data_hora_confirmacao?: string
  status: StatusTomada
  usuario_confirmacao_id?: number
}

interface Notificacao {
  id: number
  usuario_id: number
  registro_tomada_id?: number
  tipo: TipoNotificacao
  enviado_em: string
  lido_em?: string
}
```

## Correctness Properties

### Property 1: Refresh automático de token
Quando o access token expira (HTTP 401), o interceptor axios usa o refresh token para obter um novo access token e repete a requisição original sem intervenção do usuário.
**Validates: Requirements 1.3**

### Property 2: Conversão de timestamps
Todos os timestamps recebidos da API (UTC) são convertidos para o fuso horário local do dispositivo antes de exibição.
**Validates: Requirements 3.1**

### Property 3: Optimistic update com rollback
A confirmação de tomada atualiza a UI imediatamente; em caso de erro de rede, o estado é revertido e o usuário é notificado.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 4: Campos condicionais por tipo
O formulário de cadastro exibe campos obrigatórios diferentes conforme o tipo de usuário selecionado, impedindo submissão com campos faltantes.
**Validates: Requirements 2.1, 2.2**

### Property 5: Controle de acesso por tipo de usuário
Tabs e funcionalidades são exibidas condicionalmente conforme o tipo do usuário autenticado, impedindo acesso a funcionalidades não autorizadas.
**Validates: Requirements 5.1**

## Error Handling

| Cenário                              | Comportamento do App                                      |
|--------------------------------------|-----------------------------------------------------------|
| Erro de rede (sem conexão)           | Exibe mensagem "Sem conexão" e mantém estado anterior     |
| HTTP 401 (token expirado)            | Tenta refresh automático; se falhar, redireciona ao login |
| HTTP 403 (sem permissão)             | Exibe mensagem "Acesso negado"                            |
| HTTP 409 (conflito/duplicata)        | Exibe mensagem específica retornada pelo backend          |
| HTTP 422 (validação)                 | Exibe erros de validação nos campos correspondentes       |
| HTTP 404 (não encontrado)            | Exibe mensagem "Recurso não encontrado"                   |
| Falha na confirmação de tomada       | Reverte optimistic update e exibe Alert de erro           |
| Push token indisponível              | Loga warning; app funciona normalmente sem push           |

## Testing Strategy

- **Testes de componente**: Renderização correta de `RegistroTomadaCard` por status, campos condicionais no cadastro.
- **Testes de integração**: Fluxo login → agenda → confirmar tomada → histórico.
- **Testes de acessibilidade**: Verificar fonte mínima 16sp, área de toque 48x48dp, `accessibilityLabel` em elementos interativos, contraste WCAG AA.
- **Testes em dispositivos**: Android 10 (simulador) e iOS 14 (simulador).
- **Ferramentas**: Jest + React Native Testing Library para componentes; Detox ou Maestro para E2E.
