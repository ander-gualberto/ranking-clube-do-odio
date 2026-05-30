# AUDITORIA MOBILE-FIRST — RANKING CLUBE DO ÓDIO

> Auditoria visual do estado atual do ranking público no contexto mobile.
> Realizada na Fase 7A. Nenhuma alteração de CSS neste documento — apenas diagnóstico.

Referência de telas mobile avaliadas:
- iPhone SE (375 × 667px) — menor iPhone relevante
- iPhone 14 (390 × 844px) — padrão atual
- Android médio (412 × 915px) — Samsung Galaxy A

---

## 1. Header com logo

**CSS atual:**
- Desktop: logo `height: 60px`, brand-label `26px`, page-title `11px`
- Mobile 600px: logo `height: 48px`, brand-label `20px`
- Mobile 360px: logo `height: 40px`, brand-label `17px`

| Critério | Status | Detalhe |
|---|---|---|
| Logo aparece? | ✅ Bom | `logo-tigre.png` referenciada corretamente |
| Logo distorce? | ✅ Bom | `object-fit: contain`, sem distorção |
| Altura do header | ✅ Bom | Padding reduzido no mobile (32px 0 24px) |
| Marca d'água | ✅ Bom | `opacity: 0.04`, não interfere com leitura |
| Contraste do brand-label | ✅ Bom | #ffffff em fundo dark |
| Contraste do page-title | ✅ Bom | var(--text-muted) — discreto mas legível |
| Header não ocupa excesso | ✅ Bom | Logo + texto + update-label dentro de limites razoáveis |

**Risco identificado:** Em iPhone SE (375px), com logo de 48px + brand-label 20px + subtítulo + live-dot, o header pode chegar a ~160–180px de altura. Não é um problema funcional, mas pode reduzir a área útil para o ranking em telas muito pequenas.

**Recomendação:** Manter. Aceitável para a identidade de marca.

---

## 2. Pódio (Top 3)

**CSS atual (mobile):**
- `grid-template-columns: 1fr` — coluna única
- Ordem: 1º, 2º, 3º (linear, não olímpica)
- Layout horizontal por card: `56px | nome | pontos`
- Borda lateral colorida substituindo borda topo

| Critério | Status | Detalhe |
|---|---|---|
| Legibilidade | ✅ Bom | Fonte 12px nome, 24–26px pontos |
| Ocupa muito espaço? | ✅ Bom | Cards compactos no mobile |
| Contraste top 1 | ✅ Bom | Borda dourada + background gold-bg |
| Nome grande? | ⚠️ Risco leve | Nomes longos truncados? Não há `text-overflow: ellipsis` explícito no `.podium-name` mobile |
| Tag CAMPEÃO | ✅ Bom | Oculta no mobile (`display: none`) — correto |

**Risco identificado:** Nomes muito longos no pódio mobile podem quebrar o layout horizontal (grid `56px 1fr auto`). A coluna `1fr` deve absolver o nome, mas vale validar com nomes longos reais.

**Recomendação:** Adicionar `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` ao `.podium-name` no breakpoint mobile quando for oportunidade de manutenção.

---

## 3. Cards de stats (Membros / Respostas / Média / Líder)

**CSS atual (mobile):**
- `grid-template-columns: repeat(2, 1fr)` — grid 2×2
- stat-valor: `22px`
- stat-lider-nome: `15px`

| Critério | Status | Detalhe |
|---|---|---|
| Grid 2x2 funciona? | ✅ Bom | Adequado para 4 cards |
| Números legíveis | ✅ Bom | 22px suficiente |
| Líder com nome longo | ✅ Bom | `text-overflow: ellipsis` já implementado |
| Contraste | ✅ Bom | Branco em fundo dark |
| Hover desabilitado | ✅ Bom | `transform: none` no touch |

**Recomendação:** Manter. Sem riscos.

---

## 4. Destaques da Temporada

**CSS atual (mobile):**
- `grid-template-columns: 1fr` — coluna única
- Cards compactos: padding 14px 16px

| Critério | Status | Detalhe |
|---|---|---|
| Legibilidade | ✅ Bom | Nomes 13px, valores 20px |
| Espaço vertical | ⚠️ Risco leve | 3 cards empilhados podem ser longos em telas pequenas |
| Contraste das cores | ✅ Bom | Ouro, azul, prata com contraste adequado |
| Excesso visual | ✅ Bom | Sem poluição |

**Recomendação:** Manter. O scrolling natural resolve o empilhamento.

---

## 5. Hall da Fama

**CSS atual (mobile):**
- `grid-template-columns: 1fr` — coluna única
- Layout horizontal por card: ícone + conteúdo lado a lado
- Badge de conquista oculta no mobile

| Critério | Status | Detalhe |
|---|---|---|
| Legibilidade | ✅ Bom | Nome 15px, valor 12px |
| Layout horizontal | ✅ Bom | Ícone 24px + texto, compacto |
| Contraste das cores | ✅ Bom | Ouro, prata, laranja, verde distinguíveis |
| Excesso visual | ✅ Bom | Badge de rodapé oculta — decisão correta para mobile |
| Dado derivado vs. real | ⚠️ Atenção | Atualmente simulado — não é histórico real |

**Recomendação:** Manter o CSS atual. O dado exibido mudará quando Fase 7B for implementada.

---

## 6. Tabela de Classificação

**CSS atual (mobile):**
- Colunas `RESPOSTAS` e `MÉDIA` ocultas
- Exibe: posição (com indicador de movimento) | nome | pontos
- Padding reduzido: 11px 12px

| Critério | Status | Detalhe |
|---|---|---|
| Colunas essenciais visíveis | ✅ Bom | Posição + nome + pontos suficientes |
| Nome trunca? | ✅ Bom | Sem overflow explicit mas a célula `1fr` comporta |
| Tag LÍDER | ✅ Bom | Reduzida para 6px e padding menor |
| Indicador de movimento | ✅ Bom | ▲▼•+ em 10px, centralizado |
| Clique em linha abre modal | ✅ Bom | Event listener no tbody |
| Fontes legíveis | ✅ Bom | 13px nas células, adequado |

**Risco identificado:** Em iPhone SE com nome muito longo, o nome pode empurrar a coluna de pontos para largura mínima. Considerar `max-width` no `.col-pts` no futuro.

**Recomendação:** Manter. Sem urgência de correção.

---

## 7. Modal de Perfil

**CSS atual (mobile, max-width 600px):**
- Overlay: padding 12px
- Avatar: 44px
- Nome: 17px
- Badge de posição: 40px
- Stats: padding 16px, valor 24px
- Badges de conquista: 10px, padding 7px 10px

| Critério | Status | Detalhe |
|---|---|---|
| Cabe na tela? | ✅ Bom | Overflow-y: auto no overlay |
| Avatar legível | ✅ Bom | 44px com iniciais |
| Nome longo | ⚠️ Risco leve | `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` presente — OK |
| Stats 2x2 | ✅ Bom | Compacto no mobile |
| Barra de progresso | ✅ Bom | Funciona em qualquer largura |
| Badges empilham? | ✅ Bom | `flex-wrap: wrap` |
| Botão Compartilhar | ✅ Bom | Largura 100%, padding 11px — adequado para touch |
| Fecha com ESC | ✅ Bom | Implementado |
| Fecha ao clicar fora | ✅ Bom | Implementado |

**Risco identificado:** Em iPhone SE (375px), um membro com muitas badges pode fazer o modal scroll muito para baixo. Não é crítico — scroll é esperado.

**Recomendação:** Manter. Funcionalmente correto.

---

## 8. Poster Social (Share Card)

**Estrutura atual:** overlay fullscreen com `.share-card` centralizado.

**CSS atual (mobile, max-width 600px):**
- share-overlay: padding ajustado
- share-close: 36px, top/right 12px
- Avatar: 64px
- Nome: 18px
- Stats 3 colunas com dividers

> ⚠️ **Nota de auditoria:** Os arquivos de Fase 3.2 (poster redesenhado como `.poster-card`)
> podem não estar aplicados nesta versão dos arquivos. O CSS atual ainda referencia `.share-card`.
> Verificar o estado antes de publicar nova versão.

| Critério | Status | Detalhe |
|---|---|---|
| Fullscreen? | ✅ Bom | `position: fixed; inset: 0` |
| Card centralizado | ✅ Bom | Flex center |
| Fecha com X | ✅ Bom | Botão fixo no canto |
| Fecha clicando fora | ✅ Bom | Listener no overlay |
| Fecha com ESC | ✅ Bom | Listener de keydown |
| Nome cabe? | ✅ Bom | `-webkit-line-clamp: 2` |
| Stats legíveis | ✅ Bom | 19px+ nos valores |
| Instrução "tire um print" | ✅ Bom | Texto visível abaixo do card |
| Web Share API | ✅ Bom | Botão aparece quando API disponível (mobile) |

**Recomendação:** Verificar se Fase 3.2 está aplicada antes de próxima publicação.

---

## Resumo executivo

| Seção | Status geral | Prioridade de ajuste |
|---|---|---|
| Header + logo | ✅ Bom | Baixa |
| Pódio | ✅ Bom (risco leve nomes longos) | Baixa |
| Cards de stats | ✅ Bom | Nenhuma |
| Destaques | ✅ Bom | Nenhuma |
| Hall da Fama | ✅ Bom (dado simulado) | Aguardar Fase 7B |
| Tabela | ✅ Bom | Baixa |
| Modal | ✅ Bom | Baixa |
| Poster social | ⚠️ Verificar versão | Verificar Fase 3.2 |

**Conclusão:** O ranking está em bom estado mobile. Nenhum bloqueio crítico de contraste, legibilidade ou layout. Os ajustes identificados são de refinamento, não de urgência.

---

*Auditoria realizada na Fase 7A — Clube do Ódio*
