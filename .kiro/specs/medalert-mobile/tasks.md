# Implementation Plan

## Overview

App mobile MedAlert em React Native (TypeScript) com Expo SDK 56 para Android 10+ e iOS 14+. Interface para pacientes, responsáveis e cuidadores gerenciarem medicamentos, agendas, confirmações de tomada, notificações e histórico de adesão.

## Tasks

- [x] 1. Configuração inicial do projeto (Expo SDK 56)
  - Inicializar projeto Expo e instalar dependências base.
  - Subtasks:
    - [x] 1.1 Inicializar projeto com `npx create-expo-app --template blank-typescript`
    - [x] 1.2 Instalar dependências: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `axios`, `expo-secure-store`, `date-fns`, `expo-notifications`, `expo-device`
    - [x] 1.3 Criar `src/services/api.ts` com instância do axios e interceptor de token (auto-refresh)
    - [x] 1.4 Criar `src/contexts/AuthContext.tsx` com estado de autenticação global
    - [x] 1.5 Criar `src/constants/colors.ts` e `src/constants/typography.ts` com design tokens
    - [x] 1.6 Criar `src/types/index.ts` com todos os tipos TypeScript
  - Arquivos: `src/services/api.ts`, `src/contexts/AuthContext.tsx`, `src/constants/colors.ts`, `src/constants/typography.ts`, `src/types/index.ts`

- [x] 2. Autenticação e gerenciamento de sessão
  - Implementar login, refresh automático, logout e envio de push token.
  - Subtasks:
    - [x] 2.1 Criar `src/screens/auth/LoginScreen.tsx` com campos e-mail/senha
    - [x] 2.2 Implementar lógica de login: chamar `POST /auth/login`, armazenar tokens com `expo-secure-store`
    - [x] 2.3 Implementar interceptor axios para refresh automático do access token (HTTP 401 → refresh → retry)
    - [x] 2.4 Implementar logout: chamar `POST /auth/logout` e limpar tokens
    - [x] 2.5 Criar `src/services/pushService.ts` com `expo-notifications` para obter e registrar push token
  - Arquivos: `src/screens/auth/LoginScreen.tsx`, `src/services/pushService.ts`

- [x] 3. Telas de cadastro de usuário
  - Formulário de cadastro com campos condicionais por tipo de usuário.
  - Subtasks:
    - [x] 3.1 Criar `src/screens/auth/RegisterScreen.tsx` com seletor de tipo de usuário
    - [x] 3.2 Exibir campos condicionais: `data_nascimento`, `obs_medicas`, `nivel_autonomia` para `PACIENTE`
    - [x] 3.3 Exibir campos condicionais: `grau_parentesco`, `recebe_notificacoes` para `RESPONSAVEL`/`CUIDADOR`
    - [x] 3.4 Validar campos obrigatórios no frontend antes de chamar `POST /usuarios`
  - Arquivos: `src/screens/auth/RegisterScreen.tsx`

- [x] 4. Navegação principal e estrutura de tabs
  - Configurar navegação condicional por tipo de usuário.
  - Subtasks:
    - [x] 4.1 Criar `src/navigation/AppNavigator.tsx` com stack de autenticação e stack principal
    - [x] 4.2 Criar `src/navigation/MainTabNavigator.tsx` com tabs: Agenda, Histórico, Alertas, Perfil
    - [x] 4.3 Para usuários `RESPONSAVEL`, exibir tab "Remédios" em vez de "Agenda"
    - [x] 4.4 Configurar `tabBarAccessibilityLabel` em todas as tabs
  - Arquivos: `src/navigation/AppNavigator.tsx`, `src/navigation/MainTabNavigator.tsx`

- [x] 5. Tela de agenda do dia
  - Listagem de registros de tomada do dia com cards estilizados por status.
  - Subtasks:
    - [x] 5.1 Criar `src/screens/main/AgendaScreen.tsx` com listagem de `REGISTRO_TOMADA` do dia
    - [x] 5.2 Criar componente `src/components/RegistroTomadaCard.tsx` com estilo por status (cores distintas)
    - [x] 5.3 Implementar pull-to-refresh
    - [x] 5.4 Exibir horário previsto, nome do medicamento, dosagem e instruções resumidas em cada card
    - [x] 5.5 Exibir botão "Confirmar" apenas para registros com status `PENDENTE` ou `ATRASADO`
  - Arquivos: `src/screens/main/AgendaScreen.tsx`, `src/components/RegistroTomadaCard.tsx`

- [x] 6. Confirmação de tomada
  - Implementar confirmação com optimistic update e tratamento de erros.
  - Subtasks:
    - [x] 6.1 Ao tocar em "Confirmar", chamar `PUT /registros-tomada/{id}/confirmar`
    - [x] 6.2 Atualizar o card localmente com optimistic update antes da resposta do servidor
    - [x] 6.3 Em caso de erro, reverter o estado e exibir `Alert` com mensagem de falha
    - [x] 6.4 Exibir feedback visual (card muda para verde) após confirmação bem-sucedida

- [x] 7. Telas de gestão de medicamentos (Responsável)
  - CRUD de medicamentos e configuração de agendas.
  - Subtasks:
    - [x] 7.1 Criar `src/screens/main/MedicamentosScreen.tsx` com listagem de medicamentos do paciente
    - [x] 7.2 Criar `src/screens/main/MedicamentoFormScreen.tsx` (placeholder para cadastro/edição)
    - [x] 7.3 Implementar FAB para adicionar medicamento
    - [x] 7.4 Implementar long-press para inativar medicamento com confirmação
  - Arquivos: `src/screens/main/MedicamentosScreen.tsx`, `src/screens/main/MedicamentoFormScreen.tsx`

- [x] 8. Tela de histórico e adesão
  - Exibição de percentual de adesão e lista de registros por período.
  - Subtasks:
    - [x] 8.1 Criar `src/screens/main/HistoricoScreen.tsx` com seletor de período (7/15/30 dias)
    - [x] 8.2 Exibir percentual de adesão em destaque; vermelho se < 80%
    - [x] 8.3 Listar registros de tomada do período com status badge
    - [x] 8.4 Pull-to-refresh e estados de loading/erro
  - Arquivos: `src/screens/main/HistoricoScreen.tsx`

- [x] 9. Telas de notificações
  - Listagem de notificações com destaque para não lidas e navegação contextual.
  - Subtasks:
    - [x] 9.1 Criar `src/screens/main/NotificacoesScreen.tsx` com listagem
    - [x] 9.2 Destacar notificações não lidas (fundo diferente + ponto indicador)
    - [x] 9.3 Ao tocar, chamar `PUT /notificacoes/{id}/lida` e atualizar estado local
    - [x] 9.4 Exibir ícone diferente por tipo: 🔔 LEMBRETE, ⚠️ FALHA_TOMADA, 📅 RETORNO_MEDICO
  - Arquivos: `src/screens/main/NotificacoesScreen.tsx`

- [x] 10. Integração de push notifications
  - Configurar handlers de notificação em foreground/background.
  - Subtasks:
    - [x] 10.1 Configurar `Notifications.setNotificationHandler` para foreground (show alert + sound + badge)
    - [x] 10.2 Adicionar listener de resposta (tap em notificação)
    - [x] 10.3 Configurar Android notification channel
    - [x] 10.4 Integrar `setupNotificationHandlers()` no `App.tsx`
  - Arquivos: `src/services/pushService.ts`, `App.tsx`

- [x] 11. Acessibilidade
  - Garantir conformidade com padrões de acessibilidade.
  - Subtasks:
    - [x] 11.1 Garantir fonte mínima de 16px em todos os textos de conteúdo
    - [x] 11.2 Garantir área de toque mínima de 48x48dp em todos os botões
    - [x] 11.3 Adicionar `accessibilityLabel` e `accessibilityRole` em todos os elementos interativos

- [ ] 12. Refatoração: Extrair custom hooks das screens
  - Separar lógica de negócio (fetch, state, handlers) das telas em custom hooks reutilizáveis.
  - Subtasks:
    - [ ] 12.1 Criar `src/hooks/useAgenda.ts` — extrair fetch de registros do dia, handleConfirm com optimistic update, refresh
    - [ ] 12.2 Criar `src/hooks/useMedicamentos.ts` — extrair fetch de medicamentos, handleDelete, pacienteId resolution via vínculos
    - [ ] 12.3 Criar `src/hooks/useHistorico.ts` — extrair fetch por período, cálculo de adesão, seleção de período
    - [ ] 12.4 Criar `src/hooks/useNotificacoes.ts` — extrair fetch, handleMarkAsRead, refresh
    - [ ] 12.5 Refatorar `AgendaScreen.tsx` para usar `useAgenda()` — screen fica apenas com JSX/layout
    - [ ] 12.6 Refatorar `MedicamentosScreen.tsx` para usar `useMedicamentos()`
    - [ ] 12.7 Refatorar `HistoricoScreen.tsx` para usar `useHistorico()`
    - [ ] 12.8 Refatorar `NotificacoesScreen.tsx` para usar `useNotificacoes()`
  - Arquivos: `src/hooks/useAgenda.ts`, `src/hooks/useMedicamentos.ts`, `src/hooks/useHistorico.ts`, `src/hooks/useNotificacoes.ts`

- [ ] 13. Refatoração: Separar componentes de UI das screens
  - Extrair componentes reutilizáveis para manter screens enxutas.
  - Subtasks:
    - [ ] 13.1 Criar `src/components/PeriodSelector.tsx` — seletor de período reutilizável (usado em HistoricoScreen)
    - [ ] 13.2 Criar `src/components/AdherenceCard.tsx` — card de percentual de adesão
    - [ ] 13.3 Criar `src/components/NotificacaoItem.tsx` — extrair de NotificacoesScreen
    - [ ] 13.4 Criar `src/components/MedicamentoCard.tsx` — extrair de MedicamentosScreen
    - [ ] 13.5 Criar `src/components/EmptyState.tsx` — componente genérico de estado vazio (emoji + título + subtítulo)
    - [ ] 13.6 Criar `src/components/ErrorState.tsx` — componente genérico de erro com botão retry
    - [ ] 13.7 Criar `src/components/LoadingState.tsx` — ActivityIndicator centralizado
  - Arquivos: `src/components/PeriodSelector.tsx`, `src/components/AdherenceCard.tsx`, `src/components/NotificacaoItem.tsx`, `src/components/MedicamentoCard.tsx`, `src/components/EmptyState.tsx`, `src/components/ErrorState.tsx`, `src/components/LoadingState.tsx`

- [ ] 14. Validação de formulários com react-hook-form + zod
  - Adicionar validação robusta com feedback visual inline em todos os formulários.
  - Subtasks:
    - [ ] 14.1 Instalar `react-hook-form`, `@hookform/resolvers`, `zod`
    - [ ] 14.2 Criar `src/schemas/loginSchema.ts` — validação de email (formato) e senha (min 6 chars)
    - [ ] 14.3 Criar `src/schemas/registerSchema.ts` — schema condicional por tipo de usuário com refinements (campos obrigatórios por tipo, formato de data, formato de email, telefone opcional)
    - [ ] 14.4 Criar `src/components/FormInput.tsx` — componente de input reutilizável que integra com react-hook-form (Controller), exibe label, borda vermelha em erro, mensagem de erro abaixo do campo
    - [ ] 14.5 Refatorar `LoginScreen.tsx` — usar `useForm` + `zodResolver` + `FormInput`, validação on blur, submit só quando válido
    - [ ] 14.6 Refatorar `RegisterScreen.tsx` — usar `useForm` + `zodResolver` + `FormInput`, campos condicionais com `watch('tipo')`, validação on blur
    - [ ] 14.7 Refatorar `MedicamentoFormScreen.tsx` — criar schema de medicamento (nome, dosagem, instrucoes obrigatórios, intervalo_retorno_dias obrigatório quando necessita_retorno=true)
  - Arquivos: `src/schemas/loginSchema.ts`, `src/schemas/registerSchema.ts`, `src/components/FormInput.tsx`

## Task Dependency Graph

```json
{
  "waves": [
    [1],
    [2, 3],
    [4],
    [5, 7, 9],
    [6, 8],
    [10],
    [11],
    [12],
    [13],
    [14]
  ]
}
```

- Tasks 1-11: implementação base (concluídas)
- Task 12: extrair custom hooks (depende de 11)
- Task 13: extrair componentes de UI (depende de 12)
- Task 14: validação de formulários com react-hook-form + zod (depende de 13)

## Notes

- O app usa Expo SDK 56 (managed workflow) em vez de React Native CLI puro.
- `react-native-keychain` foi substituído por `expo-secure-store`.
- `@react-native-firebase/messaging` foi substituído por `expo-notifications`.
- `@react-navigation/stack` foi substituído por `@react-navigation/native-stack`.
- Timestamps da API estão em UTC e são convertidos para fuso local com `date-fns`.
- A tab "Remédios" só aparece para usuários do tipo RESPONSAVEL.
- A tab "Agenda" só aparece para PACIENTE e CUIDADOR.
