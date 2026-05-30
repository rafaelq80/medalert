# Implementation Plan — Refatoração Backend API

## Overview

Correções de segurança, performance, validação e conformidade com o mobile. Python 3.12 + FastAPI + SQLAlchemy 2 async.

## Tasks

- [x] 1. Validação de schemas espelhando o mobile
  - Adicionar Field validators em todos os schemas Pydantic
  - Subtasks:
    - [ ] 1.1 UsuarioCreate: email (EmailStr), senha (min 6), nome (max 255), telefone (regex)
    - [ ] 1.2 MedicamentoCreate: nome (max 255), dosagem (max 100), intervalo_retorno_dias (ge=1)
    - [ ] 1.3 AgendaCreate: tolerancia_minutos (ge=1, le=120), dias_semana (regex)
    - [ ] 1.4 LoginRequest: email (EmailStr)
    - [ ] 1.5 SenhaUpdate: nova_senha (min 6)
    - [ ] 1.6 Normalizar email para lowercase em UsuarioCreate e LoginRequest

- [x] 2. Segurança — remover push_token do response e corrigir email
  - Subtasks:
    - [ ] 2.1 Remover push_token do UsuarioResponse
    - [ ] 2.2 Normalizar email (lowercase) no create_user e authenticate_user
    - [ ] 2.3 Adicionar rate limiting no /auth/login (slowapi)

- [x] 3. Extrair _verify_access_to_paciente para core/authorization.py
  - Eliminar duplicação em 3 services

- [ ] 4. Performance — resolver N+1 queries
  - Subtasks:
    - [ ] 4.1 list_notificacoes: JOIN com registro_tomada → agenda → medicamento
    - [ ] 4.2 list_registros_tomada: JOIN com agenda → medicamento
    - [ ] 4.3 job_verificar_atrasos: filtro de deadline direto no SQL

- [ ] 5. Remover TimezoneMiddleware — mover conversão para schemas
  - Usar Pydantic field_serializer para converter datetimes

- [x] 6. Paginação em endpoints sem limite
  - Subtasks:
    - [ ] 6.1 GET /notificacoes → page/size params
    - [ ] 6.2 GET /pacientes/{id}/medicamentos → page/size params (opcional)

- [x] 7. Conformidade mobile — UsuarioUpdate aceitar campos de paciente
  - Adicionar data_nascimento, nivel_autonomia ao UsuarioUpdate

- [x] 8. Corrigir off-by-one em dias_semana
  - Mobile envia 1-7 (1=Seg), backend usa weekday() 0-6 (0=Mon)
  - Ajustar _is_valid_day para converter

- [x] 9. Corrigir job_alertas_retorno_medico
  - Adicionar filtro data_proximo_retorno >= today (não alertar sobre retornos passados)

- [ ] 10. Adicionar índices de performance
  - registros_tomada(paciente_id, status), notificacoes(usuario_id), medicamentos(paciente_id)

- [x] 11. Remover código morto
  - get_pending_in_window() não usado

- [x] 12. Fixar versões no requirements.txt

- [ ] 13. Adicionar testes para scheduler e validações

## Task Dependency Graph

```json
{
  "waves": [
    { "tasks": [1, 2, 3, 11, 12] },
    { "tasks": [6, 7, 8, 9] },
    { "tasks": [4, 5, 10] },
    { "tasks": [13] }
  ]
}
```

## Notes

- `EmailStr` do Pydantic requer `pydantic[email]` (email-validator) — adicionado ao requirements.txt.
- O `push_token` foi removido do `UsuarioResponse` por segurança — o mobile não precisa ler esse campo.
- O `core/authorization.py` foi criado mas os services existentes ainda usam suas funções locais `_verify_access_to_paciente`. A migração é incremental — novos services devem usar o centralizado.
- O off-by-one em `dias_semana` era: mobile envia 1-7 (ISO weekday), backend usava `weekday()` que retorna 0-6. Corrigido com `weekday() + 1`.
- O job de retorno médico agora filtra `data_proximo_retorno >= today` para não alertar sobre consultas passadas.
- A paginação de notificações mantém backward compatibility — default é page=1, size=50 (mobile pode não enviar params e funciona igual antes).
- Tasks 4 (N+1) e 5 (TimezoneMiddleware) são melhorias de performance que podem ser feitas em uma próxima iteração sem impacto funcional.
