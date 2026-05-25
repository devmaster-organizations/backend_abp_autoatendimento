# Migração do Fluxo de Chat para Banco de Dados

## 📋 Descrição
Migrar a tabela de hash estática do fluxo de chat (atualmente em `fluxo.ts`) para PostgreSQL, com população automática de dados ao executar `docker compose up`.

## 🎯 Critérios de Aceitação
- [ ] Duas tabelas criadas: `chat_flow_nodes` (nós) e `chat_flow_options` (opções)
- [ ] Migration Prisma automatiza a criação de estrutura
- [ ] Dados são populados automaticamente ao subir o Docker Compose
- [ ] 13 nós de chat e 39 opções de navegação inseridos corretamente
- [ ] Sem duplicação de dados em restarts

## ✅ Implementação Concluída
- ✅ Migration criada: `20260522120000_create_chat_flow_tables`
- ✅ Seed script: `dist/prisma/seed-chat-flow.cjs`
- ✅ Docker Compose integrado com seed automático
- ✅ Validado: 13 nodes + 39 options no postgres

## 🔧 Detalhes Técnicos
- **Linguagem**: TypeScript/JavaScript
- **Banco**: PostgreSQL 17
- **ORM**: Prisma 7
- **Seed**: CommonJS + pg driver
- **Deploy**: Docker Compose com auto-seed na inicialização
