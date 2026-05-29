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

- [x] 12. Refatoração: Extrair custom hooks das screens
  - Separar lógica de negócio (fetch, state, handlers) das telas em custom hooks reutilizáveis.
  - Subtasks:
    - [x] 12.1 Criar `src/hooks/useAgenda.ts` — extrair fetch de registros do dia, handleConfirm com optimistic update, refresh
    - [x] 12.2 Criar `src/hooks/useMedicamentos.ts` — extrair fetch de medicamentos, handleDelete, pacienteId resolution via vínculos
    - [x] 12.3 Criar `src/hooks/useHistorico.ts` — extrair fetch por período, cálculo de adesão, seleção de período
    - [x] 12.4 Criar `src/hooks/useNotificacoes.ts` — extrair fetch, handleMarkAsRead, refresh
    - [x] 12.5 Refatorar `AgendaScreen.tsx` para usar `useAgenda()` — screen fica apenas com JSX/layout
    - [x] 12.6 Refatorar `MedicamentosScreen.tsx` para usar `useMedicamentos()`
    - [x] 12.7 Refatorar `HistoricoScreen.tsx` para usar `useHistorico()`
    - [x] 12.8 Refatorar `NotificacoesScreen.tsx` para usar `useNotificacoes()`
    - [x] 12.9 Criar `src/hooks/useLogin.ts` — extrair lógica de login (form, submit, loading)
    - [x] 12.10 Criar `src/hooks/useRegister.ts` — extrair lógica de cadastro (form, tipo change, submit)
    - [x] 12.11 Refatorar `LoginScreen.tsx` para usar `useLogin()`
    - [x] 12.12 Refatorar `RegisterScreen.tsx` para usar `useRegister()`
  - Arquivos: `src/hooks/useAgenda.ts`, `src/hooks/useMedicamentos.ts`, `src/hooks/useHistorico.ts`, `src/hooks/useNotificacoes.ts`, `src/hooks/useLogin.ts`, `src/hooks/useRegister.ts`

- [x] 13. Refatoração: Separar componentes de UI das screens
  - Extrair componentes reutilizáveis para manter screens enxutas.
  - Subtasks:
    - [x] 13.1 Criar `src/components/PeriodSelector.tsx` — seletor de período reutilizável (usado em HistoricoScreen)
    - [x] 13.2 Criar `src/components/AdherenceCard.tsx` — card de percentual de adesão
    - [x] 13.3 Criar `src/components/NotificacaoItem.tsx` — extrair de NotificacoesScreen
    - [x] 13.4 Criar `src/components/MedicamentoCard.tsx` — extrair de MedicamentosScreen
    - [x] 13.5 Criar `src/components/EmptyState.tsx` — componente genérico de estado vazio (emoji + título + subtítulo)
    - [x] 13.6 Criar `src/components/ErrorState.tsx` — componente genérico de erro com botão retry
    - [x] 13.7 Criar `src/components/LoadingState.tsx` — ActivityIndicator centralizado
    - [x] 13.8 Criar `src/components/DatePickerInput.tsx` — date picker reutilizável com exibição DD/MM/AAAA
  - Arquivos: `src/components/PeriodSelector.tsx`, `src/components/AdherenceCard.tsx`, `src/components/NotificacaoItem.tsx`, `src/components/MedicamentoCard.tsx`, `src/components/EmptyState.tsx`, `src/components/ErrorState.tsx`, `src/components/LoadingState.tsx`, `src/components/DatePickerInput.tsx`

- [x] 14. Validação de formulários com react-hook-form + zod
  - Adicionar validação robusta com feedback visual inline em todos os formulários.
  - Subtasks:
    - [x] 14.1 Instalar `react-hook-form`, `@hookform/resolvers`, `zod`
    - [x] 14.2 Criar `src/schemas/loginSchema.ts` — validação de email (formato) e senha (min 6 chars)
    - [x] 14.3 Criar `src/schemas/registerSchema.ts` — schema condicional por tipo de usuário com refinements (campos obrigatórios por tipo, formato de data, formato de email, telefone opcional)
    - [x] 14.4 Criar `src/components/FormInput.tsx` — componente de input reutilizável que integra com react-hook-form (Controller), exibe label, borda vermelha em erro, mensagem de erro abaixo do campo
    - [x] 14.5 Refatorar `LoginScreen.tsx` — usar `useForm` + `zodResolver` + `FormInput`, validação on blur, submit só quando válido
    - [x] 14.6 Refatorar `RegisterScreen.tsx` — usar `useForm` + `zodResolver` + `FormInput`, campos condicionais com `watch('tipo')`, validação on blur
    - [x] 14.7 Refatorar `MedicamentoFormScreen.tsx` — criar schema de medicamento (nome, dosagem, instrucoes obrigatórios, intervalo_retorno_dias obrigatório quando necessita_retorno=true)
  - Arquivos: `src/schemas/loginSchema.ts`, `src/schemas/registerSchema.ts`, `src/schemas/medicamentoSchema.ts`, `src/components/FormInput.tsx`

- [x] 15. Date Picker pt-BR + fix obs_medicas obrigatório no cadastro
  - Substituir input de texto por date picker nativo e corrigir validação de obs_medicas.
  - Subtasks:
    - [x] 15.1 Instalar `@react-native-community/datetimepicker`
    - [x] 15.2 Criar `src/components/DatePickerInput.tsx` — componente reutilizável com exibição DD/MM/AAAA
    - [x] 15.3 Atualizar `RegisterScreen.tsx` — substituir TextInput de data_nascimento por DatePickerInput
    - [x] 15.4 Atualizar `registerSchema.ts` — tornar `obs_medicas` obrigatório para PACIENTE (min 1 char)
    - [x] 15.5 Atualizar payload do submit para sempre enviar obs_medicas
  - Arquivos: `src/components/DatePickerInput.tsx`, `src/screens/auth/RegisterScreen.tsx`, `src/schemas/registerSchema.ts`

- [x] 16. Tela de Vínculos (criar/listar/remover)
  - Implementar CRUD de vínculos entre responsável/cuidador e paciente.
  - Subtasks:
    - [x] 16.1 Criar `src/hooks/useVinculos.ts` — fetch, create, delete de vínculos via API
    - [x] 16.2 Criar `src/screens/main/VinculosScreen.tsx` — listagem com cards, form inline para criar, botão remover
    - [x] 16.3 Adicionar tab "Vínculos" no MainTabNavigator para RESPONSAVEL e CUIDADOR
  - Arquivos: `src/hooks/useVinculos.ts`, `src/screens/main/VinculosScreen.tsx`, `src/navigation/MainTabNavigator.tsx`

- [x] 17. Formulário de Cadastro/Edição de Medicamentos (CRUD completo)
  - Implementar formulário funcional com todos os campos do backend.
  - Subtasks:
    - [x] 17.1 Criar `src/schemas/medicamentoSchema.ts` — validação Zod para campos do medicamento
    - [x] 17.2 Implementar `src/screens/main/MedicamentoFormScreen.tsx` — formulário completo com nome, dosagem, instruções, data início, categoria, uso contínuo, retorno médico
    - [x] 17.3 Criar `src/navigation/MedicamentosNavigator.tsx` — stack navigator para empilhar lista → form → agendas
    - [x] 17.4 Atualizar `MedicamentosScreen.tsx` — FAB navega ao form, toque no card abre edição, botão de agendas
    - [x] 17.5 Atualizar `MedicamentoCard.tsx` — adicionar props onPress e onManageAgendas
    - [x] 17.6 Integrar seleção de categorias via GET /categorias no formulário
  - Arquivos: `src/schemas/medicamentoSchema.ts`, `src/screens/main/MedicamentoFormScreen.tsx`, `src/navigation/MedicamentosNavigator.tsx`, `src/screens/main/MedicamentosScreen.tsx`, `src/components/MedicamentoCard.tsx`

- [x] 18. Tela de Agendas (criar horários de tomada)
  - Implementar CRUD de agendas (horários) vinculadas a um medicamento.
  - Subtasks:
    - [x] 18.1 Criar `src/schemas/agendaSchema.ts` — validação para horário, frequência, dias_semana
    - [x] 18.2 Criar `src/hooks/useAgendasCrud.ts` — fetch, create, delete de agendas via API
    - [x] 18.3 Criar `src/screens/main/AgendaFormScreen.tsx` — time picker, seletor de frequência, chips de dias da semana, listagem de agendas existentes
    - [x] 18.4 Registrar AgendaForm no MedicamentosNavigator
  - Arquivos: `src/schemas/agendaSchema.ts`, `src/hooks/useAgendasCrud.ts`, `src/screens/main/AgendaFormScreen.tsx`, `src/navigation/MedicamentosNavigator.tsx`

- [x] 19. Medicamentos visível para Cuidador
  - Corrigir visibilidade da tab Remédios para incluir CUIDADOR além de RESPONSAVEL.
  - Subtasks:
    - [x] 19.1 Atualizar `MainTabNavigator.tsx` — exibir tab "Remédios" para RESPONSAVEL e CUIDADOR
    - [x] 19.2 Usar MedicamentosNavigator (stack) em vez de MedicamentosScreen diretamente na tab
  - Arquivos: `src/navigation/MainTabNavigator.tsx`

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
    [14],
    [15, 16, 17, 18, 19]
  ]
}
```

- Tasks 1-11: implementação base (concluídas)
- Task 12: extrair custom hooks (depende de 11)
- Task 13: extrair componentes de UI (depende de 12)
- Task 14: validação de formulários com react-hook-form + zod (depende de 13)
- Tasks 15-19: funcionalidades core faltantes (concluídas)

## Notes

- O app usa Expo SDK 56 (managed workflow) em vez de React Native CLI puro.
- `react-native-keychain` foi substituído por `expo-secure-store`.
- `@react-native-firebase/messaging` foi substituído por `expo-notifications`.
- `@react-navigation/stack` foi substituído por `@react-navigation/native-stack`.
- Timestamps da API estão em UTC e são convertidos para fuso local com `date-fns`.
- A tab "Remédios" aparece para usuários do tipo RESPONSAVEL e CUIDADOR.
- A tab "Agenda" aparece para PACIENTE e CUIDADOR.
- A tab "Vínculos" aparece para RESPONSAVEL e CUIDADOR.
- O campo `obs_medicas` é obrigatório para PACIENTE (alinhado com backend).
- O campo `data_nascimento` usa DatePicker nativo com exibição DD/MM/AAAA.
- Medicamentos usa stack navigator (MedicamentosNavigator) para empilhar lista → form → agendas.
