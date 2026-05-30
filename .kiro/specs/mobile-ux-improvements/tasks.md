# Implementation Plan — Melhorias Visuais e UX do App Mobile

## Overview

Conjunto de 18 melhorias visuais, de acessibilidade e de experiência do usuário aplicadas ao app mobile MedAlert. Foco no público-alvo (idosos) e na fluidez de interação para responsáveis/cuidadores.

## Tasks

- [x] 1. Tela de Perfil completa (Paciente e Admin)
  - Refatorar PerfilScreen e AdminPerfilScreen com avatar, informações pessoais, preferências e ações.
  - Subtasks:
    - [x] 1.1 Adicionar avatar com iniciais do usuário
    - [x] 1.2 Exibir campos pessoais (telefone, data nascimento, obs médicas, nível autonomia, grau parentesco)
    - [x] 1.3 Seção de preferências (tema, tamanho de texto)
    - [x] 1.4 Botão de alterar senha
    - [x] 1.5 Versão do app no rodapé
    - [x] 1.6 Replicar estrutura no AdminPerfilScreen
  - Arquivos: `src/screens/main/PerfilScreen.tsx`, `src/screens/admin/AdminPerfilScreen.tsx`

- [ ] 2. Onboarding / Tela de boas-vindas
  - Criar fluxo de onboarding com slides explicativos para novos usuários.
  - Subtasks:
    - [ ] 2.1 Criar componente OnboardingScreen com 3 slides
    - [ ] 2.2 Persistir flag de "já viu onboarding" no SecureStore
    - [ ] 2.3 Integrar no AppNavigator (exibir antes do Main na primeira vez)
  - Arquivos: `src/screens/auth/OnboardingScreen.tsx`, `src/navigation/AppNavigator.tsx`
  - Nota: Não implementado nesta iteração — requer assets de ilustração.

- [x] 3. Feedback visual ao confirmar tomada
  - Animação de check e haptic feedback ao confirmar tomada na Agenda.
  - Subtasks:
    - [x] 3.1 Criar componente AnimatedCheck com spring animation
    - [x] 3.2 Integrar na AgendaScreen com Vibration.vibrate(100) ao confirmar
    - [x] 3.3 Integrar na NotificacoesScreen para quick confirm
  - Arquivos: `src/components/AnimatedCheck.tsx`, `src/screens/main/AgendaScreen.tsx`

- [x] 4. Badge de notificações não lidas na tab bar
  - Exibir contagem de notificações não lidas no ícone da tab "Alertas".
  - Subtasks:
    - [x] 4.1 Buscar contagem de não lidas no MainTabNavigator
    - [x] 4.2 Usar tabBarBadge com estilo vermelho
    - [x] 4.3 Atualizar a cada 30 segundos
  - Arquivos: `src/navigation/MainTabNavigator.tsx`

- [x] 5. Dark Mode
  - Implementar tema escuro com suporte a preferência do sistema.
  - Subtasks:
    - [x] 5.1 Criar darkColors em constants/colors.ts
    - [x] 5.2 Criar ThemeContext com persistência da preferência
    - [x] 5.3 Seletor de tema no Perfil (Sistema / Claro / Escuro)
    - [x] 5.4 StatusBar adapta ao tema
  - Arquivos: `src/constants/colors.ts`, `src/contexts/ThemeContext.tsx`, `App.tsx`

- [x] 6. Fontes escaláveis para acessibilidade (idosos)
  - Permitir aumento do tamanho de texto via preferência no perfil.
  - Subtasks:
    - [x] 6.1 Refatorar typography.ts com função scaled()
    - [x] 6.2 Persistir fontScaleOffset no SecureStore via ThemeContext
    - [x] 6.3 Seletor "Normal / Grande / Extra" no Perfil
  - Arquivos: `src/constants/typography.ts`, `src/contexts/ThemeContext.tsx`

- [x] 7. Agenda agrupada por período do dia
  - Agrupar registros de tomada em Manhã, Tarde e Noite com SectionList.
  - Subtasks:
    - [x] 7.1 Classificar registros por hora (< 12 = manhã, < 18 = tarde, >= 18 = noite)
    - [x] 7.2 Usar SectionList com headers estilizados (ícone + título + contagem)
    - [x] 7.3 Manter banner de alerta e seletor de paciente
  - Arquivos: `src/screens/main/AgendaScreen.tsx`

- [x] 8. Histórico com barra de progresso e comparação
  - Melhorar AdherenceCard com barra de progresso visual.
  - Subtasks:
    - [x] 8.1 Adicionar progress bar animada no AdherenceCard
    - [x] 8.2 Prop opcional previousPercentage para comparação com período anterior
    - [x] 8.3 Texto "↑ X% em relação ao período anterior"
  - Arquivos: `src/components/AdherenceCard.tsx`

- [x] 9. Empty States com call-to-action
  - Adicionar botão de ação nos empty states para guiar o usuário.
  - Subtasks:
    - [x] 9.1 Adicionar props opcionais actionLabel e onAction no EmptyState
    - [x] 9.2 Usar na MedicamentosScreen ("Adicionar Medicamento")
  - Arquivos: `src/components/EmptyState.tsx`, `src/screens/main/MedicamentosScreen.tsx`

- [x] 10. Bottom Sheet para confirmações destrutivas
  - Substituir Alert.alert por BottomSheet customizado para ações destrutivas.
  - Subtasks:
    - [x] 10.1 Criar componente BottomSheet com Modal + animação slide
    - [x] 10.2 Usar na MedicamentosScreen para inativar medicamento
  - Arquivos: `src/components/BottomSheet.tsx`, `src/screens/main/MedicamentosScreen.tsx`

- [x] 11. Skeleton loading em vez de spinner
  - Substituir LoadingState por skeleton placeholders nas listas.
  - Subtasks:
    - [x] 11.1 Criar componentes SkeletonLoader, CardSkeleton, ListSkeleton
    - [x] 11.2 Usar em AgendaScreen, MedicamentosScreen, NotificacoesScreen, HistoricoScreen, VinculosScreen
  - Arquivos: `src/components/SkeletonLoader.tsx`, telas principais

- [x] 12. Busca/filtro na lista de medicamentos
  - Adicionar campo de busca para filtrar medicamentos por nome, dosagem ou categoria.
  - Subtasks:
    - [x] 12.1 Adicionar TextInput de busca (visível quando > 3 medicamentos)
    - [x] 12.2 Filtrar lista com useMemo por nome/dosagem/categoria
  - Arquivos: `src/screens/main/MedicamentosScreen.tsx`

- [x] 13. Ação rápida de confirmar na notificação
  - Botão "Confirmar agora" inline em notificações do tipo LEMBRETE.
  - Subtasks:
    - [x] 13.1 Adicionar prop onQuickConfirm no NotificacaoItem
    - [x] 13.2 Exibir botão verde quando tipo === LEMBRETE e registro_tomada_id existe
    - [x] 13.3 Chamar PUT /registros-tomada/{id}/confirmar diretamente
  - Arquivos: `src/components/NotificacaoItem.tsx`, `src/screens/main/NotificacoesScreen.tsx`

- [x] 14. Splash Screen com branding
  - Tela de splash animada com logo e fade-out para o app.
  - Subtasks:
    - [x] 14.1 Criar componente SplashScreen com logo, título e subtitle
    - [x] 14.2 Fade-out após 1.5s com Animated.timing
    - [x] 14.3 Integrar no App.tsx como overlay
  - Arquivos: `App.tsx`

- [x] 15. Consistência visual no Admin
  - Migrar telas admin para usar tokens do design system.
  - Subtasks:
    - [x] 15.1 AdminPerfilScreen com mesma estrutura do PerfilScreen
    - [x] 15.2 Manter DashboardScreen usando typography/spacing/borderRadius
  - Arquivos: `src/screens/admin/AdminPerfilScreen.tsx`, `src/screens/admin/DashboardScreen.tsx`

- [x] 16. Indicador de conexão offline
  - Banner persistente quando o dispositivo está sem internet.
  - Subtasks:
    - [x] 16.1 Criar componente OfflineBanner com check de conectividade
    - [x] 16.2 Animação slide-down/up com Animated
    - [x] 16.3 Integrar no MainTabNavigator acima das tabs
  - Arquivos: `src/components/OfflineBanner.tsx`, `src/navigation/MainTabNavigator.tsx`

- [ ] 17. Pull-to-refresh com hint visual
  - Melhorar indicador de pull-to-refresh com texto "Puxe para atualizar".
  - Nota: Requer customização nativa do RefreshControl — adiado para próxima iteração.

- [ ] 18. Transições e micro-animações de entrada
  - LayoutAnimation para entrada escalonada de cards nas listas.
  - Nota: Requer configuração de LayoutAnimation no Android (UIManager) — adiado para próxima iteração.

## Resumo

| Status | Quantidade |
|--------|-----------|
| ✅ Implementado | 15 |
| ⏳ Pendente (requer assets/config nativa) | 3 |
| **Total** | **18** |
