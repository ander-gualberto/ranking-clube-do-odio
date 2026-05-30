# ROADMAP — HISTÓRICO NO FRONTEND DO CLUBE DO ÓDIO

> Plano de evolução do ranking público para suporte a dados históricos reais.
> Nenhuma fase deve ser pulada. Cada fase depende da anterior estar estável.

---

## Estado atual (pós-Fase 6)

O frontend busca **uma aba pública** (`Ranking`) via CSV do Google Sheets.
Toda a exibição histórica é **simulada ou derivada** da temporada atual.
Não há leitura de histórico real. Não há backend. Não há escrita automática.

Publicado via **GitHub + Vercel** com deploy automático no push para `main`.

---

## Fase 7B — Hall da Fama Real

**Objetivo:** substituir o Hall da Fama simulado pelo conteúdo real da aba `HALL_DA_FAMA`.

**Pré-requisito:** pelo menos 1 temporada fechada com `HALL_DA_FAMA` preenchido manualmente.

### O que muda no frontend

- Adicionar segunda `DATA_URL` apontando para a aba `HALL_DA_FAMA` (pública)
- A aba precisa ter permissão de leitura pública (mesmo regime da aba `Ranking`)
- Substituir `buildHallConfig(data)` por `fetchHallOfFame()` que lê os dados reais
- Manter fallback para os dados derivados caso a aba esteja vazia ou inacessível

### Colunas esperadas da aba `HALL_DA_FAMA`

```
CATEGORIA | MEMBRO | VALOR | TEMPORADA | OBSERVAÇÃO
```

### Impacto

| Componente | Impacto |
|---|---|
| `buildHallConfig()` | Substituída por fetch assíncrono |
| `renderHallOfFame()` | Mínimo — recebe array com mesmo formato |
| CSS do Hall da Fama | Nenhum |
| Modal / Poster / Tabela | Nenhum |

### Riscos

- Aba `HALL_DA_FAMA` vazia → exibir fallback derivado (não quebrar)
- Aba com colunas erradas → log de erro, manter comportamento atual
- Latência de segundo fetch → mostrar Hall da Fama depois, não bloquear o ranking

---

## Fase 7C — Perfis Históricos

**Objetivo:** exibir o histórico do membro no modal de perfil (temporadas anteriores, streak, títulos).

**Pré-requisito:** Fase 7B concluída. Pelo menos 2 temporadas em `HISTORICO_TEMPORADAS`.

### O que muda no frontend

- Novo fetch público para aba `HISTORICO_TEMPORADAS`
- Novo fetch público para aba `STREAKS`
- Modal de perfil ganha nova seção: "Histórico do Membro"
  - Número de temporadas participadas
  - Streak atual e maior streak
  - Quantidade de vezes campeão
  - Evolução de pontos entre temporadas (gráfico simples ou lista)
- Poster social pode incluir streak e total de temporadas

### Colunas usadas do `HISTORICO_TEMPORADAS`

```
TEMPORADA | CODIGO_MEMBRO | NOME | POSIÇÃO | PONTOS | MÉDIA | NIVEL | BADGES
```

### Colunas usadas do `STREAKS`

```
CODIGO_MEMBRO | STREAK_ATUAL | MAIOR_STREAK | TEMPORADAS_ATIVAS
```

### Problema crítico: CODIGO_MEMBRO

A aba `Ranking` atual **não tem `CODIGO_MEMBRO`**. O frontend usa `NOME` como chave.
Para cruzar `Ranking` com `HISTORICO_TEMPORADAS`, é necessário:

**Opção A (recomendada):** Adicionar `CODIGO_MEMBRO` à aba `Ranking` pública.
  - Frontend usa `CODIGO_MEMBRO` como chave de busca no histórico
  - NOME pode mudar sem quebrar o cruzamento

**Opção B (transitória):** Usar `NOME` como chave com tratamento de variações.
  - Risco: nome com acento diferente, espaço extra, apelido → não encontrado
  - Só usar se a Opção A não for possível no curto prazo

### Impacto

| Componente | Impacto |
|---|---|
| `openModal()` | Nova seção histórica |
| `openShareCard()` | Streak e contagem de temporadas |
| `loadRanking()` | Dois fetches adicionais (histórico + streaks) |
| CSS modal | Nova seção visual |
| CSS poster | Pequena adição |

### Riscos

- Histórico muito longo → limitar exibição às últimas 6 temporadas
- CODIGO_MEMBRO ausente → fallback por NOME com alerta interno
- Membro novo (sem histórico) → exibir "Primeira temporada"

---

## Fase 7D — Automação Segura

**Objetivo:** reduzir trabalho manual do fechamento com assistência automatizada.

**Pré-requisito:** Fases 7B e 7C funcionando. Pelo menos 3 fechamentos manuais validados.

### O que pode ser automatizado com segurança

| Tarefa | Ferramenta | Quando |
|---|---|---|
| Calcular `STREAK_ATUAL` e `MAIOR_STREAK` | Fórmulas Google Sheets | Após preenchimento manual de `HISTORICO_TEMPORADAS` |
| Calcular total de temporadas | Fórmula COUNTIF | Imediato |
| Sugerir entrada para `HALL_DA_FAMA` | Apps Script (leitura + log) | Após 3 fechamentos validados |
| Snapshot automático | Apps Script com gatilho de data | **Somente após revisão humana obrigatória** |

### O que NUNCA deve ser automatizado sem supervisão

- Escrita em `HISTORICO_TEMPORADAS` sem revisão humana
- Remoção ou edição de linhas históricas
- Reset da aba `Ranking` para nova temporada
- Publicação de resultados sem validação do responsável

### Arquitetura recomendada para Apps Script (quando chegar a hora)

```
Trigger: manual (botão) ou agendado com janela de confirmação
Fluxo:
  1. Script lê aba Ranking (ativa)
  2. Gera preview do snapshot em aba temporária
  3. Responsável revisa preview
  4. Responsável confirma via botão
  5. Script escreve em HISTORICO_TEMPORADAS
  6. Script atualiza STREAKS via fórmulas
  7. Script marca CHECKLIST_FECHAMENTO
```

Nunca automatizar os passos 4 e 5 sem intervenção humana.

---

## Princípios que guiam o roadmap

1. **Dados históricos são permanentes.** Erro no histórico é mais grave que ausência de funcionalidade.
2. **Manual primeiro, automação depois.** Entender o processo antes de codificá-lo.
3. **Nunca pular fases.** Cada fase garante estabilidade para a próxima.
4. **Fallback sempre.** Se dados históricos falharem, o ranking atual continua funcionando.
5. **CODIGO_MEMBRO é a chave.** NOME é exibição. Esta distinção deve ser implementada antes da Fase 7C.

---

*Roadmap criado na Fase 7A — Clube do Ódio*
