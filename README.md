# Ranking — Clube do Ódio

Ranking público do Clube do Ódio. Publicado via GitHub + Vercel.
Lê dados ao vivo do Google Sheets. Atualização automática a cada 5 minutos.
Sem backend. Sem banco de dados. Apenas HTML + CSS + JS vanilla.

## Stack

- HTML / CSS / JavaScript vanilla
- Google Sheets como fonte de dados (endpoint CSV público via gviz/tq)
- Vercel para publicação (deploy automático no push para `main`)

## Estrutura de arquivos

```
ranking/
├── index.html          — estrutura da página
├── style.css           — estilo completo (dark, premium, mobile-first)
├── app.js              — lógica de fetch, render, modal, share card
├── logo-tigre.png      — logo oficial do Clube do Ódio
├── README.md           — este arquivo
└── docs/               — documentação operacional
    ├── HISTORICO_CDO_ARQUITETURA.md
    ├── FECHAMENTO_TEMPORADA_CDO.md
    ├── ROADMAP_HISTORICO_FRONTEND.md
    └── AUDITORIA_MOBILE_RANKING_CDO.md
```

## Documentação operacional

- [Arquitetura do histórico](docs/HISTORICO_CDO_ARQUITETURA.md) — estado atual, abas da planilha, fluxo de dados, riscos
- [Fechamento de temporada](docs/FECHAMENTO_TEMPORADA_CDO.md) — checklist operacional mensal
- [Roadmap do histórico no frontend](docs/ROADMAP_HISTORICO_FRONTEND.md) — fases 7B, 7C e 7D
- [Auditoria mobile](docs/AUDITORIA_MOBILE_RANKING_CDO.md) — diagnóstico visual mobile-first

## Sheet ID

```
1pTjLgnEa52uS4ek4DjFHWQuV8vNgvo-rKrxJcOPnEEk
Aba pública: Ranking
```

## Regras de desenvolvimento

- NÃO alterar o Sheet ID ou a aba `Ranking` sem aviso
- NÃO introduzir dependências externas (sem npm, sem bibliotecas)
- NÃO fazer push para `main` sem testar localmente (`npx serve .`)
- NÃO alterar lógica de fetch/parse sem revisão