# Implementation Plan

## Overview

Backend do MedAlert — API REST com FastAPI, PostgreSQL, autenticação JWT, módulos de usuários, vínculos, medicamentos, agendas, registros de tomada, notificações, push notifications e scheduler de jobs automáticos.

## Tasks

- [x] 1. Configuração inicial do projeto
  - Criar a estrutura de diretórios, dependências e configuração base do projeto.
  - Subtasks:
    - [x] 1.1 Criar `requirements.txt` com: `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `apscheduler`, `httpx`, `pytest`, `pytest-asyncio`
    - [x] 1.2 Criar `app/core/config.py` com `Settings` (pydantic-settings) lendo variáveis de ambiente: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `FCM_SERVER_KEY`
    - [x] 1.3 Criar `app/core/database.py` com engine assíncrono SQLAlchemy e `AsyncSession`
    - [x] 1.4 Criar `app/core/dependencies.py` com `get_db()` e `get_current_user()`
    - [x] 1.5 Criar `app/main.py` com app FastAPI, inclusão dos routers e lifespan (start/stop APScheduler)
    - [x] 1.6 Criar `alembic.ini` e `alembic/env.py` configurado com `target_metadata` dos modelos
    - [x] 1.7 Criar `.env.example` com todas as variáveis necessárias
  - Arquivos: `requirements.txt`, `app/main.py`, `app/core/config.py`, `app/core/database.py`, `app/core/dependencies.py`, `app/core/security.py`, `alembic.ini`, `alembic/env.py`

- [x] 2. Modelos e migrations do banco de dados
  - Definir todos os modelos SQLAlchemy e gerar a migration inicial com Alembic.
  - Subtasks:
    - [x] 2.1 Criar `app/modules/usuarios/models.py` com modelo `Usuario` e todos os ENUMs (`TipoUsuario`, `NivelAutonomia`)
    - [x] 2.2 Criar `app/modules/vinculos/models.py` com modelo `Vinculo` e constraint de unicidade ativa
    - [x] 2.3 Criar `app/modules/medicamentos/models.py` com modelos `Categoria` e `Medicamento`
    - [x] 2.4 Criar `app/modules/agendas/models.py` com modelo `Agenda` e ENUM `FrequenciaTomada`
    - [x] 2.5 Criar `app/modules/registros_tomada/models.py` com modelo `RegistroTomada`, ENUM `StatusTomada` e constraint UNIQUE `(agenda_id, data_hora_prevista)`
    - [x] 2.6 Criar `app/modules/notificacoes/models.py` com modelo `Notificacao` e ENUM `TipoNotificacao`
    - [x] 2.7 Criar modelo `RefreshToken` para armazenamento e revogação de refresh tokens
    - [x] 2.8 Gerar migration inicial com `alembic revision --autogenerate -m "initial"`
    - [x] 2.9 Validar migration executando `alembic upgrade head` em banco de teste
  - Arquivos: `app/modules/*/models.py`, `alembic/versions/001_initial.py`

- [x] 3. Módulo de autenticação
  - Implementar login, refresh e logout com JWT.
  - Subtasks:
    - [x] 3.1 Criar `app/core/security.py` com `hash_password()`, `verify_password()`, `create_access_token()`, `create_refresh_token()`, `decode_token()`
    - [x] 3.2 Criar `app/modules/auth/schemas.py` com `LoginRequest`, `TokenResponse`, `RefreshRequest`
    - [x] 3.3 Criar `app/modules/auth/service.py` com lógica de autenticação e revogação de tokens
    - [x] 3.4 Criar `app/modules/auth/router.py` com `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
    - [x] 3.5 No login, atualizar `push_token` do usuário se fornecido no payload
    - [x] 3.6 No login, verificar `ativo = TRUE` do usuário; retornar HTTP 403 se inativo
  - Arquivos: `app/modules/auth/router.py`, `app/modules/auth/service.py`, `app/modules/auth/schemas.py`

- [x] 4. Módulo de usuários
  - CRUD de usuários com validações condicionais por tipo.
  - Subtasks:
    - [x] 4.1 Criar `app/modules/usuarios/schemas.py` com `UsuarioCreate`, `UsuarioResponse`, `UsuarioUpdate`, `PushTokenUpdate`; aplicar validadores condicionais por `tipo` (RN09, RN10)
    - [x] 4.2 Criar `app/modules/usuarios/repository.py` com `get_by_email()`, `create()`, `update()`
    - [x] 4.3 Criar `app/modules/usuarios/service.py` com regras de negócio e validação de e-mail único
    - [x] 4.4 Criar `app/modules/usuarios/router.py` com `POST /usuarios`, `GET /usuarios/me`, `PUT /usuarios/me`, `PUT /usuarios/me/push-token`
    - [x] 4.5 `POST /usuarios` não exige autenticação; senha deve ser hasheada antes de persistir
  - Arquivos: `app/modules/usuarios/router.py`, `app/modules/usuarios/service.py`, `app/modules/usuarios/repository.py`, `app/modules/usuarios/schemas.py`

- [x] 5. Módulo de vínculos
  - Criação e encerramento de vínculos entre responsáveis/cuidadores e pacientes.
  - Subtasks:
    - [x] 5.1 Criar schemas `VinculoCreate`, `VinculoResponse`
    - [x] 5.2 Criar repository com `create()`, `get_active_by_pair()`, `list_by_user()`, `deactivate()`
    - [x] 5.3 Criar service com validação de vínculo ativo duplicado (RN03) e verificação de tipo de usuário
    - [x] 5.4 Criar router com `POST /vinculos`, `GET /vinculos`, `DELETE /vinculos/{id}`
    - [x] 5.5 `DELETE` deve setar `data_fim = hoje` e `ativo = FALSE` (sem DELETE físico)
  - Arquivos: `app/modules/vinculos/router.py`, `app/modules/vinculos/service.py`, `app/modules/vinculos/repository.py`, `app/modules/vinculos/schemas.py`

- [x] 6. Módulo de categorias
  - Gerenciamento de categorias terapêuticas de medicamentos.
  - Subtasks:
    - [x] 6.1 Criar schemas `CategoriaResponse`
    - [x] 6.2 Criar repository com `list_all()`, `get_by_id()`
    - [x] 6.3 Criar router com `GET /categorias` (listagem pública para preenchimento de formulário)
  - Arquivos: `app/modules/medicamentos/categorias_router.py`, schemas e repository correspondentes

- [x] 7. Módulo de medicamentos
  - CRUD de medicamentos com auditoria e controle de retorno médico.
  - Subtasks:
    - [x] 7.1 Criar schemas `MedicamentoCreate`, `MedicamentoResponse`, `MedicamentoUpdate`
    - [x] 7.2 Criar repository com `create()`, `list_by_paciente()`, `get_by_id()`, `update()`, `deactivate()`
    - [x] 7.3 Criar service com: validação de `instrucoes` obrigatório, cálculo de `data_proximo_retorno`, preenchimento de `criado_por`/`atualizado_por` (RN07)
    - [x] 7.4 Criar router com `POST /pacientes/{id}/medicamentos`, `GET /pacientes/{id}/medicamentos`, `PUT /medicamentos/{id}`, `DELETE /medicamentos/{id}`
    - [x] 7.5 Verificar que o usuário autenticado tem vínculo ativo com o paciente antes de criar/editar medicamento
  - Arquivos: `app/modules/medicamentos/router.py`, `app/modules/medicamentos/service.py`, `app/modules/medicamentos/repository.py`, `app/modules/medicamentos/schemas.py`

- [x] 8. Módulo de agendas
  - Configuração de horários e frequência de tomada por medicamento.
  - Subtasks:
    - [x] 8.1 Criar schemas `AgendaCreate`, `AgendaResponse`, `AgendaUpdate` com validação de `dias_semana` quando `frequencia != DIARIA`
    - [x] 8.2 Criar repository com `create()`, `list_by_medicamento()`, `get_active_upcoming()`, `deactivate()`
    - [x] 8.3 Criar service com regras de validação de frequência e datas
    - [x] 8.4 Criar router com `POST /medicamentos/{id}/agendas`, `GET /medicamentos/{id}/agendas`, `PUT /agendas/{id}`, `DELETE /agendas/{id}`
  - Arquivos: `app/modules/agendas/router.py`, `app/modules/agendas/service.py`, `app/modules/agendas/repository.py`, `app/modules/agendas/schemas.py`

- [x] 9. Módulo de registros de tomada
  - Listagem e confirmação de registros de tomada com cálculo de adesão.
  - Subtasks:
    - [x] 9.1 Criar schemas `RegistroTomadaResponse`, `HistoricoAdesaoResponse` (com percentual)
    - [x] 9.2 Criar repository com `create()`, `get_pending_in_window()`, `get_overdue()`, `confirm()`, `list_by_paciente()`
    - [x] 9.3 Criar service com: validação de permissão de acesso (vínculo ativo), cálculo de percentual de adesão
    - [x] 9.4 Criar router com `GET /pacientes/{id}/registros-tomada` (com filtros `data_inicio`, `data_fim`, `status`) e `PUT /registros-tomada/{id}/confirmar`
    - [x] 9.5 `PUT /confirmar` deve preencher `data_hora_confirmacao` (UTC) e `usuario_confirmacao_id`
  - Arquivos: `app/modules/registros_tomada/router.py`, `app/modules/registros_tomada/service.py`, `app/modules/registros_tomada/repository.py`, `app/modules/registros_tomada/schemas.py`

- [x] 10. Módulo de notificações
  - Listagem de notificações e marcação como lida.
  - Subtasks:
    - [x] 10.1 Criar schemas `NotificacaoResponse`
    - [x] 10.2 Criar repository com `create()`, `list_by_usuario()`, `mark_as_read()`, `get_recent_retorno_medico()`
    - [x] 10.3 Criar router com `GET /notificacoes` e `PUT /notificacoes/{id}/lida`
    - [x] 10.4 `GET /notificacoes` deve retornar apenas notificações do usuário autenticado
  - Arquivos: `app/modules/notificacoes/router.py`, `app/modules/notificacoes/repository.py`, `app/modules/notificacoes/schemas.py`

- [x] 11. Serviço de push notifications
  - Camada de abstração para envio de notificações via FCM (Android) e APNs (iOS).
  - Subtasks:
    - [x] 11.1 Criar `app/push/service.py` com `async send_push(push_token: str, title: str, body: str, data: dict)` que detecta plataforma e delega para FCM ou APNs
    - [x] 11.2 Criar `app/push/fcm.py` com integração à API HTTP v1 do FCM usando `httpx`
    - [x] 11.3 Criar `app/push/apns.py` com integração ao APNs via HTTP/2
    - [x] 11.4 Implementar tratamento de erro: token inválido deve ser logado e limpo do usuário; falha de rede deve ser logada sem quebrar o fluxo principal
    - [x] 11.5 Criar helper `app/push/helpers.py` com templates de mensagem: `LEMBRETE`, `FALHA_TOMADA`, `RETORNO_MEDICO`
  - Arquivos: `app/push/service.py`, `app/push/fcm.py`, `app/push/apns.py`, `app/push/helpers.py`

- [x] 12. Scheduler de jobs automáticos
  - Implementar os 4 jobs automáticos com APScheduler.
  - Subtasks:
    - [x] 12.1 Criar `app/scheduler/setup.py` com configuração do `AsyncIOScheduler` e registro dos jobs
    - [x] 12.2 Implementar `job_gerar_registros_tomada()`: varrer agendas ativas, criar `REGISTRO_TOMADA` com status `PENDENTE` para horários nos próximos 5min sem registro existente, enviar push `LEMBRETE` ao paciente
    - [x] 12.3 Implementar `job_verificar_atrasos()`: buscar registros `PENDENTE` cujo prazo de tolerância expirou → atualizar para `ATRASADO` → enviar `FALHA_TOMADA` para responsáveis/cuidadores elegíveis (RN02)
    - [x] 12.4 Implementar `job_marcar_ignorados()`: buscar registros `ATRASADO` com mais de 2h → atualizar para `IGNORADO`
    - [x] 12.5 Implementar `job_alertas_retorno_medico()`: executar diariamente às 06h UTC, verificar medicamentos com retorno em 7 dias sem notificação recente → criar `NOTIFICACAO` tipo `RETORNO_MEDICO` (RN06)
    - [x] 12.6 Integrar Scheduler no lifespan do FastAPI (`app/main.py`)
  - Arquivos: `app/scheduler/setup.py`, `app/scheduler/jobs.py`

- [x] 13. Testes automatizados
  - Cobertura de testes para os fluxos críticos do sistema.
  - Subtasks:
    - [x] 13.1 Configurar `pytest` com banco de dados de teste em memória (SQLite ou PostgreSQL de teste)
    - [x] 13.2 Criar fixtures: usuário paciente, usuário responsável, vínculo ativo, medicamento, agenda
    - [x] 13.3 Testar fluxo de autenticação: login válido, token expirado, refresh, logout
    - [x] 13.4 Testar validações condicionais de cadastro de usuário (RN09, RN10)
    - [x] 13.5 Testar criação de vínculo duplicado (deve retornar HTTP 409)
    - [x] 13.6 Testar fluxo de confirmação de tomada: PENDENTE → CONFIRMADO dentro e fora do prazo
    - [x] 13.7 Testar transição PENDENTE → ATRASADO → IGNORADO via jobs do Scheduler
    - [x] 13.8 Testar job de alerta de retorno médico com e sem notificação recente (idempotência)
    - [x] 13.9 Testar controle de acesso: responsável sem vínculo não acessa dados do paciente (HTTP 403)
  - Arquivos: `tests/conftest.py`, `tests/test_auth.py`, `tests/test_usuarios.py`, `tests/test_vinculos.py`, `tests/test_medicamentos.py`, `tests/test_registros_tomada.py`, `tests/test_scheduler.py`

- [x] 14. Documentação e configuração final
  - Finalizar a documentação da API e arquivos de configuração de ambiente.
  - Subtasks:
    - [x] 14.1 Verificar que `/docs` (Swagger UI) está funcional e com todos os endpoints documentados
    - [x] 14.2 Adicionar `summary` e `description` em cada router para enriquecer o Swagger
    - [x] 14.3 Criar `Dockerfile` para o backend com Python 3.12-slim
    - [x] 14.4 Criar `docker-compose.yml` com serviços `api` e `db` (PostgreSQL 15)
    - [x] 14.5 Criar `README.md` com instruções de setup, variáveis de ambiente e execução local
    - [x] 14.6 Criar script `seed.py` com dados iniciais: categorias terapêuticas padrão
  - Arquivos: `Dockerfile`, `docker-compose.yml`, `README.md`, `scripts/seed.py`

## Task Dependency Graph

```json
{
  "waves": [
    [1],
    [2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
    [11],
    [12],
    [13],
    [14]
  ]
}
```

- Task 1 (Configuração) é pré-requisito de todas as demais
- Tasks 3-10 (módulos) dependem de Task 2 (modelos)
- Task 11 (push) depende de Task 10 (notificações)
- Task 12 (scheduler) depende de Tasks 9, 10 e 11
- Task 13 (testes) depende de todos os módulos implementados
- Task 14 (documentação) é a última

## Notes

- Todas as tasks foram concluídas com sucesso.
- O projeto utiliza FastAPI com SQLAlchemy assíncrono e PostgreSQL.
- Autenticação via JWT com access token e refresh token.
- Push notifications via FCM e APNs com tratamento de erros.
- Scheduler APScheduler para jobs automáticos de geração de registros, verificação de atrasos e alertas de retorno médico.
