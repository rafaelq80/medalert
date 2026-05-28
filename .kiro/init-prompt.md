# Prompt de Inicialização — MedAlert (AWS Kiro)

## Contexto

Você é um assistente de desenvolvimento de software especializado em Python/FastAPI e React Native. Seu objetivo é construir o **MedAlert**, um aplicativo de alertas de medicamentos para idosos, seguindo estritamente as especificações do projeto.

## O que construir

O MedAlert é composto por:

1. **Backend (Python/FastAPI):** API REST monolito modular com PostgreSQL 15, SQLAlchemy 2, Alembic, APScheduler e autenticação JWT.
2. **Mobile (React Native):** App para Android 10+ e iOS 14+ com suporte a notificações push via FCM/APNs.

## Stack obrigatória

| Camada             | Tecnologia                                         |
|--------------------|----------------------------------------------------|
| App mobile         | React Native (TypeScript, Android 10+, iOS 14+)    |
| Backend            | Python 3.12 + FastAPI                              |
| Banco de dados     | PostgreSQL 15+                                     |
| ORM / Migrations   | SQLAlchemy 2 + Alembic                             |
| Autenticação       | JWT via `python-jose` (access 24h / refresh 30d)   |
| Push               | Firebase Cloud Messaging (FCM) + APNs              |
| Scheduler          | APScheduler 3 (embutido no FastAPI)                |

## Regras inegociáveis

- Senhas **sempre** com hash bcrypt — nunca texto plano
- Todos os timestamps **sempre** em UTC no banco
- Soft delete em tudo — nunca DELETE físico de registros
- Histórico de tomadas **nunca** pode ser excluído (apenas arquivado)
- Auditoria obrigatória em alterações de `nome`, `dosagem`, `instrucoes` do medicamento
- Tolerância padrão para confirmação de tomada: **30 minutos**
- Alerta de retorno médico: **7 dias de antecedência**
- Único vínculo ativo por par responsável/cuidador–paciente

## Estrutura de diretórios esperada

```
medalert/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/           # config, security, database, dependencies
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── usuarios/
│   │   │   ├── vinculos/
│   │   │   ├── medicamentos/
│   │   │   ├── agendas/
│   │   │   ├── registros_tomada/
│   │   │   └── notificacoes/
│   │   ├── scheduler/      # jobs.py + setup.py
│   │   └── push/           # service.py + fcm.py + apns.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── navigation/
│   │   ├── contexts/
│   │   └── constants/
│   └── package.json
└── docker-compose.yml
```

## Módulos do backend (cada um com router, service, repository, models, schemas)

### auth
- `POST /auth/login` — autenticar por e-mail/senha, retornar access_token (24h) e refresh_token (30d), salvar push_token
- `POST /auth/refresh` — renovar access_token
- `POST /auth/logout` — invalidar refresh_token

### usuarios
- `POST /usuarios` — cadastrar (sem autenticação), com validações condicionais por tipo
- `GET /usuarios/me` — perfil autenticado
- `PUT /usuarios/me` — atualizar perfil
- `PUT /usuarios/me/push-token` — atualizar push token do dispositivo

### vinculos
- `POST /vinculos` — criar vínculo (responsável/cuidador ↔ paciente)
- `GET /vinculos` — listar vínculos do usuário autenticado
- `DELETE /vinculos/{id}` — encerrar vínculo (soft delete: data_fim + ativo=FALSE)

### medicamentos
- `POST /pacientes/{id}/medicamentos` — cadastrar medicamento
- `GET /pacientes/{id}/medicamentos` — listar medicamentos do paciente
- `PUT /medicamentos/{id}` — atualizar com auditoria
- `DELETE /medicamentos/{id}` — inativar

### agendas
- `POST /medicamentos/{id}/agendas` — criar agenda de tomada
- `GET /medicamentos/{id}/agendas` — listar agendas
- `PUT /agendas/{id}` — atualizar
- `DELETE /agendas/{id}` — inativar

### registros_tomada
- `GET /pacientes/{id}/registros-tomada` — listar com filtros de data/status + percentual de adesão
- `PUT /registros-tomada/{id}/confirmar` — confirmar tomada

### notificacoes
- `GET /notificacoes` — listar do usuário autenticado
- `PUT /notificacoes/{id}/lida` — marcar como lida

## Jobs do Scheduler (APScheduler)

| Job                        | Trigger            | Responsabilidade                                                                  |
|----------------------------|--------------------|-----------------------------------------------------------------------------------|
| gerar_registros_tomada     | Interval, 5min     | Criar REGISTRO_TOMADA PENDENTE para agendas ativas nos próximos 5min; enviar push LEMBRETE |
| verificar_atrasos          | Interval, 2min     | PENDENTE expirado → ATRASADO; enviar FALHA_TOMADA para responsáveis elegíveis     |
| marcar_ignorados           | Interval, 5min     | ATRASADO há mais de 2h → IGNORADO                                                 |
| alertas_retorno_medico     | Cron, 06h UTC      | Medicamentos com retorno em ≤7 dias sem notificação recente → criar RETORNO_MEDICO|

## Modelo de dados (tabelas e campos principais)

### USUARIO
id (PK), nome, email (UNIQUE), telefone, senha (bcrypt), tipo (PACIENTE/RESPONSAVEL/CUIDADOR), ativo, criado_em (UTC), data_nascimento*, obs_medicas*, nivel_autonomia* (TOTAL/PARCIAL/DEPENDENTE), grau_parentesco**, recebe_notificacoes**, push_token

*Obrigatório para PACIENTE | **Obrigatório para RESPONSAVEL e CUIDADOR

### VINCULO
id, responsavel_id (FK USUARIO), paciente_id (FK USUARIO), data_inicio, data_fim, ativo
Constraint: UNIQUE (responsavel_id, paciente_id) WHERE ativo = TRUE

### CATEGORIA
id, nome, descricao

### MEDICAMENTO
id, paciente_id (FK), categoria_id (FK), nome, dosagem, instrucoes (NOT NULL), uso_continuo, necessita_retorno, intervalo_retorno_dias, data_inicio_tratamento, data_proximo_retorno, retorno_realizado, data_retorno_realizado, ativo, criado_em (UTC), criado_por (FK), atualizado_em, atualizado_por (FK)

### AGENDA
id, medicamento_id (FK), horario (TIME), frequencia (DIARIA/SEMANAL/PERSONALIZADA), dias_semana, tolerancia_minutos (DEFAULT 30), data_inicio, data_fim, ativo

### REGISTRO_TOMADA
id, agenda_id (FK), paciente_id (FK), data_hora_prevista (UTC), data_hora_confirmacao (UTC), status (PENDENTE/CONFIRMADO/ATRASADO/IGNORADO), usuario_confirmacao_id (FK)
Constraint: UNIQUE (agenda_id, data_hora_prevista)

### NOTIFICACAO
id, usuario_id (FK), registro_tomada_id (FK, nullable), tipo (LEMBRETE/FALHA_TOMADA/RETORNO_MEDICO), enviado_em (UTC), lido_em (UTC, nullable)

## Fluxo de confirmação de tomada (lógica central)

```
Scheduler cria REGISTRO_TOMADA (PENDENTE) + push LEMBRETE ao paciente
    ↓
Confirmação dentro da tolerância?
    Sim → status = CONFIRMADO
    Não → status = ATRASADO + push FALHA_TOMADA para responsável/cuidador com recebe_notificacoes=TRUE
              ↓
         Responsável confirma em até 2h?
             Sim → status = CONFIRMADO
             Não → status = IGNORADO
```

## Começar por

1. Crie a estrutura de diretórios do backend conforme especificado
2. Configure `requirements.txt`, `app/core/config.py`, `app/core/database.py` e `alembic`
3. Crie todos os modelos SQLAlchemy e gere a migration inicial
4. Implemente os módulos na ordem: auth → usuarios → vinculos → medicamentos → agendas → registros_tomada → notificacoes
5. Implemente o scheduler e o serviço de push
6. Em seguida, inicie o projeto React Native com autenticação e a tela de agenda

## Validações importantes

- `instrucoes` é campo obrigatório em MEDICAMENTO — retornar HTTP 422 se ausente
- `dias_semana` é obrigatório quando `frequencia` é SEMANAL ou PERSONALIZADA
- Usuário autenticado só acessa dados de pacientes com vínculo ativo — retornar HTTP 403 caso contrário
- Todo endpoint (exceto `POST /usuarios` e `/auth/*`) exige `Authorization: Bearer <token>` — retornar HTTP 401 se ausente ou inválido
