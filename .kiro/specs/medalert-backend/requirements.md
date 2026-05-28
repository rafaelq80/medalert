# Requirements Document

## Introduction

O MedAlert Backend é uma API REST desenvolvida em Python/FastAPI que serve como núcleo do aplicativo de alertas de medicamentos. Gerencia usuários, vínculos, medicamentos, agendas, registros de tomada e notificações push.

## Requirements

### 1 — Gestão de Usuários

**User Story:** Como qualquer pessoa, quero me cadastrar no sistema informando meu perfil (paciente, responsável ou cuidador) para que eu possa usar os recursos correspondentes ao meu papel.

#### Acceptance Criteria

1.1 WHEN um novo usuário é cadastrado via `POST /usuarios` THEN o sistema deve persistir `nome`, `email`, `senha` (hash bcrypt), `tipo` e `ativo = TRUE`.

1.2 WHEN `tipo = PACIENTE` THEN os campos `data_nascimento`, `obs_medicas` e `nivel_autonomia` são obrigatórios; o sistema retorna HTTP 422 se ausentes.

1.3 WHEN `tipo = RESPONSAVEL` ou `tipo = CUIDADOR` THEN os campos `grau_parentesco` e `recebe_notificacoes` são obrigatórios; o sistema retorna HTTP 422 se ausentes.

1.4 WHEN um e-mail já cadastrado é utilizado no `POST /usuarios` THEN o sistema retorna HTTP 409.

1.5 WHEN um usuário autentica via `POST /auth/login` com credenciais válidas THEN o sistema retorna `access_token` (24h) e `refresh_token` (30 dias) e atualiza o `push_token` informado no payload.

1.6 WHEN `POST /auth/refresh` é chamado com refresh token válido THEN um novo `access_token` é gerado.

1.7 WHEN `POST /auth/logout` é chamado THEN o refresh token é invalidado.

### 2 — Gestão de Vínculos

**User Story:** Como responsável ou cuidador, quero me vincular a um paciente para receber notificações e acompanhar a adesão ao tratamento dele.

#### Acceptance Criteria

2.1 WHEN `POST /vinculos` é chamado por um responsável/cuidador THEN um vínculo é criado com `ativo = TRUE` e `data_inicio = hoje`.

2.2 WHEN já existe um vínculo ativo para o mesmo par `(responsavel_id, paciente_id)` THEN o sistema retorna HTTP 409.

2.3 WHEN `DELETE /vinculos/{id}` é chamado THEN o sistema define `data_fim = hoje` e `ativo = FALSE` sem excluir o registro.

2.4 WHEN `GET /vinculos` é chamado THEN apenas vínculos do usuário autenticado são retornados.

### 3 — Gestão de Medicamentos

**User Story:** Como responsável, quero cadastrar os medicamentos de um paciente com nome, dosagem, instruções e categoria para que o sistema possa gerar lembretes corretos.

#### Acceptance Criteria

3.1 WHEN `POST /pacientes/{id}/medicamentos` é chamado THEN o medicamento é criado com `ativo = TRUE`, `criado_por` = usuário autenticado e `criado_em` = agora (UTC).

3.2 WHEN `instrucoes` não é informado THEN o sistema retorna HTTP 422 (campo obrigatório).

3.3 WHEN `PUT /medicamentos/{id}` altera `nome`, `dosagem` ou `instrucoes` THEN o sistema registra `atualizado_em` e `atualizado_por`.

3.4 WHEN `DELETE /medicamentos/{id}` é chamado THEN o medicamento recebe `ativo = FALSE`; nenhum novo `REGISTRO_TOMADA` é gerado a partir dele.

3.5 WHEN `necessita_retorno = TRUE` e `intervalo_retorno_dias` é informado THEN `data_proximo_retorno` é calculada como `data_inicio_tratamento + intervalo_retorno_dias`.

### 4 — Agenda e Lembretes

**User Story:** Como responsável, quero configurar os horários e a frequência de tomada de cada medicamento para que o sistema envie lembretes automáticos no momento certo.

#### Acceptance Criteria

4.1 WHEN `POST /medicamentos/{id}/agendas` é chamado THEN uma agenda é criada com `ativo = TRUE` e `tolerancia_minutos = 30` (se não informado).

4.2 WHEN `frequencia = SEMANAL` ou `frequencia = PERSONALIZADA` THEN `dias_semana` é obrigatório (ex.: `"1,3,5"`); HTTP 422 se ausente.

4.3 WHEN `DELETE /agendas/{id}` é chamado THEN a agenda recebe `ativo = FALSE` e não gera mais registros de tomada.

### 5 — Geração Automática de Registros de Tomada

**User Story:** Como sistema, quero gerar registros de tomada pendentes automaticamente para que cada horário agendado seja rastreado sem intervenção manual.

#### Acceptance Criteria

5.1 WHEN o Scheduler executa (a cada 5 minutos) THEN para cada `(agenda_id, data_hora_prevista)` dentro da janela dos próximos 5 minutos sem `REGISTRO_TOMADA` correspondente, o sistema cria o registro com `status = PENDENTE`.

5.2 WHEN um `REGISTRO_TOMADA` é criado THEN uma notificação push é enviada ao paciente via FCM/APNs com o `push_token` armazenado.

5.3 WHEN a agenda está com `ativo = FALSE` THEN nenhum registro deve ser gerado para ela.

5.4 WHEN o paciente não possui `push_token` THEN o registro é criado normalmente, mas o push é omitido e registrado em log.

### 6 — Confirmação de Tomada

**User Story:** Como paciente, responsável ou cuidador, quero confirmar que o medicamento foi tomado para que o histórico de adesão seja atualizado corretamente.

#### Acceptance Criteria

6.1 WHEN `PUT /registros-tomada/{id}/confirmar` é chamado dentro do prazo de tolerância THEN `status` muda para `CONFIRMADO`, `data_hora_confirmacao` = agora (UTC) e `usuario_confirmacao_id` = usuário autenticado.

6.2 WHEN o prazo de tolerância expira sem confirmação THEN o Scheduler muda `status` para `ATRASADO`.

6.3 WHEN o status muda para `ATRASADO` E existe responsável/cuidador vinculado ativo com `recebe_notificacoes = TRUE` THEN o sistema envia notificação `FALHA_TOMADA` para esse responsável/cuidador.

6.4 WHEN a confirmação ocorre após `ATRASADO` mas dentro de 2h THEN `status` muda para `CONFIRMADO` normalmente.

6.5 WHEN 2h se passam após o status `ATRASADO` sem confirmação THEN `status` muda para `IGNORADO`.

### 7 — Alertas de Retorno Médico

**User Story:** Como responsável, quero ser avisado com antecedência sobre o retorno médico necessário para medicamentos contínuos para que não perca o prazo.

#### Acceptance Criteria

7.1 WHEN o job diário (06h UTC) executa THEN para cada medicamento com `necessita_retorno = TRUE`, `ativo = TRUE` e `data_proximo_retorno <= hoje + 7 dias` o sistema verifica se já existe uma `NOTIFICACAO` do tipo `RETORNO_MEDICO` nos últimos 7 dias para aquele medicamento.

7.2 WHEN não existe notificação recente de retorno THEN o sistema cria uma `NOTIFICACAO` do tipo `RETORNO_MEDICO` para o responsável vinculado ativo.

7.3 WHEN já existe notificação de retorno nos últimos 7 dias THEN nenhuma nova notificação é criada (idempotência).

### 8 — Histórico e Adesão

**User Story:** Como responsável ou paciente, quero visualizar o histórico de tomadas e o percentual de adesão para monitorar a evolução do tratamento.

#### Acceptance Criteria

8.1 WHEN `GET /pacientes/{id}/registros-tomada` é chamado THEN o sistema retorna registros filtráveis por `data_inicio`, `data_fim` e `status`.

8.2 WHEN o histórico é consultado THEN o percentual de adesão é calculado como `(confirmados / total) * 100` no período filtrado.

8.3 WHEN um responsável consulta o histórico de um paciente THEN apenas pacientes com vínculo ativo podem ser consultados; HTTP 403 caso contrário.

### 9 — Segurança e Conformidade

#### Acceptance Criteria

9.1 WHEN qualquer senha é armazenada THEN bcrypt é utilizado — texto plano nunca é persistido.

9.2 WHEN qualquer requisição (exceto `/auth/*` e `POST /usuarios`) chega sem token válido THEN o sistema retorna HTTP 401.

9.3 WHEN um usuário tenta acessar dados de outro usuário sem vínculo ativo THEN o sistema retorna HTTP 403.

9.4 WHEN qualquer dado é armazenado THEN timestamps são gravados em UTC.

9.5 WHEN a comunicação ocorre entre app e servidor THEN HTTPS/TLS 1.2+ é obrigatório.

## Glossary

- **Paciente**: Usuário que toma medicamentos e tem suas tomadas rastreadas.
- **Responsável**: Familiar ou tutor legal vinculado a um paciente, recebe notificações de falha.
- **Cuidador**: Profissional de saúde vinculado a um paciente, recebe notificações de falha.
- **Vínculo**: Relação ativa entre responsável/cuidador e paciente.
- **Agenda**: Configuração de horário e frequência de tomada de um medicamento.
- **Registro de Tomada**: Instância individual de uma dose prevista, com status de rastreamento.
- **Push Token**: Token do dispositivo móvel para envio de notificações push via FCM/APNs.
- **Tolerância**: Janela de tempo (em minutos) após o horário previsto em que a confirmação ainda é considerada no prazo.
- **Adesão**: Percentual de doses confirmadas em relação ao total de doses previstas.
