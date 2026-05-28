# Requirements Document

## Introduction

O app mobile do MedAlert é desenvolvido em React Native (Android 10+ / iOS 14+). Serve como interface principal para pacientes, responsáveis e cuidadores interagirem com o sistema de alertas de medicamentos.

## Requirements

### 1 — Autenticação

**User Story:** Como usuário, quero fazer login com e-mail e senha para acessar as funcionalidades do meu perfil.

#### Acceptance Criteria

1.1 WHEN o usuário entra no app sem sessão ativa THEN a tela de login é exibida.

1.2 WHEN credenciais válidas são informadas THEN o app armazena o `access_token` e `refresh_token` de forma segura e navega para a tela principal.

1.3 WHEN o `access_token` expira THEN o app automaticamente usa o `refresh_token` para obter um novo, sem redirecionar o usuário para o login.

1.4 WHEN o `refresh_token` expira THEN o usuário é redirecionado para a tela de login.

1.5 WHEN o usuário faz login THEN o `push_token` do dispositivo é enviado no payload de autenticação.

### 2 — Cadastro de Usuário

**User Story:** Como novo usuário, quero me cadastrar informando meu perfil para começar a usar o app.

#### Acceptance Criteria

2.1 WHEN o tipo `PACIENTE` é selecionado no cadastro THEN os campos `data_nascimento`, `obs_medicas` e `nivel_autonomia` são exibidos como obrigatórios.

2.2 WHEN o tipo `RESPONSAVEL` ou `CUIDADOR` é selecionado THEN os campos `grau_parentesco` e `recebe_notificacoes` são exibidos como obrigatórios.

2.3 WHEN o cadastro é bem-sucedido THEN o usuário é redirecionado para a tela de login.

### 3 — Agenda do Dia (Paciente / Cuidador)

**User Story:** Como paciente ou cuidador, quero ver todos os medicamentos do dia com seus horários para não perder nenhuma tomada.

#### Acceptance Criteria

3.1 WHEN a tela de agenda é aberta THEN os registros de tomada do dia são exibidos ordenados por horário.

3.2 WHEN um registro tem status `PENDENTE` THEN um botão "Confirmar" é exibido ao lado.

3.3 WHEN um registro tem status `CONFIRMADO` THEN um ícone de check e o nome de quem confirmou são exibidos.

3.4 WHEN um registro tem status `ATRASADO` THEN o card é destacado visualmente em laranja/vermelho.

3.5 WHEN um registro tem status `IGNORADO` THEN o card é exibido em cinza com indicação de não realizado.

### 4 — Confirmação de Tomada

**User Story:** Como paciente, responsável ou cuidador, quero confirmar uma tomada com um toque para registrar a adesão.

#### Acceptance Criteria

4.1 WHEN o botão "Confirmar" é tocado THEN o app chama `PUT /registros-tomada/{id}/confirmar` e atualiza o status na tela imediatamente.

4.2 WHEN a confirmação é bem-sucedida THEN o card atualiza para `CONFIRMADO` sem recarregar a tela inteira.

4.3 WHEN ocorre erro de rede THEN uma mensagem de erro é exibida e o status não é alterado localmente.

### 5 — Gestão de Medicamentos (Responsável)

**User Story:** Como responsável, quero cadastrar e gerenciar os medicamentos de um paciente vinculado.

#### Acceptance Criteria

5.1 WHEN a tela de medicamentos é aberta THEN apenas medicamentos do paciente vinculado selecionado são listados.

5.2 WHEN o formulário de cadastro é preenchido THEN `instrucoes` é campo obrigatório com validação antes do envio.

5.3 WHEN `necessita_retorno` é ativado THEN os campos `intervalo_retorno_dias` e `data_inicio_tratamento` tornam-se obrigatórios.

5.4 WHEN um medicamento é inativado THEN ele desaparece da lista ativa mas permanece no histórico.

### 6 — Notificações

**User Story:** Como usuário, quero receber e visualizar notificações sobre tomadas e retornos médicos.

#### Acceptance Criteria

6.1 WHEN uma notificação push chega THEN ela exibe o nome do medicamento e o horário da tomada.

6.2 WHEN o usuário toca na notificação THEN o app abre diretamente no registro de tomada correspondente.

6.3 WHEN a tela de notificações é aberta THEN notificações não lidas são destacadas visualmente.

6.4 WHEN uma notificação é tocada na lista THEN `PUT /notificacoes/{id}/lida` é chamado e o destaque é removido.

### 7 — Histórico e Adesão

**User Story:** Como responsável ou paciente, quero ver o histórico de tomadas com percentual de adesão para acompanhar o tratamento.

#### Acceptance Criteria

7.1 WHEN a tela de histórico é aberta THEN um seletor de período (últimos 7, 15, 30 dias) é exibido.

7.2 WHEN um período é selecionado THEN o percentual de adesão é exibido em destaque e os registros são listados.

7.3 WHEN o percentual de adesão é menor que 80% THEN ele é exibido em vermelho como alerta.

### 8 — Acessibilidade e Usabilidade

**User Story:** Como idoso com baixa familiaridade tecnológica, quero uma interface simples e clara para usar o app sem dificuldade.

#### Acceptance Criteria

8.1 WHEN qualquer tela é exibida THEN o tamanho mínimo de fonte é 16sp e botões têm área de toque mínima de 48x48dp.

8.2 WHEN uma ação crítica (confirmar tomada) é executada THEN um feedback visual claro é exibido (animação ou cor).

8.3 WHEN o app é usado em modo escuro THEN todos os elementos mantêm contraste adequado (WCAG AA).

## Glossary

- **Paciente**: Usuário que toma medicamentos e tem suas tomadas rastreadas pelo app.
- **Responsável**: Familiar ou tutor legal vinculado a um paciente, pode cadastrar medicamentos e receber notificações de falha.
- **Cuidador**: Profissional de saúde vinculado a um paciente, pode confirmar tomadas e receber notificações.
- **Registro de Tomada**: Instância individual de uma dose prevista exibida na agenda do dia.
- **Push Token**: Token do dispositivo móvel (FCM/APNs) para recebimento de notificações push.
- **Adesão**: Percentual de doses confirmadas em relação ao total previsto no período.
- **Optimistic Update**: Atualização imediata da UI antes da confirmação do servidor, revertida em caso de erro.
