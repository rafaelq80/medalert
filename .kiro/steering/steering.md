# MedAlert — Steering Document (AWS Kiro)

## Visão Geral do Projeto

**MedAlert** é um aplicativo móvel de alertas e controle de medicamentos voltado a idosos. O sistema notifica pacientes no horário de cada tomada, confirma a adesão ao tratamento e alerta familiares/cuidadores em caso de falha.

## Stack Tecnológica

| Camada             | Tecnologia                                      |
|--------------------|-------------------------------------------------|
| App mobile         | React Native (Android 10+ / iOS 14+)            |
| Backend            | Python 3.12 + FastAPI                           |
| Banco de dados     | PostgreSQL 15+                                  |
| ORM / Migrations   | SQLAlchemy 2 + Alembic                          |
| Autenticação       | JWT via `python-jose` (access 24h / refresh 30d)|
| Push notifications | Firebase Cloud Messaging (FCM) + APNs           |
| Scheduler          | APScheduler 3 (embutido no FastAPI)             |

## Estrutura de Diretórios Esperada

```
medalert/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/           # config, security, database
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── usuarios/
│   │   │   ├── vinculos/
│   │   │   ├── medicamentos/
│   │   │   ├── agendas/
│   │   │   ├── registros_tomada/
│   │   │   └── notificacoes/
│   │   ├── scheduler/
│   │   └── push/
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
└── mobile/
    ├── src/
    │   ├── screens/
    │   ├── components/
    │   ├── services/
    │   └── navigation/
    └── package.json
```

## Padrões de Código

- **Backend:** padrão monolito modular com camadas `router → service → repository → model`
- **Nomenclatura de tabelas:** snake_case em português (ex.: `registro_tomada`)
- **Timestamps:** sempre armazenados em UTC; conversão para fuso local apenas na apresentação (RNF09)
- **Senhas:** hash obrigatório com `bcrypt` — nunca armazenar em texto plano (RNF03)
- **Autenticação:** todos os endpoints (exceto `/auth/*` e `POST /usuarios`) exigem `Authorization: Bearer <token>`
- **Soft delete:** registros nunca são deletados fisicamente; usar `ativo = FALSE`
- **Auditoria:** alterações em `nome`, `dosagem` e `instrucoes` de medicamentos devem ser auditadas (RN07)

## Regras de Negócio Críticas

- Tolerância padrão para confirmação de tomada: **30 minutos** (RN05)
- Alerta de retorno médico: **7 dias de antecedência** (RN06)
- Campos obrigatórios condicionais por tipo de usuário (RN09, RN10)
- Apenas um vínculo ativo por par responsável/cuidador–paciente (RN03)
- Histórico de tomadas **nunca** pode ser excluído (RN08)

## Convenções de API

- Base path: `/api/v1`
- Respostas de erro seguem o padrão `{ "detail": "mensagem" }`
- Paginação com query params `page` e `size` onde aplicável
- Datas retornadas no formato ISO 8601
