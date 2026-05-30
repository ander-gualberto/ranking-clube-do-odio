# HISTORICO CDO — ARQUITETURA DO SISTEMA DE MEMÓRIA HISTÓRICA

> Documento de referência operacional — Clube do Ódio
> Criado: Fase 7A | Não alterar sem revisão do responsável

---

## 1. Estado atual do sistema

O frontend do ranking lê **uma única aba pública** do Google Sheets via endpoint CSV:

```
Sheet ID : 1pTjLgnEa52uS4ek4DjFHWQuV8vNgvo-rKrxJcOPnEEk
Aba      : Ranking
Endpoint : /gviz/tq?tqx=out:csv&sheet=Ranking
Refresh  : automático a cada 5 minutos
```

Toda a lógica roda **100% no navegador** (HTML + CSS + JS vanilla). Não há backend, não há escrita em banco, não há automação ativa.

---

## 2. O que já existe e funciona

| Componente | Status | Como funciona |
|---|---|---|
| Tabela de ranking | ✅ Produção | Lê coluna POSIÇÃO, NOME, RESPOSTAS, PONTOS, MÉDIA da aba `Ranking` |
| Pódio Top 3 | ✅ Produção | Derivado das 3 primeiras linhas de `rankingData` |
| Cards de stats | ✅ Produção | Totaliza membros, respostas, média, líder em tempo real |
| Destaques da temporada | ✅ Produção | Deriva maior pontuação, melhor média, maior participação da aba atual |
| Hall da Fama visual | ✅ Produção (⚠️ SIMULADO) | Deriva 4 categorias da temporada atual — NÃO é histórico real |
| Modal de perfil | ✅ Produção | Abre ao clicar membro; mostra nível, badges, progresso |
| Poster social | ✅ Produção | Overlay fullscreen para screenshot |
| Badges automáticas | ✅ Produção | Geradas em runtime por regras de posição/média/respostas |
| Níveis de progressão | ✅ Produção | RECRUTA→SOLDADO→EXECUTOR→ELITE→DOMINANTE por pontos totais |
| Movimento de ranking | ✅ Produção | Compara posição atual com snapshot salvo no localStorage |
| Temporada atual | ✅ Produção | Derivada do mês/ano do relógio do navegador |
| Branding / Logo | ✅ Produção | `logo-tigre.png` no header |

---

## 3. O que ainda é simulado ou derivado (não é histórico real)

| Dado | Como funciona hoje | O que deveria ser |
|---|---|---|
| **Hall da Fama** — Maior Pontuação | Líder da temporada ATUAL | Maior pontuação de todas as temporadas |
| **Hall da Fama** — Maior Consistência | Melhor média da temporada ATUAL | Melhor média acumulada histórica |
| **Hall da Fama** — Mais Temporadas | Maior RESPOSTAS da temporada atual | Número real de temporadas participadas |
| **Hall da Fama** — Maior Evolução | Melhor média com ≥2 respostas na temporada atual | Maior evolução entre temporadas consecutivas |
| **Streak** | Inexistente | Sequência de temporadas ativas sem ausência |
| **Título de Campeão** | Exibido só enquanto está em #1 | Contagem permanente de temporadas vencidas |
| **Status operacional** | Regras estáticas por posição/média | Calculado sobre histórico real |
| **Temporada atual** | `new Date()` do navegador | Nome oficial definido na planilha `TEMPORADAS` |

---

## 4. O que deve virar histórico real (futuramente)

Prioridade decrescente:

1. **Hall da Fama real** → ler aba `HALL_DA_FAMA` em vez de derivar
2. **Streak real** → ler aba `STREAKS` e exibir no modal e poster
3. **Temporadas anteriores** → ler `HISTORICO_TEMPORADAS` para perfil histórico
4. **Contagem de títulos** → quantas vezes o membro foi campeão
5. **Nome oficial da temporada** → ler aba `TEMPORADAS` em vez de usar `new Date()`

---

## 5. Abas necessárias na planilha

Todas já criadas. Estrutura oficial abaixo.

### 5.1 `HISTORICO_TEMPORADAS`

Snapshot permanente de cada temporada encerrada.

```
TEMPORADA        | texto     | Ex: MAIO_2026
CODIGO_MEMBRO    | texto     | Identificador permanente (nunca muda)
NOME             | texto     | Nome de exibição (pode mudar — não usar como chave)
POSIÇÃO          | número    | Posição final na temporada
RESPOSTAS        | número    | Total de respostas na temporada
PONTOS           | decimal   | Pontos totais da temporada
MÉDIA            | decimal   | Média da temporada
NIVEL            | texto     | Nível atingido (RECRUTA..DOMINANTE)
STATUS_FINAL     | texto     | ATIVO / INATIVO / AUSENTE
BADGES           | texto     | Lista separada por | das badges ganhas
DATA_SNAPSHOT    | data      | Data do fechamento (YYYY-MM-DD)
```

**Regra:** nunca deletar linhas desta aba. Apenas acrescentar.

### 5.2 `STREAKS`

Estado atual de streaks de cada membro.

```
CODIGO_MEMBRO     | texto   | Chave permanente
NOME              | texto   | Exibição atual
STREAK_ATUAL      | número  | Temporadas consecutivas ativas
MAIOR_STREAK      | número  | Recorde histórico de streak
TEMPORADAS_ATIVAS | número  | Total de temporadas que participou
TOP10_SEGUIDOS    | número  | Quantas vezes ficou no Top 10 em sequência
ULTIMA_TEMPORADA  | texto   | Ex: MAIO_2026
```

### 5.3 `TEMPORADAS`

Registro mestre de todas as temporadas.

```
TEMPORADA        | texto  | Ex: MAIO_2026 (identificador único)
STATUS           | texto  | ATIVA / ENCERRADA / PLANEJADA
INÍCIO           | data   | Primeiro dia da temporada
FIM              | data   | Último dia da temporada
DATA_FECHAMENTO  | data   | Quando o snapshot foi feito
OBSERVAÇÃO       | texto  | Notas livres
```

### 5.4 `HALL_DA_FAMA`

Recordes históricos por categoria.

```
CATEGORIA   | texto  | Ex: MAIOR_PONTUACAO, MAIOR_STREAK, MAIS_TITULOS
MEMBRO      | texto  | Nome do detentor do recorde
VALOR       | texto  | Valor do recorde (ex: "42 pts", "5 temporadas")
TEMPORADA   | texto  | Quando o recorde foi estabelecido
OBSERVAÇÃO  | texto  | Notas livres
```

### 5.5 `CHECKLIST_FECHAMENTO`

Controle operacional do fechamento mensal.

```
ETAPA          | texto  | Nome da etapa
STATUS         | texto  | PENDENTE / FEITO / IGNORADO
RESPONSÁVEL    | texto  | Nome do responsável
DATA           | data   | Data de execução
OBSERVAÇÃO     | texto  | Notas
```

---

## 6. Identificador permanente: CODIGO_MEMBRO

- **CODIGO_MEMBRO** é a chave que nunca muda.
- **NOME** é apenas exibição e pode mudar.
- Todo cruzamento histórico deve usar `CODIGO_MEMBRO`.
- A aba `Ranking` atual **não tem esta coluna** — será necessário adicioná-la quando o histórico for real.
- Enquanto não houver `CODIGO_MEMBRO` na aba pública, o frontend usa `NOME` como chave aproximada (risco de inconsistência se o nome mudar).

---

## 7. Fluxo mensal de fechamento

```
[FIM DA TEMPORADA]
        ↓
1. Verificar ranking final na aba Ranking
2. Validar dados (posição, pontos, respostas, média)
3. Fazer snapshot manual em HISTORICO_TEMPORADAS
4. Registrar temporada encerrada em TEMPORADAS
5. Atualizar STREAKS de cada membro
6. Atualizar HALL_DA_FAMA se houver novo recorde
7. Preencher CHECKLIST_FECHAMENTO
8. Resetar ou virar aba Ranking para nova temporada
        ↓
[INICIO DA NOVA TEMPORADA]
```

Este processo deve ser **manual e auditado** até que haja confiança suficiente para assistência automatizada.

---

## 8. Riscos de automatizar cedo

| Risco | Descrição | Impacto |
|---|---|---|
| **Snapshot errado** | Se a automação rodar antes do fechamento oficial, captura dados parciais | Alto — contamina o histórico |
| **CODIGO_MEMBRO ausente** | A aba atual não tem esta coluna; automação usaria NOME e poderia misturar membros com nomes similares | Alto |
| **Sobrescrita acidental** | Apps Script sem revisão pode sobrescrever linhas de HISTORICO_TEMPORADAS | Crítico — dados históricos são irreversíveis |
| **Streak errado** | Se uma temporada for omitida ou contada em dobro, o streak quebra silenciosamente | Médio |
| **Mudança de nome** | Membro que muda nome entre temporadas aparece como membro diferente | Médio |
| **Planilha fora do ar** | Aba pública com erro → frontend trava em estado de loading | Baixo (já tratado com error state) |

---

## 9. Recomendação: manual assistido primeiro

**Não automatizar o fechamento nas primeiras 3–5 temporadas.**

Fazer manualmente:
1. Responsável confere o ranking final.
2. Copia dados para `HISTORICO_TEMPORADAS` linha a linha.
3. Preenche `STREAKS` e `HALL_DA_FAMA` com revisão visual.
4. Marca `CHECKLIST_FECHAMENTO`.

Só após 3 fechamentos manuais validados, considerar assistência via fórmulas do Sheets ou Apps Script **somente para leitura/cálculo**, nunca para escrita automática sem validação.

---

## 10. Caminho futuro para automação segura

```
Fase 7A (atual):  Documentação e arquitetura
Fase 7B:          Frontend lê HALL_DA_FAMA real (leitura pública)
Fase 7C:          Frontend lê HISTORICO_TEMPORADAS (perfis históricos)
Fase 7D:          Apps Script para cálculo de STREAKS (assistido, revisado)
Fase 7E:          Apps Script de fechamento com dupla validação humana
```

Nunca pular fases. A confiança no histórico é o ativo mais valioso do sistema.

---

*Última atualização: Fase 7A — Clube do Ódio*
