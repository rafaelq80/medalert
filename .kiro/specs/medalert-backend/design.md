# Design Document

## Overview

O backend do MedAlert segue o padrão **monolito modular**: uma única aplicação FastAPI organizada em módulos por domínio. Cada módulo possui suas camadas internas (`router → service → repository → model`) sem acesso direto às classes internas de outros módulos.

## Architecture

```
app/
├── main.py                  # FastAPI app, routers, lifespan (APScheduler)
├── core/
│   ├── config.py            # Settings via pydantic-settings
│   ├── database.py          # SQLAlchemy engine + session factory
│   ├── security.py          # JWT encode/decode, bcrypt helpers
│   └── dependencies.py      # get_current_user, get_db
├── modules/
│   ├── auth/
│   │   ├── router.py        # /auth/login, /auth/refresh, /auth/logout
│   │   ├── service.py
│   │   └── schemas.py
│   ├── usuarios/
│   │   ├── router.py        # /usuarios, /usuarios/me, /usuarios/me/push-token
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── models.py        # SQLAlchemy ORM
│   │   └── schemas.py       # Pydantic v2
│   ├── vinculos/
│   ├── medicamentos/
│   ├── agendas/
│   ├── registros_tomada/
│   └── notificacoes/
├── scheduler/
│   ├── jobs.py              # gerar_registros_tomada(), verificar_atrasos(), alertas_retorno_medico()
│   └── setup.py             # APScheduler config + registro dos jobs
└── push/
    ├── service.py           # send_push(token, title, body, data)
    ├── fcm.py               # integração FCM
    └── apns.py              # integração APNs
```

## Components and Interfaces

### Core Components

#### Config (`app/core/config.py`)
- `Settings`: classe pydantic-settings com variáveis `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `FCM_SERVER_KEY`
- Interface: importado como singleton `settings` por todos os módulos

#### Database (`app/core/database.py`)
- `engine`: AsyncEngine SQLAlchemy conectado ao PostgreSQL
- `AsyncSessionLocal`: factory de sessões assíncronas
- Interface: `get_db()` dependency injection via FastAPI

#### Security (`app/core/security.py`)
- `hash_password(plain: str) -> str`
- `verify_password(plain: str, hashed: str) -> bool`
- `create_access_token(data: dict) -> str`
- `create_refresh_token(data: dict) -> str`
- `decode_token(token: str) -> dict`

#### Dependencies (`app/core/dependencies.py`)
- `get_db() -> AsyncGenerator[AsyncSession]`
- `get_current_user(token: str, db: AsyncSession) -> Usuario`

### Module Components (padrão repetido por domínio)

Cada módulo segue a interface:
- **Router**: define endpoints HTTP, valida schemas de entrada, retorna schemas de saída
- **Service**: lógica de negócio, validações, orquestração
- **Repository**: acesso ao banco de dados via SQLAlchemy
- **Models**: definição ORM das tabelas
- **Schemas**: modelos Pydantic v2 para request/response

### Scheduler (`app/scheduler/`)
- `setup.py`: configura `AsyncIOScheduler`, registra jobs
- `jobs.py`: implementa `job_gerar_registros_tomada()`, `job_verificar_atrasos()`, `job_marcar_ignorados()`, `job_alertas_retorno_medico()`
- Interface: integrado ao lifespan do FastAPI (start no startup, shutdown no shutdown)

### Push Service (`app/push/`)
- `service.py`: `async send_push(push_token: str, title: str, body: str, data: dict)`
- `fcm.py`: integração FCM HTTP v1 via `httpx`
- `apns.py`: integração APNs via HTTP/2
- `helpers.py`: templates de mensagem (`LEMBRETE`, `FALHA_TOMADA`, `RETORNO_MEDICO`)

## Data Models

### Enums

```python
class TipoUsuario(str, Enum):
    PACIENTE = "PACIENTE"
    RESPONSAVEL = "RESPONSAVEL"
    CUIDADOR = "CUIDADOR"

class NivelAutonomia(str, Enum):
    TOTAL = "TOTAL"
    PARCIAL = "PARCIAL"
    DEPENDENTE = "DEPENDENTE"

class FrequenciaTomada(str, Enum):
    DIARIA = "DIARIA"
    SEMANAL = "SEMANAL"
    PERSONALIZADA = "PERSONALIZADA"

class StatusTomada(str, Enum):
    PENDENTE = "PENDENTE"
    CONFIRMADO = "CONFIRMADO"
    ATRASADO = "ATRASADO"
    IGNORADO = "IGNORADO"

class TipoNotificacao(str, Enum):
    LEMBRETE = "LEMBRETE"
    FALHA_TOMADA = "FALHA_TOMADA"
    RETORNO_MEDICO = "RETORNO_MEDICO"
```

### Table: USUARIO

| Coluna                | Tipo               | Restrições                                    |
|-----------------------|--------------------|-----------------------------------------------|
| id                    | BIGSERIAL PK       |                                               |
| nome                  | VARCHAR(255)       | NOT NULL                                      |
| email                 | VARCHAR(255)       | NOT NULL, UNIQUE                              |
| telefone              | VARCHAR(20)        | NULLABLE                                      |
| senha                 | VARCHAR(255)       | NOT NULL (hash bcrypt)                        |
| tipo                  | ENUM tipo_usuario  | NOT NULL                                      |
| ativo                 | BOOLEAN            | NOT NULL, DEFAULT TRUE                        |
| criado_em             | TIMESTAMP (UTC)    | NOT NULL, DEFAULT NOW()                       |
| data_nascimento       | DATE               | Obrigatório quando tipo=PACIENTE              |
| obs_medicas           | TEXT               | Obrigatório quando tipo=PACIENTE              |
| nivel_autonomia       | ENUM nivel_auto    | Obrigatório quando tipo=PACIENTE              |
| grau_parentesco       | VARCHAR(100)       | Obrigatório quando tipo=RESPONSAVEL/CUIDADOR  |
| recebe_notificacoes   | BOOLEAN            | Obrigatório quando tipo=RESPONSAVEL/CUIDADOR  |
| push_token            | VARCHAR(255)       | NULLABLE, atualizado a cada login             |

### Table: VINCULO

| Coluna          | Tipo           | Restrições                                         |
|-----------------|----------------|----------------------------------------------------|
| id              | BIGSERIAL PK   |                                                    |
| responsavel_id  | BIGINT FK      | → USUARIO                                          |
| paciente_id     | BIGINT FK      | → USUARIO                                          |
| data_inicio     | DATE           | NOT NULL                                           |
| data_fim        | DATE           | NULLABLE                                           |
| ativo           | BOOLEAN        | NOT NULL, DEFAULT TRUE                             |

**Constraint:** `UNIQUE (responsavel_id, paciente_id) WHERE ativo = TRUE`

### Table: CATEGORIA

| Coluna    | Tipo           | Restrições  |
|-----------|----------------|-------------|
| id        | BIGSERIAL PK   |             |
| nome      | VARCHAR(100)   | NOT NULL    |
| descricao | TEXT           | NULLABLE    |

### Table: MEDICAMENTO

| Coluna                   | Tipo              | Restrições                                    |
|--------------------------|-------------------|-----------------------------------------------|
| id                       | BIGSERIAL PK      |                                               |
| paciente_id              | BIGINT FK         | → USUARIO NOT NULL                            |
| categoria_id             | BIGINT FK         | → CATEGORIA NULLABLE                          |
| nome                     | VARCHAR(255)      | NOT NULL                                      |
| dosagem                  | VARCHAR(100)      | NOT NULL                                      |
| instrucoes               | TEXT              | NOT NULL                                      |
| uso_continuo             | BOOLEAN           | NOT NULL                                      |
| necessita_retorno        | BOOLEAN           | NOT NULL                                      |
| intervalo_retorno_dias   | INT               | NULLABLE                                      |
| data_inicio_tratamento   | DATE              | NOT NULL                                      |
| data_proximo_retorno     | DATE              | NULLABLE                                      |
| retorno_realizado        | BOOLEAN           | NULLABLE                                      |
| data_retorno_realizado   | DATE              | NULLABLE                                      |
| ativo                    | BOOLEAN           | NOT NULL, DEFAULT TRUE                        |
| criado_em                | TIMESTAMP (UTC)   | NOT NULL, DEFAULT NOW()                       |
| criado_por               | BIGINT FK         | → USUARIO NOT NULL                            |
| atualizado_em            | TIMESTAMP (UTC)   | NULLABLE                                      |
| atualizado_por           | BIGINT FK         | → USUARIO NULLABLE                            |

### Table: AGENDA

| Coluna              | Tipo                  | Restrições                      |
|---------------------|-----------------------|---------------------------------|
| id                  | BIGSERIAL PK          |                                 |
| medicamento_id      | BIGINT FK             | → MEDICAMENTO NOT NULL          |
| horario             | TIME                  | NOT NULL                        |
| frequencia          | ENUM freq_tomada      | NOT NULL                        |
| dias_semana         | VARCHAR(20)           | NULLABLE (ex.: "1,3,5")         |
| tolerancia_minutos  | INT                   | NOT NULL, DEFAULT 30            |
| data_inicio         | DATE                  | NOT NULL                        |
| data_fim            | DATE                  | NULLABLE                        |
| ativo               | BOOLEAN               | NOT NULL, DEFAULT TRUE          |

### Table: REGISTRO_TOMADA

| Coluna                   | Tipo                  | Restrições                              |
|--------------------------|-----------------------|-----------------------------------------|
| id                       | BIGSERIAL PK          |                                         |
| agenda_id                | BIGINT FK             | → AGENDA NOT NULL                       |
| paciente_id              | BIGINT FK             | → USUARIO NOT NULL                      |
| data_hora_prevista       | TIMESTAMP (UTC)       | NOT NULL                                |
| data_hora_confirmacao    | TIMESTAMP (UTC)       | NULLABLE                                |
| status                   | ENUM status_tomada    | NOT NULL, DEFAULT 'PENDENTE'            |
| usuario_confirmacao_id   | BIGINT FK             | → USUARIO NULLABLE                      |

**Constraint:** `UNIQUE (agenda_id, data_hora_prevista)` — evita duplicatas do Scheduler

### Table: NOTIFICACAO

| Coluna              | Tipo                  | Restrições                                        |
|---------------------|-----------------------|---------------------------------------------------|
| id                  | BIGSERIAL PK          |                                                   |
| usuario_id          | BIGINT FK             | → USUARIO NOT NULL                                |
| registro_tomada_id  | BIGINT FK             | → REGISTRO_TOMADA NULLABLE                        |
| tipo                | ENUM tipo_notif       | NOT NULL                                          |
| enviado_em          | TIMESTAMP (UTC)       | NOT NULL                                          |
| lido_em             | TIMESTAMP (UTC)       | NULLABLE                                          |

## API Endpoints

Todos os endpoints exigem `Authorization: Bearer <token>` exceto `/auth/*` e `POST /usuarios`.

### Auth
| Método | Endpoint         | Body / Params                        | Resposta              |
|--------|------------------|--------------------------------------|-----------------------|
| POST   | /auth/login      | `{email, senha, push_token?}`        | `{access_token, refresh_token}` |
| POST   | /auth/refresh    | `{refresh_token}`                    | `{access_token}`      |
| POST   | /auth/logout     | `{refresh_token}`                    | 204                   |

### Usuários
| Método | Endpoint                    | Descrição                            |
|--------|-----------------------------|--------------------------------------|
| POST   | /usuarios                   | Cadastra novo usuário                |
| GET    | /usuarios/me                | Perfil do usuário autenticado        |
| PUT    | /usuarios/me                | Atualiza perfil                      |
| PUT    | /usuarios/me/push-token     | Atualiza push_token                  |

### Vínculos
| Método | Endpoint          | Descrição                            |
|--------|-------------------|--------------------------------------|
| POST   | /vinculos         | Cria vínculo                         |
| GET    | /vinculos         | Lista vínculos do usuário            |
| DELETE | /vinculos/{id}    | Encerra vínculo (soft delete)        |

### Medicamentos
| Método | Endpoint                         | Descrição                            |
|--------|----------------------------------|--------------------------------------|
| POST   | /pacientes/{id}/medicamentos     | Cadastra medicamento                 |
| GET    | /pacientes/{id}/medicamentos     | Lista medicamentos do paciente       |
| PUT    | /medicamentos/{id}               | Atualiza (gera auditoria)            |
| DELETE | /medicamentos/{id}               | Inativa (soft delete)                |

### Agendas
| Método | Endpoint                      | Descrição                            |
|--------|-------------------------------|--------------------------------------|
| POST   | /medicamentos/{id}/agendas    | Cria agenda                          |
| GET    | /medicamentos/{id}/agendas    | Lista agendas                        |
| PUT    | /agendas/{id}                 | Atualiza agenda                      |
| DELETE | /agendas/{id}                 | Inativa agenda                       |

### Registros de Tomada
| Método | Endpoint                              | Descrição                            |
|--------|---------------------------------------|--------------------------------------|
| GET    | /pacientes/{id}/registros-tomada      | Lista com filtros data/status        |
| PUT    | /registros-tomada/{id}/confirmar      | Confirma tomada                      |

### Notificações
| Método | Endpoint                    | Descrição                            |
|--------|-----------------------------|--------------------------------------|
| GET    | /notificacoes               | Lista notificações do usuário        |
| PUT    | /notificacoes/{id}/lida     | Marca como lida                      |

## Scheduler Jobs

```
Job 1: gerar_registros_tomada
  - Trigger: interval, every=5min
  - Lógica: varrer agendas ativas, criar REGISTRO_TOMADA com status=PENDENTE
            para data_hora_prevista dentro dos próximos 5 minutos sem registro existente,
            enviar push LEMBRETE ao paciente

Job 2: verificar_atrasos
  - Trigger: interval, every=2min
  - Lógica: buscar REGISTRO_TOMADA com status=PENDENTE onde
            data_hora_prevista + tolerancia_minutos < agora:
            → atualizar para ATRASADO
            → enviar FALHA_TOMADA para responsáveis/cuidadores com recebe_notificacoes=TRUE

Job 3: marcar_ignorados
  - Trigger: interval, every=5min
  - Lógica: buscar REGISTRO_TOMADA com status=ATRASADO onde
            data_hora_prevista + 2h < agora → atualizar para IGNORADO

Job 4: alertas_retorno_medico
  - Trigger: cron, hour=6, minute=0 (UTC)
  - Lógica: buscar medicamentos com necessita_retorno=TRUE, ativo=TRUE,
            data_proximo_retorno <= hoje + 7 dias sem notificação RETORNO_MEDICO
            nos últimos 7 dias → criar NOTIFICACAO para responsável vinculado
```

## Error Handling

| Cenário                          | HTTP Status | Resposta                             |
|----------------------------------|-------------|--------------------------------------|
| Validação de schema              | 422         | `{ "detail": [...] }` (FastAPI padrão)|
| E-mail duplicado                 | 409         | `{ "detail": "Email já cadastrado" }` |
| Token inválido/expirado          | 401         | `{ "detail": "Token inválido" }`     |
| Sem permissão                    | 403         | `{ "detail": "Acesso negado" }`      |
| Recurso não encontrado           | 404         | `{ "detail": "Não encontrado" }`     |
| Vínculo duplicado ativo          | 409         | `{ "detail": "Vínculo já existe" }`  |

## Security

- Senhas: `passlib[bcrypt]` com `CryptContext(schemes=["bcrypt"])`
- JWT: `python-jose[cryptography]`, segredo via variável de ambiente `SECRET_KEY`
- Tokens de refresh: armazenados em tabela `refresh_tokens` com flag `revogado`
- CORS: configurado para aceitar apenas origens conhecidas em produção
- Rate limiting: recomendado `slowapi` nos endpoints de auth

## Correctness Properties

### Property 1: Idempotência do Scheduler
O constraint `UNIQUE (agenda_id, data_hora_prevista)` garante que execuções repetidas do job não criam registros duplicados.
**Validates: Requirements 5.1**

### Property 2: Consistência de status
Transições de status seguem a máquina de estados `PENDENTE → CONFIRMADO | ATRASADO → CONFIRMADO | IGNORADO`. Não há transição reversa.
**Validates: Requirements 6.1, 6.2, 6.4, 6.5**

### Property 3: Integridade de vínculos
Soft delete preserva histórico; constraints de unicidade parcial (`WHERE ativo = TRUE`) impedem vínculos duplicados ativos.
**Validates: Requirements 2.2, 2.3**

### Property 4: Atomicidade de confirmação
`PUT /confirmar` atualiza status, timestamp e usuário em uma única transação.
**Validates: Requirements 6.1**

### Property 5: Segurança de tokens
Refresh tokens são revogados no logout e verificados contra a tabela antes de gerar novos access tokens.
**Validates: Requirements 1.7, 9.2**

## Testing Strategy

- **Unit tests**: Validações de schemas Pydantic, lógica de cálculo de adesão, helpers de push notification.
- **Integration tests**: Fluxos completos de autenticação, CRUD de cada módulo, transições de status via jobs do Scheduler.
- **Fixtures**: Banco de teste com usuários (paciente, responsável), vínculos ativos, medicamentos e agendas pré-configurados.
- **Cobertura de regras de negócio**: Testes específicos para RN02 (notificação de falha), RN03 (vínculo duplicado), RN06 (alerta retorno), RN07 (auditoria), RN09/RN10 (validação condicional por tipo).
- **Ferramentas**: `pytest` + `pytest-asyncio` com SQLite assíncrono em memória para isolamento.
