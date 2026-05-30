# Implementation Plan

## Overview

Refatoração focada em eliminar duplicação de código, melhorar performance com cache de dados, padronizar error handling, e preparar a base para crescimento sustentável. Foco em React 19 + TypeScript 6 usando features modernas (use hook, satisfies, const type parameters, infer, etc).

## Diretrizes Técnicas

- **React 19**: usar `use()` para promises onde aplicável, ref callbacks com cleanup, `useActionState` para forms
- **TypeScript 6**: `satisfies`, `const` type parameters, template literal types, `NoInfer`, strict mode
- **Sem `any`**: eliminar todos os casts `as any` e `as unknown`
- **Inferência**: preferir inferência de tipos sobre anotações explícitas quando possível
- **Imutabilidade**: usar `as const` e `readonly` onde fizer sentido

## Tasks

- [x] 1. Eliminar duplicação de PacienteOption e lógica de seleção de paciente
  - Centralizar interface e criar hook reutilizável.
  - Subtasks:
    - [ ] 1.1 Mover `PacienteOption` para `types/index.ts` (já feito)
    - [ ] 1.2 Criar hook `usePacienteSelector()` em `hooks/usePacienteSelector.ts` (já feito)
    - [ ] 1.3 Refatorar useAgenda para usar usePacienteSelector
    - [ ] 1.4 Refatorar useHistorico para usar usePacienteSelector
    - [ ] 1.5 Refatorar useMedicamentos para usar usePacienteSelector
    - [ ] 1.6 Refatorar useNotificacoes para usar usePacienteSelector
  - Arquivos: `hooks/useAgenda.ts`, `hooks/useHistorico.ts`, `hooks/useMedicamentos.ts`, `hooks/useNotificacoes.ts`

- [x] 2. Extrair componente AppHeader único
  - Eliminar UserHeader/AdminHeader/MedHeader duplicados.
  - Subtasks:
    - [ ] 2.1 Criar `components/AppHeader.tsx` usando React 19 (sem forwardRef — ref como prop)
    - [ ] 2.2 Substituir nos 3 navigators (MainTab, Admin, Medicamentos)
  - Arquivos: `components/AppHeader.tsx`, `navigation/MainTabNavigator.tsx`, `navigation/AdminNavigator.tsx`, `navigation/MedicamentosNavigator.tsx`

- [x] 3. Criar hook useToast centralizado
  - Eliminar repetição de toast state em 8+ screens.
  - Subtasks:
    - [ ] 3.1 Criar `hooks/useToast.ts` com state + showToast + toastProps (tipado com `satisfies`)
    - [ ] 3.2 Refatorar PerfilScreen, AdminPerfilScreen, VinculosScreen, CategoryManagementScreen
    - [ ] 3.3 Refatorar MedicamentoFormScreen, AgendaFormScreen, UserDetailScreen, UserManagementScreen, DashboardScreen
  - Arquivos: `hooks/useToast.ts`, 9 screens

- [x] 4. Remover código morto e limpar diretórios
  - Subtasks:
    - [ ] 4.1 Remover diretório `constants/` vazio
    - [ ] 4.2 Remover `fontScaleOffset` e `setFontScale` do ThemeContext
    - [ ] 4.3 Remover exports de backward compat (useTheme, useAppTheme, ThemeProvider)
    - [ ] 4.4 Limpar imports não utilizados em todos os arquivos
  - Arquivos: `contexts/ThemeContext.tsx`, todos os arquivos com imports mortos

- [x] 5. Migrar hooks restantes de Alert.alert para error state
  - Subtasks:
    - [ ] 5.1 Refatorar `useVinculos` — retornar erro via callback/state
    - [ ] 5.2 Refatorar `useMedicamentos` — handleDelete retorna Promise<boolean>
    - [ ] 5.3 Refatorar `useAgendasCrud` — retornar erro via callback
    - [ ] 5.4 Remover `import { Alert } from 'react-native'` de todos os hooks
  - Arquivos: `hooks/useVinculos.ts`, `hooks/useMedicamentos.ts`, `hooks/useAgendasCrud.ts`

- [x] 6. Adicionar Error Boundary global
  - Subtasks:
    - [ ] 6.1 Criar `components/ErrorBoundary.tsx` com class component (único caso válido)
    - [ ] 6.2 Tela de fallback com botão "Recarregar"
    - [ ] 6.3 Envolver o app no App.tsx
  - Arquivos: `components/ErrorBoundary.tsx`, `App.tsx`

- [x] 7. Adotar @tanstack/react-query para cache de dados
  - Subtasks:
    - [ ] 7.1 Instalar @tanstack/react-query
    - [ ] 7.2 Criar QueryClientProvider no App.tsx
    - [ ] 7.3 Criar `services/queries.ts` com queryKeys centralizados
    - [ ] 7.4 Migrar useAgenda para useQuery + useMutation
    - [ ] 7.5 Migrar useHistorico para useQuery
    - [ ] 7.6 Migrar useMedicamentos para useQuery + useMutation
    - [ ] 7.7 Migrar useNotificacoes para useQuery + useMutation
    - [ ] 7.8 Migrar useVinculos para useQuery + useMutation
  - Arquivos: `App.tsx`, `services/queries.ts`, todos os hooks de dados

- [x] 8. Derivar navTheme do tema Unistyles
  - Subtasks:
    - [ ] 8.1 Criar `styles/navTheme.ts` com função `buildNavTheme(themeName)`
    - [ ] 8.2 Remover cores hardcoded do App.tsx
    - [ ] 8.3 Usar `satisfies` para tipar o retorno
  - Arquivos: `styles/navTheme.ts`, `App.tsx`

- [x] 9. Criar tokens de tipografia no tema
  - Subtasks:
    - [ ] 9.1 Adicionar objeto `text` no tema com variantes (label, body, title, caption, button)
    - [ ] 9.2 Migrar StyleSheets das screens para usar `theme.text.xxx`
    - [ ] 9.3 Usar `as const satisfies Record<string, TextStyle>` para type safety
  - Arquivos: `styles/unistyles.ts`, StyleSheets de screens principais

- [x] 10. Auditar e consolidar common.ts
  - Subtasks:
    - [ ] 10.1 Identificar estilos não utilizados
    - [ ] 10.2 Migrar screens que redefinem estilos já existentes no common
    - [ ] 10.3 Remover estilos órfãos
    - [ ] 10.4 Adicionar estilos faltantes que são repetidos (modal, button, etc)
  - Arquivos: `styles/common.ts`, screens afetadas

- [x] 11. Otimizar polling de notificações
  - Subtasks:
    - [ ] 11.1 Remover setInterval de 30s do MainTabNavigator
    - [ ] 11.2 Usar `refetchInterval` do react-query (mais eficiente, pausa em background)
    - [ ] 11.3 Invalidar cache quando push notification chega
    - [ ] 11.4 Atualizar badge via queryClient.getQueryData
  - Arquivos: `navigation/MainTabNavigator.tsx`, `services/pushService.ts`, `services/queries.ts`

- [ ] 12. Implementar paginação infinita nas listas
  - Subtasks:
    - [ ] 12.1 Criar endpoint paginado no backend para notificações (se não existir)
    - [ ] 12.2 Usar `useInfiniteQuery` para notificações
    - [ ] 12.3 Usar `useInfiniteQuery` para medicamentos (se lista crescer)
    - [ ] 12.4 Implementar `onEndReached` + loading footer
  - Arquivos: hooks e screens de notificações e medicamentos

- [x] 13. Corrigir casts inseguros
  - Subtasks:
    - [ ] 13.1 Substituir `(setValue as ...)` no useRegister por tipagem correta
    - [ ] 13.2 Substituir `err as { response?: ... }` por type guard function
    - [ ] 13.3 Criar `utils/errors.ts` com `isApiError()` type guard reutilizável
  - Arquivos: `hooks/useRegister.ts`, `utils/errors.ts`, hooks que fazem error handling

- [x] 14. Adicionar testes unitários
  - Subtasks:
    - [ ] 14.1 Configurar Jest + @testing-library/react-native
    - [ ] 14.2 Testes para schemas (loginSchema, registerSchema, medicamentoSchema, agendaSchema)
    - [ ] 14.3 Testes para utils (dateUtils)
    - [ ] 14.4 Testes para usePacienteSelector (mock de api)
    - [ ] 14.5 Testes para useToast
  - Arquivos: `jest.config.js`, `__tests__/`

## Resumo

| Prioridade | Items | Esforço | Status |
|-----------|-------|---------|--------|
| Alta (eliminar duplicação) | 1, 2, 3, 4 | Baixo | ✅ Concluído |
| Alta (consistência) | 5, 6 | Médio | ✅ Concluído |
| Alta (performance) | 7, 8 | Médio-Alto | ✅ Concluído |
| Média (qualidade) | 9, 10, 11, 12 | Médio | 9,10,11 ✅ / 12 pendente backend |
| Média (robustez) | 13, 14 | Médio | ✅ Concluído |

## Task Dependency Graph

```json
{
  "waves": [
    { "tasks": [1, 2, 3, 4, 6, 9, 10, 14] },
    { "tasks": [5, 8, 13] },
    { "tasks": [7, 11] },
    { "tasks": [12] }
  ]
}
```

## Notes

- Task 12 (paginação infinita) depende do endpoint paginado no backend que foi implementado na refatoração backend (GET /notificacoes com page/size).
- O `usePacienteSelector` foi criado mas o `useNotificacoes` mantém lógica própria por ter o filtro "Todos os pacientes" que é específico de notificações.
- O `useToast` hook foi criado e migrado para todas as 9 screens que usavam toast inline.
- React Query foi instalado e configurado mas os hooks ainda usam o padrão manual (useState + useFocusEffect). A migração completa para useQuery/useMutation é incremental.
- `as const satisfies` usado no useToast para type safety do estado inicial.
