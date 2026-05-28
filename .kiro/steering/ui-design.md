---
inclusion: fileMatch
fileMatchPattern: "**/mobile/**,**/medalert-mobile/**"
---

# MedAlert Mobile: Design System & UX/UI

## Princípios de design

O sistema de design é orientado por três valores: **Confiabilidade, Segurança e Autonomia**. O estilo é **Corporativo / Moderno** com ênfase em **Minimalismo Funcional**.

Regras inegociáveis que se aplicam a todos os componentes e telas:

- **Utilidade primeiro:** Nenhum elemento decorativo sem função. Se está na tela, serve a algo.
- **Clareza cognitiva:** Ícones são literais e sempre acompanhados de rótulo textual — nunca ícone isolado.
- **Interações tolerantes:** Alvos de toque grandes e atualizações otimistas (optimistic updates) reduzem a ansiedade do usuário.
- **Linguagem:** Português (PT-BR), termos simples e diretos.
- **Status nunca dependem só de cor:** Toda cor de status é acompanhada de texto explicativo (acessibilidade para daltonismo).

## Tokens de cor

Use sempre os tokens abaixo — nunca valores hexadecimais avulsos no código.

### Cores de superfície e estrutura

| Token                        | Valor       | Uso                                         |
|------------------------------|-------------|---------------------------------------------|
| `surface`                    | `#f9f9ff`   | Fundo principal do app                      |
| `surface-container-lowest`   | `#ffffff`   | Cards de conteúdo (flutua sobre o fundo)    |
| `surface-container-low`      | `#f2f3fc`   | Separação de seções, campos de input        |
| `surface-container`          | `#ededf6`   | Containers secundários                      |
| `surface-container-high`     | `#e7e8f0`   | Containers com maior destaque               |
| `surface-container-highest`  | `#e1e2ea`   | Containers de maior contraste               |
| `surface-dim`                | `#d9d9e2`   | Bordas sutis, outline de cards              |
| `on-surface`                 | `#191c21`   | Texto principal sobre superfícies           |
| `on-surface-variant`         | `#424752`   | Texto secundário, metadados                 |
| `outline`                    | `#727784`   | Bordas de campos de input                   |
| `outline-variant`            | `#c2c6d4`   | Bordas sutis de separação                   |
| `background-app`             | `#F8F9FA`   | Fundo da aplicação (alias de `surface`)     |
| `surface-card`               | `#FFFFFF`   | Fundo de cards                              |

### Cores primárias e de ação

| Token                        | Valor       | Uso                                         |
|------------------------------|-------------|---------------------------------------------|
| `primary`                    | `#003f87`   | Marca, headers                              |
| `primary-container`          | `#0056b3`   | Botões de ação principal                    |
| `on-primary`                 | `#ffffff`   | Texto/ícone sobre botão primário            |
| `on-primary-container`       | `#bbd0ff`   | Texto sobre primary-container               |
| `inverse-primary`            | `#acc7ff`   | Uso em superfícies escuras                  |
| `surface-tint`               | `#115cb9`   | Tint de superfícies com destaque de marca   |

### Cores secundárias (sucesso)

| Token                        | Valor       | Uso                                         |
|------------------------------|-------------|---------------------------------------------|
| `secondary`                  | `#006e25`   | Estado CONFIRMADO, conclusão de tarefa      |
| `secondary-container`        | `#80f98b`   | Fundo de badge CONFIRMADO                   |
| `on-secondary`               | `#ffffff`   | Texto sobre secondary                       |
| `on-secondary-container`     | `#007327`   | Texto sobre secondary-container             |

### Cores de status de tomada

Estes tokens mapeiam diretamente os quatro estados de `REGISTRO_TOMADA`:

| Token             | Valor       | Status mapeado | Uso                                             |
|-------------------|-------------|----------------|-------------------------------------------------|
| `status-pending`  | `#0056B3`   | `PENDENTE`     | Borda lateral do card, badge                    |
| `status-confirmed`| `#28A745`   | `CONFIRMADO`   | Borda lateral do card, badge                    |
| `status-delayed`  | `#DC3545`   | `ATRASADO`     | Borda lateral, badge, sombra de alerta crítico  |
| `status-ignored`  | `#6C757D`   | `IGNORADO`     | Borda lateral do card, badge (elemento recuado) |
| `alert-warning`   | `#FD7E14`   | —              | Alertas secundários, urgência próxima           |

### Cores de erro

| Token              | Valor       | Uso                                          |
|--------------------|-------------|----------------------------------------------|
| `error`            | `#ba1a1a`   | Mensagens de erro crítico                    |
| `on-error`         | `#ffffff`   | Texto sobre error                            |
| `error-container`  | `#ffdad6`   | Fundo de container de erro                   |
| `on-error-container`| `#93000a` | Texto sobre error-container                  |

### Regra de adesão e cor

O percentual de adesão abaixo de 80% deve ser exibido com `status-delayed` (`#DC3545`). Acima de 80%, usar `status-confirmed` (`#28A745`).

### Acessibilidade de cores

Todas as combinações de texto sobre cor de fundo devem atingir contraste mínimo de **4.5:1 (WCAG AA)**. Esta regra é obrigatória especialmente nos tokens de status, que são usados como fundo de badges.

## Tipografia

Fonte única: **Plus Jakarta Sans**. Não usar outra fonte.

### Escala tipográfica

| Token         | Tamanho | Peso | Line-height | Letter-spacing | Uso                              |
|---------------|---------|------|-------------|----------------|----------------------------------|
| `headline-lg` | 30px    | 700  | 38px        | -0.5px         | Títulos de impacto               |
| `headline-md` | 24px    | 600  | 32px        | —              | Títulos de seção                 |
| `body-lg`     | 18px    | 400  | 28px        | —              | Nomes de medicamentos, títulos de card |
| `body-md`     | 16px    | 400  | 24px        | —              | Conteúdo principal (mínimo permitido) |
| `label-lg`    | 16px    | 600  | 20px        | 0.5px          | Labels de campos, rótulos de ícones |
| `label-md`    | 14px    | 500  | 18px        | —              | Metadados, informações secundárias |
| `status-tag`  | 14px    | 700  | 16px        | —              | Texto dentro de badges de status |

### Regras inegociáveis de tipografia

- **Tamanho mínimo:** 16px (`body-md`) para qualquer conteúdo funcional. Nenhum texto informativo abaixo disso.
- `label-md` (14px) é permitido apenas para metadados e badges — nunca para conteúdo principal.
- Line-height de body text é 1.5× o tamanho — nunca comprimir.
- Hierarquia via peso: Regular (400) para dados, SemiBold/Bold (600/700) para labels e títulos.

## Espaçamento e layout

Sistema baseado em múltiplos de **8px**, com preferência por incrementos maiores para o público-alvo.

| Token              | Valor | Uso                                                   |
|--------------------|-------|-------------------------------------------------------|
| `touch-target-min` | 48px  | Dimensão mínima de qualquer elemento interativo       |
| `gutter`           | 16px  | Espaço interno entre elementos de um container        |
| `margin-mobile`    | 20px  | Margem lateral das telas                              |
| `stack-gap`        | 12px  | Espaço entre itens empilhados verticalmente           |
| `card-padding`     | 20px  | Padding interno de cards                              |

### Regras de layout

- Conteúdo nunca toca as bordas laterais do dispositivo — margem mínima de `margin-mobile` (20px).
- Incrementos preferidos de espaçamento: 12px, 16px, 24px — evitar valores menores entre zonas interativas.
- Em tablets: layout de múltiplas colunas (ex.: Agenda à esquerda, Detalhe do Medicamento à direita).

## Formas e arredondamentos

| Token     | Valor    | Uso                                          |
|-----------|----------|----------------------------------------------|
| `sm`      | 4px      | Elementos pequenos                           |
| `DEFAULT` | 8px      | Botões e campos de input                     |
| `md`      | 12px     | —                                            |
| `lg`      | 16px     | Cards grandes                                |
| `xl`      | 24px     | Containers de destaque                       |
| `full`    | 9999px   | Pills de status (PENDENTE, CONFIRMADO, etc.) |

## Elevação e profundidade

- Fundo da aplicação: `#F8F9FA` (`background-app`)
- Cards flutuam sobre o fundo com cor `#FFFFFF` (`surface-card`)
- Borda de 1px `#E9ECEF` define os limites dos cards — sem sombras complexas
- Estado pressionado: shift tonal (escurecimento leve) — não usar shadow lift
- **Exceção:** Cards com status `ATRASADO` podem usar sombra suave com tint de `status-delayed` (`#DC3545`) para atrair atenção imediata

## Componentes

### Botão primário

- Fundo: `primary-container` (`#0056b3`)
- Texto: `on-primary` (`#ffffff`), `label-lg`
- Border-radius: `DEFAULT` (8px)
- Altura mínima: 48px (respeita `touch-target-min`)
- Deve ser o elemento mais proeminente da tela quando presente

### Botão secundário / Ghost

- Borda: 2px sólida com cor `primary-container`
- Texto: `primary-container`
- Border-radius: `DEFAULT` (8px)
- Altura mínima: 48px
- Uso: ações menos críticas (ex.: "Ver detalhes")

### RegistroTomadaCard

Estrutura do card de registro de tomada — componente central do app:

```
┌─ [barra lateral 4px cor de status] ──────────────────────────────┐
│  [Nome do medicamento]          body-lg / on-surface              │
│  [Dosagem]                      body-md / on-surface-variant      │
│  [Horário previsto]             label-lg / on-surface             │
│  [Instrução de uso]             body-md / on-surface-variant      │
│                         [Badge de status pill]                    │
│                         [Botão "Confirmar" — se PENDENTE/ATRASADO]│
└───────────────────────────────────────────────────────────────────┘
```

- Border-radius do card: `lg` (16px)
- Padding interno: `card-padding` (20px)
- Barra lateral: 4px de largura, altura total do card, cor do token de status correspondente
- Badge de status: pill (`full` = 9999px), texto `status-tag`, fundo = token de status + transparência
- Botão "Confirmar": botão primário completo, visível apenas para `PENDENTE` e `ATRASADO`
- Card `ATRASADO`: sombra suave com tint `#DC3545`
- Card `IGNORADO`: elementos visuais recuados com `status-ignored` (`#6C757D`)

### Campos de input

- Label sempre visível acima do campo — nunca floating label que desaparece
- Borda em repouso: 1px `outline` (`#727784`)
- Borda em foco: 2px `primary-container` (`#0056b3`)
- Fundo: `surface-container-low` (`#f2f3fc`)
- Border-radius: `DEFAULT` (8px)
- Altura mínima: 48px

### Badges de status (Pills)

| Status       | Fundo             | Texto                  | Token de texto     |
|--------------|-------------------|------------------------|--------------------|
| `PENDENTE`   | `status-pending`  | "Pendente"             | `#ffffff`          |
| `CONFIRMADO` | `status-confirmed`| "Confirmado"           | `#ffffff`          |
| `ATRASADO`   | `status-delayed`  | "Atrasado"             | `#ffffff`          |
| `IGNORADO`   | `status-ignored`  | "Ignorado"             | `#ffffff`          |

- Border-radius: `full` (9999px)
- Tipografia: `status-tag` (14px / 700)
- Padding horizontal: 12px; padding vertical: 4px

### Controles de seleção (Checkbox / Radio)

- Diâmetro mínimo do controle visual: 24px
- Área de toque (touch container): mínimo 48px × 48px
- Não reduzir abaixo desses valores em nenhuma circunstância

### Iconografia

| Ícone       | Uso                                          |
|-------------|----------------------------------------------|
| Sino (Bell) | Lembretes (`LEMBRETE`)                       |
| Alerta (!)  | Tomada atrasada, falhas (`FALHA_TOMADA`)     |
| Calendário  | Retorno médico, datas de tratamento          |

**Regra:** Todo ícone é sempre acompanhado de rótulo textual (`label-lg` ou `label-md`). Ícone sem label é proibido.

### TopAppBar

- Fundo: `surface` (`#f9f9ff`)
- Logo "MedAlert" à esquerda
- Ícone de perfil/avatar e configurações à direita

### BottomNavBar

Tabs da barra de navegação inferior (nomes e ordem fixos):

| Posição | Label      | Ícone sugerido | Disponível para          |
|---------|------------|----------------|--------------------------|
| 1       | Agenda     | Calendário     | Paciente, Cuidador       |
| 2       | Remédios   | Pílula         | Responsável              |
| 3       | Histórico  | Gráfico        | Todos                    |
| 4       | Alertas    | Sino           | Todos                    |
| 5       | Perfil     | Pessoa         | Todos                    |

- Tab "Remédios" exibida apenas para `RESPONSAVEL`
- Tab "Agenda" exibida apenas para `PACIENTE` e `CUIDADOR`
- Ícone de badge numérico na tab "Alertas" quando houver notificações não lidas

## Regras de acessibilidade (não negociáveis)

1. **Tamanho mínimo de toque:** 48×48dp em todos os elementos interativos
2. **Fonte mínima:** 16px para qualquer conteúdo funcional
3. **Contraste:** WCAG AA (4.5:1) em todos os estados de cor
4. **Status com redundância:** Cor de status sempre acompanhada de texto — nunca cor isolada
5. **Ícone com label:** Ícone sem rótulo textual é proibido
6. **Whitespace generoso:** Espaçamento entre zonas interativas nunca menor que `stack-gap` (12px)
7. **`accessibilityLabel`** obrigatório em todos os elementos interativos do React Native
