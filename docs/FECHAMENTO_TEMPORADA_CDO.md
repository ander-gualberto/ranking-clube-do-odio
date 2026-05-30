# FECHAMENTO DE TEMPORADA — CLUBE DO ÓDIO

> Protocolo operacional mensal
> Executar com atenção. Dados históricos são permanentes.

---

## Padrão de nome de temporada

```
FORMATO : MES_ANO  (tudo maiúsculo, underscore)
EXEMPLO : MAIO_2026
          JUNHO_2026
          JANEIRO_2027
```

**Não usar**: maio-2026, Maio 2026, 05_2026, T1_2026 ou qualquer variação.
O nome deve ser único e consistente em todas as abas.

---

## Checklist de fechamento

### PRÉ-FECHAMENTO — Conferência dos dados

- [ ] **1. Confirmar que a temporada encerrou**
  - A data de encerramento foi atingida?
  - Todas as respostas foram registradas?
  - Não há respostas pendentes de validação?

- [ ] **2. Verificar o ranking final**
  - Abrir aba `Ranking` no Google Sheets
  - Conferir se as posições estão corretas
  - Conferir se não há linhas duplicadas ou em branco
  - Conferir se `PONTOS` e `MÉDIA` estão calculados corretamente

- [ ] **3. Validar o Top 3**
  - 1º lugar: nome, pontos e média confirmados?
  - 2º lugar: idem
  - 3º lugar: idem
  - Há empate que precise ser desempatado?

- [ ] **4. Validar dados gerais**
  - Número de membros participantes confere?
  - Total de respostas confere com o registro manual?
  - Nenhum membro com dados zerados indevidamente?

---

### SNAPSHOT — Registro permanente

- [ ] **5. Congelar snapshot em HISTORICO_TEMPORADAS**
  - Copiar TODOS os membros da temporada para a aba `HISTORICO_TEMPORADAS`
  - Preencher todas as colunas:
    - `TEMPORADA`: ex. `MAIO_2026`
    - `CODIGO_MEMBRO`: identificador permanente do membro
    - `NOME`: nome atual de exibição
    - `POSIÇÃO`, `RESPOSTAS`, `PONTOS`, `MÉDIA`: valores finais
    - `NIVEL`: nível atingido baseado nos pontos (RECRUTA..DOMINANTE)
    - `STATUS_FINAL`: ATIVO (participou) / AUSENTE (não participou)
    - `BADGES`: badges ganhas na temporada (separadas por `|`)
    - `DATA_SNAPSHOT`: data de hoje no formato YYYY-MM-DD

  > ⚠️ **NUNCA deletar linhas de HISTORICO_TEMPORADAS.**
  > Apenas acrescentar novas linhas. O histórico é sagrado.

- [ ] **6. Registrar temporada em TEMPORADAS**
  - Adicionar linha na aba `TEMPORADAS`:
    - `TEMPORADA`: nome oficial (ex. `MAIO_2026`)
    - `STATUS`: mudar de `ATIVA` para `ENCERRADA`
    - `FIM`: data do último dia da temporada
    - `DATA_FECHAMENTO`: data de hoje
    - `OBSERVAÇÃO`: qualquer nota relevante

---

### PÓS-SNAPSHOT — Atualizar memória histórica

- [ ] **7. Atualizar STREAKS**
  - Para cada membro:
    - Se participou: `STREAK_ATUAL += 1`
    - Se não participou: `STREAK_ATUAL = 0`
    - `MAIOR_STREAK`: atualizar se `STREAK_ATUAL > MAIOR_STREAK`
    - `TEMPORADAS_ATIVAS`: incrementar para quem participou
    - `ULTIMA_TEMPORADA`: atualizar para o nome desta temporada
  - Conferir manualmente ao menos o Top 5 e casos especiais

- [ ] **8. Atualizar HALL_DA_FAMA**
  - Verificar cada categoria:
    - **MAIOR PONTUAÇÃO**: o campeão desta temporada supera o recorde histórico?
    - **MAIOR CONSISTÊNCIA**: a média mais alta desta temporada supera o histórico?
    - **MAIS TEMPORADAS**: algum membro chegou a um número recorde de participações?
    - **MAIOR EVOLUÇÃO**: houve caso especial de evolução notável?
  - Adicionar linha SOMENTE se houver novo recorde ou evento relevante
  - Não remover registros anteriores

---

### VALIDAÇÃO FINAL

- [ ] **9. Validar o histórico registrado**
  - Abrir `HISTORICO_TEMPORADAS` e confirmar que as linhas da temporada estão corretas
  - Abrir `STREAKS` e conferir ao menos 3 membros aleatórios
  - Conferir `HALL_DA_FAMA` — nenhuma linha faltando?
  - O frontend ainda carrega corretamente? (testar no navegador)

- [ ] **10. Preencher CHECKLIST_FECHAMENTO**
  - Registrar cada etapa com status FEITO
  - Registrar data e responsável
  - Registrar qualquer anomalia encontrada em OBSERVAÇÃO

---

### NOVA TEMPORADA

- [ ] **11. Liberar nova temporada**
  - Adicionar linha em `TEMPORADAS` com a nova temporada (STATUS: ATIVA)
  - Limpar ou resetar a aba `Ranking` conforme o fluxo do grupo
  - Confirmar que o frontend exibe o nome correto da nova temporada
  - Comunicar o grupo

---

## O que NÃO fazer durante o fechamento

| ❌ Não fazer | Por quê |
|---|---|
| Deletar linhas de `HISTORICO_TEMPORADAS` | Dados históricos são permanentes e irreversíveis |
| Editar dados de temporadas já fechadas | Contamina o histórico |
| Fazer snapshot antes do encerramento oficial | Captura dados incompletos |
| Usar automação não validada para escrever | Risco de sobrescrita silenciosa |
| Renomear membros sem atualizar o `CODIGO_MEMBRO` | Quebra o cruzamento histórico |
| Pular o preenchimento de `STREAKS` | Volta a ser necessário recalcular tudo depois |
| Fechar sem conferência visual | Dados errados entram no histórico |

---

## Riscos conhecidos

| Risco | Como mitigar |
|---|---|
| Empate de pontos no encerramento | Definir critério de desempate ANTES do fim da temporada |
| Membro ausente vs. inativo | Usar `STATUS_FINAL: AUSENTE` para quem não participou |
| Nome de membro mudou | Usar sempre `CODIGO_MEMBRO` como chave; registrar o nome da época |
| Erro de digitação no snapshot | Revisar com duas pessoas antes de finalizar |
| Temporada encerrada mas Ranking ainda aberto | Congelar a aba antes de copiar o snapshot |

---

## Referência rápida — tabela de níveis

| Nível | Pontos mínimos | Pontos máximos |
|---|---|---|
| RECRUTA | 0 | 4,9 |
| SOLDADO | 5 | 9,9 |
| EXECUTOR | 10 | 14,9 |
| ELITE | 15 | 19,9 |
| DOMINANTE | 20 | — |

---

*Protocolo criado na Fase 7A — Clube do Ódio*
