# MedAlert Backend

API REST para o sistema MedAlert — gerenciamento de medicamentos, lembretes automáticos e acompanhamento de adesão terapêutica para pacientes, responsáveis e cuidadores.

## Stack

- **Python 3.12** + **FastAPI**
- **PostgreSQL 15+** com **SQLAlchemy 2** (async) + **Alembic**
- **JWT** via `python-jose` (access token 24h / refresh token 30 dias)
- **APScheduler** para jobs automáticos
- **Push notifications** via FCM (Android) e APNs (iOS)

## Pré-requisitos

- Python 3.12+
- PostgreSQL 15+
- pip

## Configuração local

### 1. Criar ambiente virtual

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações (veja a tabela de variáveis abaixo).

### 4. Executar migrações

```bash
alembic upgrade head
```

### 5. Popular dados iniciais (categorias terapêuticas)

```bash
python seed.py
```

### 6. Executar o servidor

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão PostgreSQL (async) | `postgresql+asyncpg://user:pass@localhost:5432/medalert` |
| `SECRET_KEY` | Chave secreta para assinatura JWT | `sua-chave-secreta-aqui` |
| `ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiração do access token (min) | `1440` (24h) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Expiração do refresh token (dias) | `30` |
| `FCM_SERVER_KEY` | Chave do Firebase Cloud Messaging | (opcional) |
| `APNS_KEY_ID` | Key ID do APNs | (opcional) |
| `APNS_TEAM_ID` | Team ID do APNs | (opcional) |
| `APNS_BUNDLE_ID` | Bundle ID do app iOS | (opcional) |
| `APNS_KEY_PATH` | Caminho para a chave .p8 do APNs | (opcional) |
| `APNS_USE_SANDBOX` | Usar sandbox do APNs | `true` |

## Execução com Docker

### Subir todos os serviços

```bash
docker-compose up --build
```

Serviços iniciados:
- **db**: PostgreSQL 15 na porta 5432
- **api**: Backend FastAPI na porta 8000

### Executar migrações no container

```bash
docker-compose exec api alembic upgrade head
```

### Popular dados iniciais no container

```bash
docker-compose exec api python seed.py
```

## API

Base path: `/api/v1`

### Documentação interativa

Com o servidor rodando:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health check**: [http://localhost:8000/health](http://localhost:8000/health)

### Endpoints

Todos os endpoints exigem `Authorization: Bearer <token>` exceto `/api/v1/auth/*` e `POST /api/v1/usuarios`.

| Módulo | Método | Endpoint | Descrição |
|--------|--------|----------|-----------|
| Auth | POST | `/api/v1/auth/login` | Login (retorna access + refresh token) |
| Auth | POST | `/api/v1/auth/refresh` | Renovar access token |
| Auth | POST | `/api/v1/auth/logout` | Invalidar refresh token |
| Usuários | POST | `/api/v1/usuarios` | Cadastrar usuário (sem auth) |
| Usuários | GET | `/api/v1/usuarios/me` | Perfil do autenticado |
| Usuários | PUT | `/api/v1/usuarios/me` | Atualizar perfil |
| Usuários | PUT | `/api/v1/usuarios/me/push-token` | Atualizar push token |
| Vínculos | POST | `/api/v1/vinculos` | Criar vínculo |
| Vínculos | GET | `/api/v1/vinculos` | Listar vínculos |
| Vínculos | DELETE | `/api/v1/vinculos/{id}` | Encerrar vínculo (soft delete) |
| Categorias | GET | `/api/v1/categorias` | Listar categorias |
| Medicamentos | POST | `/api/v1/pacientes/{id}/medicamentos` | Cadastrar medicamento |
| Medicamentos | GET | `/api/v1/pacientes/{id}/medicamentos` | Listar medicamentos |
| Medicamentos | PUT | `/api/v1/medicamentos/{id}` | Atualizar (com auditoria) |
| Medicamentos | DELETE | `/api/v1/medicamentos/{id}` | Inativar (soft delete) |
| Agendas | POST | `/api/v1/medicamentos/{id}/agendas` | Criar agenda |
| Agendas | GET | `/api/v1/medicamentos/{id}/agendas` | Listar agendas |
| Agendas | PUT | `/api/v1/agendas/{id}` | Atualizar agenda |
| Agendas | DELETE | `/api/v1/agendas/{id}` | Inativar agenda |
| Registros | GET | `/api/v1/pacientes/{id}/registros-tomada` | Listar (filtros: data, status) |
| Registros | PUT | `/api/v1/registros-tomada/{id}/confirmar` | Confirmar tomada |
| Notificações | GET | `/api/v1/notificacoes` | Listar notificações |
| Notificações | PUT | `/api/v1/notificacoes/{id}/lida` | Marcar como lida |

### Respostas de erro

Formato padrão: `{ "detail": "mensagem" }`

| Status | Cenário |
|--------|---------|
| 401 | Token inválido ou ausente |
| 403 | Sem permissão (sem vínculo ativo) |
| 404 | Recurso não encontrado |
| 409 | Conflito (e-mail duplicado, vínculo já existe) |
| 422 | Validação de campos |

## Jobs automáticos (Scheduler)

| Job | Frequência | Função |
|-----|-----------|--------|
| `gerar_registros_tomada` | A cada 5 min | Cria registros PENDENTE + envia push LEMBRETE |
| `verificar_atrasos` | A cada 2 min | PENDENTE expirado → ATRASADO + push FALHA_TOMADA |
| `marcar_ignorados` | A cada 5 min | ATRASADO há 2h+ → IGNORADO |
| `alertas_retorno_medico` | Diário 06h UTC | Alerta retorno médico em 7 dias |

## Testes

```bash
python -m pytest tests/ -v
```

## Estrutura do projeto

```
backend/
├── app/
│   ├── main.py              # FastAPI app, routers, lifespan
│   ├── core/
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── database.py      # Engine async + session factory
│   │   ├── security.py      # JWT + bcrypt
│   │   └── dependencies.py  # get_db, get_current_user
│   ├── modules/
│   │   ├── auth/            # Login, refresh, logout
│   │   ├── usuarios/        # Cadastro e perfil
│   │   ├── vinculos/        # Vínculos paciente-responsável
│   │   ├── medicamentos/    # Medicamentos e categorias
│   │   ├── agendas/         # Agendas de tomada
│   │   ├── registros_tomada/# Registros e confirmação
│   │   └── notificacoes/    # Notificações
│   ├── scheduler/
│   │   ├── setup.py         # Configuração APScheduler
│   │   └── jobs.py          # Jobs automáticos
│   └── push/
│       ├── service.py       # Abstração de envio
│       ├── fcm.py           # Firebase Cloud Messaging
│       ├── apns.py          # Apple Push Notification
│       └── helpers.py       # Templates de mensagem
├── alembic/                 # Migrações de banco
├── tests/                   # Testes automatizados
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── seed.py
└── .env.example
```

## Convenções

- **Soft delete**: registros nunca são deletados fisicamente (`ativo = FALSE`)
- **Timestamps**: sempre em UTC no banco; conversão para fuso local no cliente
- **Senhas**: hash bcrypt obrigatório
- **Auditoria**: alterações em medicamentos registram `atualizado_em` e `atualizado_por`
- **Nomenclatura**: tabelas em snake_case português
