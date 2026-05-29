# MedAlert Mobile

App mobile para o sistema MedAlert — alertas de medicamentos, confirmação de tomada e acompanhamento de adesão terapêutica para pacientes, responsáveis e cuidadores.

## Stack

- **Expo SDK 56** (managed workflow)
- **React Native** com **TypeScript**
- **React Navigation** (native-stack + bottom-tabs)
- **Axios** com interceptor de auto-refresh JWT
- **expo-secure-store** para armazenamento seguro de tokens
- **expo-notifications** para push notifications
- **react-hook-form** + **zod** para validação de formulários
- **date-fns** para formatação de datas

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo Go (SDK 54) ou development build (SDK 56)
- Backend MedAlert rodando (`uvicorn app.main:app --host 0.0.0.0 --port 8000`)

## Configuração

### 1. Instalar dependências

```bash
cd mobile
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com o IP da sua máquina:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.131:8000/api/v1
```

> Use o IP real da máquina (não `localhost`) para que o emulador/celular consiga acessar o backend.

### 3. Executar

```bash
npx expo start
```

Para development build (necessário para SDK 56):

```bash
npx expo run:android
```

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `EXPO_PUBLIC_API_URL` | URL base da API backend | `http://192.168.0.131:8000/api/v1` |

Variáveis com prefixo `EXPO_PUBLIC_` são injetadas automaticamente no bundle pelo Expo.

## Estrutura do projeto

```
mobile/src/
├── components/              # Componentes reutilizáveis
│   ├── AdherenceCard.tsx    # Card de percentual de adesão
│   ├── EmptyState.tsx       # Estado vazio genérico
│   ├── ErrorState.tsx       # Estado de erro com retry
│   ├── FormInput.tsx        # Input integrado com react-hook-form
│   ├── LoadingState.tsx     # Loading centralizado
│   ├── MedicamentoCard.tsx  # Card de medicamento
│   ├── NotificacaoItem.tsx  # Item de notificação
│   ├── PeriodSelector.tsx   # Seletor de período (7/15/30 dias)
│   └── RegistroTomadaCard.tsx # Card de registro de tomada
├── constants/
│   ├── colors.ts            # Design tokens de cor
│   └── typography.ts        # Tipografia, espaçamento, border-radius
├── contexts/
│   └── AuthContext.tsx      # Estado global de autenticação
├── hooks/                   # Custom hooks (lógica de negócio)
│   ├── useAgenda.ts         # Fetch agenda do dia + confirmação
│   ├── useHistorico.ts      # Fetch histórico + cálculo de adesão
│   ├── useMedicamentos.ts   # Fetch medicamentos + inativar
│   └── useNotificacoes.ts   # Fetch notificações + marcar como lida
├── navigation/
│   ├── AppNavigator.tsx     # Auth Stack vs Main Stack
│   └── MainTabNavigator.tsx # Tabs condicionais por tipo de usuário
├── schemas/                 # Validação com Zod
│   ├── loginSchema.ts       # Schema de login
│   └── registerSchema.ts   # Schema de cadastro (condicional por tipo)
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx  # Tela de login
│   │   └── RegisterScreen.tsx # Cadastro com campos condicionais
│   └── main/
│       ├── AgendaScreen.tsx       # Agenda do dia
│       ├── HistoricoScreen.tsx    # Histórico + % adesão
│       ├── MedicamentoFormScreen.tsx # Formulário de medicamento
│       ├── MedicamentosScreen.tsx # Lista de medicamentos
│       ├── NotificacoesScreen.tsx # Notificações
│       └── PerfilScreen.tsx       # Perfil + logout
├── services/
│   ├── api.ts               # Axios + interceptor auto-refresh
│   └── pushService.ts       # Push notifications (expo-notifications)
└── types/
    └── index.ts             # Tipos TypeScript (espelham a API)
```

## Funcionalidades por tipo de usuário

| Funcionalidade | Paciente | Responsável | Cuidador |
|----------------|----------|-------------|----------|
| Ver agenda do dia | ✓ | — | ✓ |
| Confirmar tomada | ✓ | ✓ | ✓ |
| Cadastrar medicamento | — | ✓ | — |
| Ver histórico de adesão | ✓ | ✓ | ✓ |
| Receber notificações | ✓ | ✓ | ✓ |

## Navegação

- **Não autenticado**: Login → Cadastro
- **Paciente/Cuidador**: Agenda | Histórico | Alertas | Perfil
- **Responsável**: Remédios | Histórico | Alertas | Perfil

## Design System

O app segue o design system definido em `.kiro/steering/ui-design.md`:

- Fonte: Plus Jakarta Sans (via sistema)
- Tamanho mínimo: 16px para conteúdo funcional
- Touch target mínimo: 48×48dp
- Contraste: WCAG AA (4.5:1)
- Status por cor + texto (acessibilidade para daltonismo)
- Cores de status: Pendente (#0056B3), Confirmado (#28A745), Atrasado (#DC3545), Ignorado (#6C757D)

## Testando com emulador

### MEmu

```bash
adb connect 127.0.0.1:21503
npx expo run:android
```

### Android Studio Emulator

```bash
# Listar AVDs disponíveis
C:\Users\<user>\AppData\Local\Android\Sdk\emulator\emulator -list-avds

# Iniciar emulador (PowerShell)
& "C:\Users\<user>\AppData\Local\Android\Sdk\emulator\emulator" "-avd" "Medium_Phone_API_36.1"

# Rodar o app
npx expo run:android
```

### Celular físico (mesma rede Wi-Fi)

1. Configure `EXPO_PUBLIC_API_URL` com o IP da máquina
2. Rode `npx expo start`
3. Escaneie o QR code com Expo Go (SDK 54) ou use development build

## Convenções

- **Screens**: apenas JSX/layout, sem lógica de negócio
- **Hooks**: toda lógica de fetch, state e handlers
- **Components**: puros/presentacionais, sem chamadas de API
- **Schemas**: validação tipada com Zod, integrada via react-hook-form
- **Acessibilidade**: `accessibilityLabel` e `accessibilityRole` em todos os elementos interativos
