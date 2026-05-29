# MedAlert

Sistema de alertas e controle de medicamentos voltado a idosos. O MedAlert notifica pacientes no horário de cada tomada, confirma a adesão ao tratamento e alerta familiares ou cuidadores em caso de falha.

## Contexto

Muitos idosos dependem de múltiplos medicamentos com horários específicos. A falta de adesão ao tratamento é um problema de saúde pública que pode levar a internações e complicações. O MedAlert resolve isso automatizando lembretes, rastreando confirmações e mantendo uma rede de apoio informada.

## Funcionalidades Principais

- **Gestão de medicamentos e agendas** — cadastro de medicamentos com horários, frequência e instruções
- **Alertas automáticos** — notificações push no horário de cada tomada via FCM/APNs
- **Confirmação de tomada** — paciente ou cuidador confirma a ingestão do medicamento
- **Detecção de falhas** — sistema identifica atrasos e notifica responsáveis automaticamente
- **Histórico de adesão** — percentual de adesão por período com visualização no app
- **Alerta de retorno médico** — lembrete 7 dias antes da data de retorno ao médico
- **Painel administrativo** — gerenciamento de usuários, categorias e métricas do sistema

## Tipos de Usuário

| Tipo | Descrição |
|------|-----------|
| PACIENTE | Pessoa que recebe os lembretes e confirma as tomadas |
| RESPONSAVEL | Familiar que gerencia medicamentos e recebe alertas de falha |
| CUIDADOR | Profissional de saúde com acesso similar ao responsável |
| ADMIN | Administrador com acesso irrestrito ao sistema |

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| App mobile | React Native + TypeScript (Expo SDK 56) |
| Backend | Python 3.12 + FastAPI |
| Banco de dados | PostgreSQL 15+ |
| ORM / Migrations | SQLAlchemy 2 + Alembic |
| Autenticação | JWT (access token 24h / refresh token 30d) |
| Push notifications | Firebase Cloud Messaging + APNs |
| Scheduler | APScheduler 3 (embutido no FastAPI) |

## Estrutura do Projeto

```
medalert/
├── backend/          # API REST (FastAPI)
│   ├── app/
│   │   ├── core/     # Configuração, segurança, banco de dados
│   │   ├── modules/  # Módulos de negócio (auth, usuarios, medicamentos, admin, etc.)
│   │   ├── scheduler/# Jobs automáticos (lembretes, atrasos, retorno médico)
│   │   └── push/     # Integração FCM e APNs
│   ├── alembic/      # Migrations do banco de dados
│   └── tests/        # Testes automatizados
├── mobile/           # App React Native (Expo)
│   └── src/
│       ├── screens/  # Telas do aplicativo
│       ├── components/# Componentes reutilizáveis
│       ├── hooks/    # Custom hooks
│       ├── services/ # Comunicação com a API
│       └── navigation/# Navegação e rotas
└── docs/             # Documentação e coleção Insomnia
```

## Licença

Projeto acadêmico — uso restrito.
