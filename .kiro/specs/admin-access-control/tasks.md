# Implementation Plan: Admin Access Control

## Overview

Implementação do tipo de usuário ADMIN no sistema MedAlert com acesso irrestrito, gerenciamento de usuários, categorias, métricas do sistema e revogação de tokens. Segue o padrão modular existente (router → service → repository → model) com um novo módulo `admin` centralizado. O app mobile recebe um painel administrativo com dashboard, gerenciamento de usuários e categorias.

## Tasks

- [x] 1. Adicionar ADMIN ao enum TipoUsuario e criar migração Alembic
  - [x] 1.1 Adicionar valor ADMIN ao enum TipoUsuario em `app/modules/usuarios/models.py`
    - Adicionar `ADMIN = "ADMIN"` ao enum `TipoUsuario`
    - _Requirements: 1.1_

  - [x] 1.2 Criar migração Alembic para adicionar ADMIN ao enum PostgreSQL
    - Criar nova migração com `ALTER TYPE tipousuario ADD VALUE 'ADMIN'`
    - Garantir que a migração é idempotente (verificar se valor já existe antes de adicionar)
    - _Requirements: 1.1_

  - [x] 1.3 Bloquear criação de ADMIN via API no service de usuários
    - Modificar `create_user` em `app/modules/usuarios/service.py` para rejeitar `tipo == ADMIN` com HTTP 403
    - _Requirements: 1.3, 1.4_

- [x] 2. Implementar dependência `get_current_admin` e bypass de vínculo
  - [x] 2.1 Criar dependência `get_current_admin` em `app/core/dependencies.py`
    - Importar `TipoUsuario` e reutilizar `get_current_user`
    - Validar que `current_user.tipo == TipoUsuario.ADMIN`
    - Retornar HTTP 403 com detail "Acesso restrito a administradores" se não for ADMIN
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Implementar bypass de vínculo para ADMIN em `app/modules/medicamentos/service.py`
    - Modificar `_verify_access_to_paciente` para retornar imediatamente se `current_user.tipo == TipoUsuario.ADMIN`
    - Adicionar logging de auditoria com ID do admin
    - _Requirements: 4.1, 4.2, 4.5, 8.1_

  - [x] 2.3 Implementar bypass de vínculo para ADMIN nos demais módulos
    - Modificar verificações de acesso em `app/modules/registros_tomada/service.py`
    - Modificar verificações de acesso em `app/modules/agendas/service.py`
    - Modificar verificações de acesso em `app/modules/vinculos/service.py`
    - Preservar controle de acesso existente para não-ADMIN
    - _Requirements: 4.3, 4.4, 4.5, 8.1, 8.2, 8.3_

  - [ ]* 2.4 Escrever teste de propriedade para rejeição de registro ADMIN
    - **Property 1: Admin registration rejection**
    - **Validates: Requirements 1.4**

  - [ ]* 2.5 Escrever teste de propriedade para autorização da dependência admin
    - **Property 2: Admin dependency authorization**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.6 Escrever teste de propriedade para bypass de vínculo admin
    - **Property 5: Admin vinculo bypass**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 8.1**

  - [ ]* 2.7 Escrever teste de propriedade para enforcement de vínculo não-admin
    - **Property 6: Non-admin vinculo enforcement**
    - **Validates: Requirements 4.5**

- [x] 3. Checkpoint - Verificar base de autorização
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar módulo admin - schemas e repository
  - [x] 4.1 Criar schemas do módulo admin em `app/modules/admin/schemas.py`
    - Criar `UsuarioAdminResponse`, `UsuarioDetalheAdminResponse`, `PaginatedUsuariosResponse`
    - Criar `AlterarTipoRequest`, `CategoriaCreateRequest`, `CategoriaUpdateRequest`
    - Criar `MetricasResponse`, `ForcarLogoutResponse`
    - _Requirements: 3.1, 3.4, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 7.2_

  - [x] 4.2 Criar repository de usuários admin em `app/modules/admin/repository.py`
    - Implementar `listar_todos_usuarios` com paginação, filtro por tipo e busca case-insensitive
    - Implementar `obter_usuario_por_id`
    - Implementar `atualizar_status_usuario` (ativar/desativar)
    - Implementar `atualizar_tipo_usuario`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.3 Criar repository de categorias admin em `app/modules/admin/repository.py`
    - Implementar `criar_categoria`, `atualizar_categoria`, `excluir_categoria`
    - Implementar `categoria_possui_medicamentos` e `categoria_existe_por_nome`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 4.4 Criar repository de métricas em `app/modules/admin/repository.py`
    - Implementar `contar_usuarios_por_tipo` (GROUP BY tipo)
    - Implementar `contar_usuarios_ativos` (WHERE ativo = TRUE)
    - Implementar `contar_vinculos_ativos` (WHERE ativo = TRUE)
    - Implementar `calcular_taxa_adesao` (CONFIRMADO / total nos últimos 30 dias * 100)
    - Implementar `contar_registros_problematicos` (ATRASADO e IGNORADO nos últimos 30 dias)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 4.5 Criar repository de tokens em `app/modules/admin/repository.py`
    - Implementar `revogar_tokens_usuario` (SET revogado = TRUE em todos os refresh tokens ativos do usuário)
    - Retornar contagem de tokens revogados
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 5. Implementar módulo admin - service
  - [x] 5.1 Criar service de gerenciamento de usuários em `app/modules/admin/service.py`
    - Implementar `listar_usuarios` com paginação, filtro e busca
    - Implementar `obter_usuario` com validação de existência (404)
    - Implementar `ativar_usuario` e `desativar_usuario` com self-protection (400)
    - Implementar `alterar_tipo_usuario` com self-protection (400)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 5.2 Criar service de categorias em `app/modules/admin/service.py`
    - Implementar `criar_categoria` com validação de nome duplicado (409)
    - Implementar `atualizar_categoria` com validação de existência (404)
    - Implementar `excluir_categoria` com validação de medicamentos associados (409)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.3 Criar service de métricas em `app/modules/admin/service.py`
    - Implementar `obter_metricas` que agrega todas as queries de métricas
    - Computar todas as métricas no momento da requisição sem cache
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 5.4 Criar service de forçar logout em `app/modules/admin/service.py`
    - Implementar `forcar_logout` com self-protection (400)
    - Retornar contagem de tokens revogados
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 5.5 Escrever teste de propriedade para filtro de listagem de usuários
    - **Property 3: User listing filter correctness**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 5.6 Escrever teste de propriedade para toggle de ativação de usuário
    - **Property 4: User activation toggle**
    - **Validates: Requirements 3.5, 3.6**

- [x] 6. Implementar módulo admin - router
  - [x] 6.1 Criar router admin em `app/modules/admin/router.py`
    - Implementar `GET /api/v1/admin/usuarios` com query params: page, size, tipo, busca
    - Implementar `GET /api/v1/admin/usuarios/{id}` para detalhes do usuário
    - Implementar `PATCH /api/v1/admin/usuarios/{id}/ativar` e `PATCH /api/v1/admin/usuarios/{id}/desativar`
    - Implementar `PATCH /api/v1/admin/usuarios/{id}/tipo` com body `AlterarTipoRequest`
    - Implementar `POST /api/v1/admin/usuarios/{id}/forcar-logout`
    - Implementar `GET /api/v1/admin/metricas`
    - Implementar `POST /api/v1/admin/categorias`, `PUT /api/v1/admin/categorias/{id}`, `DELETE /api/v1/admin/categorias/{id}`
    - Todos os endpoints protegidos com `Depends(get_current_admin)`
    - _Requirements: 2.1, 2.2, 3.1, 3.4, 3.5, 3.6, 3.7, 5.1, 5.2, 5.3, 5.6, 6.1, 7.1, 7.2_

  - [x] 6.2 Registrar router admin no `app/main.py`
    - Importar e incluir `admin_router` com prefix `/admin` e tag "Admin"
    - _Requirements: 2.1_

  - [ ]* 6.3 Escrever teste de propriedade para unicidade de nome de categoria
    - **Property 7: Category name uniqueness**
    - **Validates: Requirements 5.5**

  - [ ]* 6.4 Escrever teste de propriedade para constraint de exclusão de categoria
    - **Property 8: Category deletion constraint**
    - **Validates: Requirements 5.3, 5.4**

- [x] 7. Checkpoint - Verificar endpoints admin
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implementar métricas e revogação de tokens
  - [ ]* 8.1 Escrever teste de propriedade para correção de cálculo de métricas
    - **Property 9: Metrics computation correctness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

  - [ ]* 8.2 Escrever teste de propriedade para completude de revogação de tokens
    - **Property 10: Token revocation completeness**
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 8.3 Escrever teste de propriedade para rejeição de token revogado
    - **Property 11: Revoked token rejection**
    - **Validates: Requirements 7.4**

- [x] 9. Implementar telas do painel admin no app mobile
  - [x] 9.1 Criar serviço de API admin no mobile em `mobile/src/services/adminApi.ts`
    - Implementar funções para todos os endpoints admin (listar usuários, métricas, categorias, forçar logout)
    - Configurar headers de autenticação JWT
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.2 Criar navegação do painel admin em `mobile/src/navigation/AdminNavigator.tsx`
    - Configurar stack/tab navigator exclusivo para ADMIN
    - Exibir navegação admin quando `user.tipo === 'ADMIN'`
    - _Requirements: 9.1_

  - [x] 9.3 Criar tela de Dashboard admin em `mobile/src/screens/admin/DashboardScreen.tsx`
    - Exibir métricas do sistema (total de usuários, vínculos ativos, taxa de adesão)
    - Implementar indicadores de carregamento (skeleton/spinner)
    - _Requirements: 9.2, 9.8_

  - [x] 9.4 Criar tela de Gerenciamento de Usuários em `mobile/src/screens/admin/UserManagementScreen.tsx`
    - Implementar lista pesquisável com filtros por tipo e status
    - Implementar ações de ativar/desativar com diálogo de confirmação
    - Exibir feedback visual (toast/snackbar) após operações
    - Implementar indicadores de carregamento
    - _Requirements: 9.3, 9.6, 9.7, 9.8_

  - [x] 9.5 Criar tela de Detalhes do Usuário em `mobile/src/screens/admin/UserDetailScreen.tsx`
    - Exibir perfil completo do usuário
    - Implementar opção de alterar tipo com diálogo de confirmação
    - Implementar opção de forçar logout com diálogo de confirmação
    - Exibir feedback visual após operações
    - _Requirements: 9.4, 9.6, 9.7_

  - [x] 9.6 Criar tela de Gerenciamento de Categorias em `mobile/src/screens/admin/CategoryManagementScreen.tsx`
    - Implementar lista de categorias com criação, edição e exclusão
    - Implementar diálogo de confirmação para exclusão
    - Exibir feedback visual após operações
    - Implementar indicadores de carregamento
    - _Requirements: 9.5, 9.6, 9.7, 9.8_

- [x] 10. Checkpoint final - Verificar integração completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- O módulo admin segue o padrão existente: router → service → repository → model
- A migração Alembic deve ser executada antes de qualquer teste que envolva o tipo ADMIN
- O bypass de vínculo preserva o comportamento existente para usuários não-ADMIN
- Categorias usam hard delete conforme decisão de design (não soft delete)
- Métricas são computadas em tempo real sem cache

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1"] },
    { "id": 3, "tasks": ["2.4", "2.5", "2.6", "2.7", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["5.5", "5.6", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["8.1", "8.2", "8.3", "9.1"] },
    { "id": 8, "tasks": ["9.2"] },
    { "id": 9, "tasks": ["9.3", "9.4", "9.6"] },
    { "id": 10, "tasks": ["9.5"] }
  ]
}
```
