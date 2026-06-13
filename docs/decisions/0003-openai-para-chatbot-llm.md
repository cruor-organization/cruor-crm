# ADR-0003 — OpenAI (GPT) como LLM do chatbot, em vez de Claude

**Data:** 2026-06-10
**Estado:** Aceite
**Contexto da fase:** Fase 4 — Conteúdo & IA, slice 1 (Fundação RAG + Chatbot texto).

## Contexto

O `prompt.md` §0/§5 fixa parâmetros do stack de IA:

- `llm_default_model: claude-sonnet-4-5`
- `vision_model: claude-sonnet-4-5`
- `ai_framework: langchain-js+langgraph-js`
- `embeddings_model: text-embedding-3-small` (OpenAI)
- `vector_store: pgvector-supabase`

O §0 é uma lista de parâmetros travados; o CLAUDE.md obriga a confirmar antes de
desviar. Na sessão de arranque da Fase 4, o dono do produto decidiu usar **OpenAI
(GPT)** como LLM de raciocínio do chatbot, não Claude.

## Decisão

1. **LLM do chatbot (e futura vision): OpenAI GPT** (`gpt-4o` por defeito), via
   OpenAI SDK dentro do `ai-service`. Desvio consciente de `llm_default_model`/
   `vision_model` do §0, autorizado pelo dono do produto.
2. **Embeddings: mantêm-se OpenAI `text-embedding-3-small`** (1536 dims) — **sem
   desvio**; já era o que o §0 fixava. A Anthropic não tem endpoint de embeddings
   de primeira parte, por isso esta peça seria sempre OpenAI.
3. **Orquestração do agente (slice 1): loop de tool-calling nativo do OpenAI SDK**,
   não LangGraph. Para um único loop modelo+tools read-only, o LangGraph é
   complexidade desnecessária. Mantém-se em aberto introduzir LangGraph se um
   slice futuro precisar de um grafo de estados (multi-passo, ramificações).
4. **`vector_store: pgvector-supabase` mantém-se** sem alteração.

## Consequências

- O `ai-service` depende do pacote `openai`; é instanciado apenas quando
  `AI_PROVIDER=live`. Em `mock` (CI/E2E) não há chamadas externas nem custo.
- A troca de provider é barata: existe uma porta (`ChatProvider`/`EmbeddingsProvider`)
  com implementações `mock` e `openai`, selecionadas por `AI_PROVIDER`. Trocar para
  Claude no futuro é escrever um novo adapter `anthropic`, sem tocar no backend nem
  no frontend. O lock-in é mínimo.
- Há duas chaves de provider externas a gerir em produção: `OPENAI_API_KEY` cobre
  chat **e** embeddings (mesmo fornecedor), simplificando.
- Divergência documental: este ADR sobrepõe-se ao §0 para o LLM/vision. Qualquer
  agente futuro deve ler este ADR antes de "corrigir" o modelo de volta para Claude.

## Alternativas consideradas

- **Honrar o §0 à letra (`claude-sonnet-4-5`)**: rejeitado por decisão do dono do
  produto. Nota: `claude-sonnet-4-5` é hoje um modelo legacy (o Sonnet atual é
  `claude-sonnet-4-6`), pelo que honrar à letra também já implicaria uma escolha.
- **LangGraph desde já**: adiado — sobredimensionado para o loop read-only do slice 1.
