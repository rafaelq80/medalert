# Implementation Plan

## Overview

App mobile MedAlert em React Native (TypeScript) para Android 10+ e iOS 14+. Interface para pacientes, responsáveis e cuidadores gerenciarem medicamentos, agendas, confirmações de tomada, notificações e histórico de adesão.

## Tasks

- [ ] 1. Configuração inicial do projeto React Native
  - Inicializar projeto e instalar dependências base.
  - Subtasks:
    - [ ] 1.1 Inicializar projeto com `npx react-native init MedAlert --template react-native-template-typescript`
    - [ ] 1.2 Instalar dependências: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/stack`, `axios`, `@react-native-async-storage/async-storage`, `react-native-keychain`, `date-fns`
    - [ ] 1.3 Criar `src/services/api.ts` com instância do axios e interceptor de token (auto-refresh)
    - [ ] 1.4 Criar `src/contexts/AuthContext.tsx` com estado de autenticação global
    - [ ] 1.5 Criar `src/constants/colors.ts` e `src/constants/typography.ts` com design tokens
  - Arquivos: `src/services/api.ts`, `src/contexts/AuthContext.tsx`, `src/constants/colors.ts`, `src/constants/typography.ts`

- [ ] 2. Autenticação e gerenciamento de sessão
  - Implementar login, refresh automático, logout e envio de push token.
  - Subtasks:
    - [ ] 2.1 Criar `src/screens/auth/LoginScreen.tsx` com campos e-mail/senha
    - [ ] 2.2 Implementar lógica de login: chamar `POST /auth/login`, armazenar tokens com `react-native-keychain`
    - [ ] 2.3 Implementar interceptor axios para refresh automático do access token (HTTP 401 → refresh → retry)
    - [ ] 2.4 Implementar logout: chamar `POST /auth/logout` e limpar tokens do keychain
    - [ ] 2.5 Solicitar permissão de push notification no primeiro login e enviar `push_token` ao backend
  - Arquivos: `src/screens/auth/LoginScreen.tsx`, `src/hooks/useAuth.ts`

- [ ] 3. Telas de cadastro de usuário
  - Formulário de cadastro com campos condicionais por tipo de usuário.
  - Subtasks:
    - [ ] 3.1 Criar `src/screens/auth/RegisterScreen.tsx` com seletor de tipo de usuário
    - [ ] 3.2 Exibir campos condicionais: `data_nascimento`, `obs_medicas`, `nivel_autonomia` para `PACIENTE`
    - [ ] 3.3 Exibir campos condicionais: `grau_parentesco`, `recebe_notificacoes` para `RESPONSAVEL`/`CUIDADOR`
    - [ ] 3.4 Validar campos obrigatórios no frontend antes de chamar `POST /usuarios`
  - Arquivos: `src/screens/auth/RegisterScreen.tsx`

- [ ] 4. Navegação principal e estrutura de tabs
  - Configurar navegação condicional por tipo de usuário.
  - Subtasks:
    - [ ] 4.1 Criar `src/navigation/AppNavigator.tsx` com stack de autenticação e stack principal
    - [ ] 4.2 Criar `src/navigation/MainTabNavigator.tsx` com tabs: Agenda, Histórico, Notificações, Perfil
    - [ ] 4.3 Para usuários `RESPONSAVEL`/`CUIDADOR`, adicionar tab extra: Medicamentos
    - [ ] 4.4 Exibir badge de notificações não lidas na tab de notificações
  - Arquivos: `src/navigation/AppNavigator.tsx`, `src/navigation/MainTabNavigator.tsx`

- [ ] 5. Tela de agenda do dia
  - Listagem de registros de tomada do dia com cards estilizados por status.
  - Subtasks:
    - [ ] 5.1 Criar `src/screens/main/AgendaScreen.tsx` com listagem de `REGISTRO_TOMADA` do dia
    - [ ] 5.2 Criar componente `src/components/RegistroTomadaCard.tsx` com estilo por status (cores distintas)
    - [ ] 5.3 Implementar pull-to-refresh
    - [ ] 5.4 Exibir horário previsto, nome do medicamento, dosagem e instruções resumidas em cada card
    - [ ] 5.5 Exibir botão "Confirmar" apenas para registros com status `PENDENTE` ou `ATRASADO`
  - Arquivos: `src/screens/main/AgendaScreen.tsx`, `src/components/RegistroTomadaCard.tsx`

- [ ] 6. Confirmação de tomada
  - Implementar confirmação com optimistic update e tratamento de erros.
  - Subtasks:
    - [ ] 6.1 Ao tocar em "Confirmar", chamar `PUT /registros-tomada/{id}/confirmar`
    - [ ] 6.2 Atualizar o card localmente com optimistic update antes da resposta do servidor
    - [ ] 6.3 Em caso de erro, reverter o estado e exibir `Alert` com mensagem de falha
    - [ ] 6.4 Exibir animação de sucesso (checkmark verde) após confirmação bem-sucedida

- [ ] 7. Telas de gestão de medicamentos (Responsável)
  - CRUD de medicamentos e configuração de agendas.
  - Subtasks:
    - [ ] 7.1 Criar `src/screens/main/MedicamentosScreen.tsx` com listagem de medicamentos do paciente
    - [ ] 7.2 Criar `src/screens/main/MedicamentoFormScreen.tsx` com formulário de cadastro/edição
    - [ ] 7.3 Criar `src/screens/main/AgendaFormScreen.tsx` com configuração de horário e frequência
    - [ ] 7.4 No formulário de agenda, exibir seletor de dias da semana quando `frequencia != DIARIA`
    - [ ] 7.5 Implementar swipe-to-delete com confirmação para inativar medicamento
  - Arquivos: `src/screens/main/MedicamentosScreen.tsx`, `src/screens/main/MedicamentoFormScreen.tsx`, `src/screens/main/AgendaFormScreen.tsx`

- [ ] 8. Tela de histórico e adesão
  - Exibição de percentual de adesão e lista de registros por período.
  - Subtasks:
    - [ ] 8.1 Criar `src/screens/main/HistoricoScreen.tsx` com seletor de período (7/15/30 dias)
    - [ ] 8.2 Exibir percentual de adesão em destaque; vermelho se < 80%
    - [ ] 8.3 Criar gráfico simples de barras por semana usando `react-native-chart-kit` ou `victory-native`
    - [ ] 8.4 Listar registros de tomada do período com filtro por status
  - Arquivos: `src/screens/main/HistoricoScreen.tsx`

- [ ] 9. Telas de notificações
  - Listagem de notificações com destaque para não lidas e navegação contextual.
  - Subtasks:
    - [ ] 9.1 Criar `src/screens/main/NotificacoesScreen.tsx` com listagem
    - [ ] 9.2 Destacar notificações não lidas (fundo diferente ou ponto indicador)
    - [ ] 9.3 Ao tocar, chamar `PUT /notificacoes/{id}/lida` e navegar para tela relacionada
    - [ ] 9.4 Exibir ícone diferente por tipo: LEMBRETE (sino), FALHA_TOMADA (alerta), RETORNO_MEDICO (calendário)
  - Arquivos: `src/screens/main/NotificacoesScreen.tsx`

- [ ] 10. Integração de push notifications
  - Configurar FCM/APNs e handlers de notificação em foreground/background.
  - Subtasks:
    - [ ] 10.1 Instalar e configurar `@react-native-firebase/messaging` para Android (FCM)
    - [ ] 10.2 Configurar APNs para iOS com capabilities de push no Xcode
    - [ ] 10.3 Implementar handler de notificação em foreground: exibir banner nativo
    - [ ] 10.4 Implementar handler de notificação em background/killed: abrir tela correta ao tocar
    - [ ] 10.5 Criar `src/services/pushService.ts` para obter e atualizar `push_token` a cada login
  - Arquivos: `src/services/pushService.ts`

- [ ] 11. Testes e ajustes de acessibilidade
  - Garantir conformidade com padrões de acessibilidade e testar fluxos completos.
  - Subtasks:
    - [ ] 11.1 Garantir fonte mínima de 16sp em todos os textos de conteúdo
    - [ ] 11.2 Garantir área de toque mínima de 48x48dp em todos os botões
    - [ ] 11.3 Adicionar `accessibilityLabel` em todos os elementos interativos
    - [ ] 11.4 Testar fluxo completo: login → agenda → confirmar tomada → histórico
    - [ ] 11.5 Testar em dispositivo Android 10 e iOS 14 (ou simuladores equivalentes)

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
    [11]
  ]
}
```

- Task 1 (Configuração) é pré-requisito de todas as demais
- Tasks 2 e 3 (auth/cadastro) podem ser feitas em paralelo após Task 1
- Task 4 (navegação) depende de Tasks 2 e 3
- Tasks 5, 7 e 9 (telas principais) dependem de Task 4
- Task 6 (confirmação) depende de Task 5 (agenda)
- Task 8 (histórico) depende de Task 5
- Task 10 (push) depende de Tasks 5 e 9
- Task 11 (testes/acessibilidade) é a última

## Notes

- O app é o único cliente do backend MedAlert.
- Timestamps da API estão em UTC e devem ser convertidos para fuso local antes de exibir.
- Tokens são armazenados com `react-native-keychain` para segurança.
- A tab "Medicamentos" só aparece para usuários do tipo RESPONSAVEL.
- Itens fora do escopo: integração com prontuários, prescrição médica, relatórios PDF, múltiplos idiomas, chat, controle de estoque, integração com farmácias, notificações por SMS.
