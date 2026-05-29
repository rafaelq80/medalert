# Requirements Document

## Introduction

O sistema MedAlert atualmente possui três tipos de usuário (PACIENTE, RESPONSAVEL, CUIDADOR) com controle de acesso baseado em vínculos. Esta feature introduz o tipo ADMIN com acesso irrestrito a todos os recursos do sistema, capacidade de gerenciar usuários, categorias de medicamentos e visualizar métricas globais. O ADMIN não está sujeito às restrições de vínculo que se aplicam aos demais tipos de usuário. O app mobile receberá telas administrativas para que o administrador possa operar o sistema a partir do dispositivo móvel.

## Glossary

- **Sistema**: O backend MedAlert (FastAPI)
- **App**: O aplicativo móvel MedAlert (React Native)
- **Admin**: Usuário com tipo ADMIN no enum TipoUsuario, com privilégios elevados de acesso e gerenciamento
- **Dependency_Admin**: Dependência FastAPI que valida se o usuário autenticado possui tipo ADMIN
- **Vinculo**: Relação ativa entre um responsável/cuidador e um paciente que concede acesso aos dados do paciente
- **Refresh_Token**: Token JWT de longa duração armazenado na tabela refresh_tokens, usado para obter novos access tokens
- **Categoria**: Classificação de medicamentos (tabela CATEGORIA)
- **Métricas**: Dados agregados do sistema (contagem de usuários, vínculos ativos, taxas de adesão)
- **TipoUsuario**: Enum que define os papéis no sistema (PACIENTE, RESPONSAVEL, CUIDADOR, ADMIN)
- **Painel_Admin**: Conjunto de telas no app mobile exclusivas para usuários ADMIN

## Requirements

### Requirement 1: Tipo de Usuário ADMIN

**User Story:** Como administrador, quero um tipo de usuário ADMIN dedicado no sistema, para que eu possa ser distinguido dos usuários comuns e receber privilégios elevados.

#### Acceptance Criteria

1. THE Sistema SHALL incluir ADMIN como valor válido no enum TipoUsuario
2. WHEN um usuário com tipo ADMIN se autentica, THE Sistema SHALL emitir um JWT access token contendo o claim de tipo do usuário
3. THE Sistema SHALL permitir a criação de usuários ADMIN exclusivamente por inserção direta no banco de dados ou script de seed
4. WHEN uma requisição de cadastro especifica tipo ADMIN, THE Sistema SHALL rejeitar a requisição com HTTP 403

### Requirement 2: Guarda de Autenticação Admin

**User Story:** Como administrador, quero uma dependência de autorização dedicada, para que endpoints exclusivos de admin sejam protegidos contra usuários não-admin.

#### Acceptance Criteria

1. THE Dependency_Admin SHALL validar que o usuário autenticado possui tipo igual a ADMIN
2. WHEN um usuário não-ADMIN tenta acessar um endpoint protegido por admin, THE Dependency_Admin SHALL retornar HTTP 403 com detail "Acesso restrito a administradores"
3. WHEN uma requisição não autenticada alcança um endpoint protegido por admin, THE Sistema SHALL retornar HTTP 401 com detail "Token inválido"
4. THE Dependency_Admin SHALL reutilizar a dependência get_current_user existente para validação do token antes de verificar o tipo do usuário

### Requirement 3: Gerenciamento de Usuários

**User Story:** Como administrador, quero listar, visualizar, ativar, desativar e alterar o tipo de qualquer usuário, para que eu possa gerenciar a base de usuários do sistema.

#### Acceptance Criteria

1. WHEN o Admin solicita a lista de usuários, THE Sistema SHALL retornar uma lista paginada de todos os usuários com os campos: id, nome, email, tipo, ativo, criado_em
2. WHEN o Admin solicita a lista de usuários com filtro de tipo, THE Sistema SHALL retornar apenas usuários correspondentes ao tipo especificado
3. WHEN o Admin solicita a lista de usuários com query de busca, THE Sistema SHALL filtrar usuários por nome ou email contendo a string de busca (case-insensitive)
4. WHEN o Admin solicita detalhes de um usuário específico por id, THE Sistema SHALL retornar o perfil completo do usuário incluindo todos os campos específicos do tipo
5. WHEN o Admin desativa um usuário, THE Sistema SHALL definir o campo ativo do usuário como FALSE
6. WHEN o Admin ativa um usuário, THE Sistema SHALL definir o campo ativo do usuário como TRUE
7. WHEN o Admin altera o tipo de um usuário, THE Sistema SHALL atualizar o campo tipo para o novo valor
8. IF o Admin tenta desativar a própria conta, THEN THE Sistema SHALL rejeitar a requisição com HTTP 400 e detail "Admin não pode desativar a própria conta"
9. IF o Admin tenta alterar o próprio tipo, THEN THE Sistema SHALL rejeitar a requisição com HTTP 400 e detail "Admin não pode alterar o próprio tipo"

### Requirement 4: Acesso Irrestrito a Dados

**User Story:** Como administrador, quero acessar todos os dados do sistema sem restrições de vínculo, para que eu possa supervisionar todos os pacientes, medicamentos e agendas.

#### Acceptance Criteria

1. WHEN o Admin acessa endpoints de dados de pacientes, THE Sistema SHALL ignorar a verificação de vínculo e retornar os dados solicitados
2. WHEN o Admin lista medicamentos de qualquer paciente, THE Sistema SHALL retornar todos os medicamentos sem exigir um vínculo ativo
3. WHEN o Admin lista registros de tomada de qualquer paciente, THE Sistema SHALL retornar todos os registros sem exigir um vínculo ativo
4. WHEN o Admin acessa agendas de qualquer medicamento, THE Sistema SHALL retornar todas as agendas sem verificação de propriedade
5. THE Sistema SHALL preservar o controle de acesso baseado em vínculo existente para usuários não-ADMIN sem modificação

### Requirement 5: Gerenciamento de Categorias

**User Story:** Como administrador, quero criar, editar e excluir categorias de medicamentos, para que eu possa manter um sistema de classificação organizado para os medicamentos.

#### Acceptance Criteria

1. WHEN o Admin cria uma categoria com um nome válido, THE Sistema SHALL persistir a nova Categoria e retorná-la com HTTP 201
2. WHEN o Admin atualiza uma categoria, THE Sistema SHALL modificar os campos nome e descricao conforme especificado
3. WHEN o Admin exclui uma categoria, THE Sistema SHALL remover o registro da Categoria do banco de dados
4. IF o Admin tenta excluir uma categoria que possui medicamentos associados, THEN THE Sistema SHALL rejeitar a requisição com HTTP 409 e detail "Categoria possui medicamentos associados"
5. IF o Admin cria uma categoria com um nome que já existe, THEN THE Sistema SHALL rejeitar a requisição com HTTP 409 e detail "Categoria já existe"
6. WHEN um usuário não-ADMIN acessa endpoints de gerenciamento de categorias (criar, atualizar, excluir), THE Sistema SHALL retornar HTTP 403

### Requirement 6: Métricas do Sistema

**User Story:** Como administrador, quero visualizar métricas agregadas do sistema, para que eu possa monitorar a saúde e o uso da plataforma.

#### Acceptance Criteria

1. WHEN o Admin solicita métricas do sistema, THE Sistema SHALL retornar a contagem total de usuários registrados agrupados por tipo
2. WHEN o Admin solicita métricas do sistema, THE Sistema SHALL retornar a contagem de usuários ativos (ativo = TRUE)
3. WHEN o Admin solicita métricas do sistema, THE Sistema SHALL retornar a contagem total de vínculos ativos
4. WHEN o Admin solicita métricas do sistema, THE Sistema SHALL retornar a taxa de adesão medicamentosa calculada como a porcentagem de registros CONFIRMADO sobre o total de registros nos últimos 30 dias
5. WHEN o Admin solicita métricas do sistema, THE Sistema SHALL retornar a contagem de registros com status ATRASADO e IGNORADO nos últimos 30 dias
6. THE Sistema SHALL computar todas as métricas no momento da requisição sem cache

### Requirement 7: Forçar Logout (Revogação de Tokens)

**User Story:** Como administrador, quero forçar o logout de qualquer usuário revogando todos os seus refresh tokens, para que eu possa responder a incidentes de segurança ou violações de política.

#### Acceptance Criteria

1. WHEN o Admin solicita o logout forçado de um usuário específico, THE Sistema SHALL definir o campo revogado como TRUE em todos os refresh tokens ativos pertencentes a esse usuário
2. WHEN o Admin solicita o logout forçado de um usuário específico, THE Sistema SHALL retornar HTTP 200 com a contagem de tokens revogados
3. IF o usuário alvo não possui refresh tokens ativos, THEN THE Sistema SHALL retornar HTTP 200 com contagem zero
4. WHEN um usuário cujos tokens foram revogados tenta renovar sua sessão, THE Sistema SHALL retornar HTTP 401
5. IF o Admin tenta forçar logout de si mesmo, THEN THE Sistema SHALL rejeitar a requisição com HTTP 400 e detail "Admin não pode revogar os próprios tokens"

### Requirement 8: Acesso Admin a Todos os Endpoints

**User Story:** Como administrador, quero acessar todos os endpoints existentes do sistema sem restrições baseadas em vínculo, para que eu possa realizar qualquer operação para suporte e supervisão.

#### Acceptance Criteria

1. WHEN o Admin chama qualquer endpoint que realiza verificação de vínculo, THE Sistema SHALL ignorar a verificação de vínculo e conceder acesso
2. WHEN o Admin cria um vínculo entre quaisquer dois usuários, THE Sistema SHALL permitir a operação independentemente do tipo do Admin
3. WHEN o Admin confirma um registro de tomada de qualquer paciente, THE Sistema SHALL permitir a confirmação sem verificação de vínculo
4. THE Sistema SHALL registrar ações do admin que ignoram o controle de acesso normal com o id do usuário admin para fins de auditoria

### Requirement 9: Painel Administrativo no App Mobile

**User Story:** Como administrador, quero acessar um painel administrativo no aplicativo móvel, para que eu possa gerenciar o sistema diretamente do meu dispositivo.

#### Acceptance Criteria

1. WHEN um usuário ADMIN faz login no App, THE App SHALL exibir a navegação do Painel_Admin em vez da navegação padrão de paciente/responsável
2. THE Painel_Admin SHALL conter uma tela de Dashboard exibindo as métricas do sistema (total de usuários, vínculos ativos, taxa de adesão)
3. THE Painel_Admin SHALL conter uma tela de Gerenciamento de Usuários com lista pesquisável, filtros por tipo e status, e ações de ativar/desativar
4. WHEN o Admin toca em um usuário na lista, THE App SHALL navegar para a tela de detalhes do usuário com opções de alterar tipo e forçar logout
5. THE Painel_Admin SHALL conter uma tela de Gerenciamento de Categorias com lista, criação, edição e exclusão de categorias
6. WHEN o Admin realiza uma ação destrutiva (desativar usuário, forçar logout, excluir categoria), THE App SHALL exibir um diálogo de confirmação antes de executar a operação
7. THE App SHALL exibir feedback visual (toast/snackbar) após cada operação administrativa indicando sucesso ou erro
8. WHILE o App está carregando dados administrativos, THE App SHALL exibir indicadores de carregamento (skeleton/spinner) nas telas correspondentes
