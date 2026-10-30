# Taskflow RPG

Taskflow RPG é um sistema de gestão de tarefas gamificado desenvolvido em Angular + Supabase. Os usuários criam perfis de herói, gerenciam missões (tarefas), ganham XP e moedas, e podem jogar sozinhos ou em "casas" (households) compartilhadas com amigos/família via código de convite.

## Funcionalidades

- **Autenticação**: Login e registo com Supabase Auth
- **Perfil do herói**: Escolha de nome, classe (role) e avatar
- **Modos de jogo**:
  - *Sozinho*: sem casa, perfil individual
  - *Juntos*: entrar numa casa existente via código de convite ou criar a sua própria casa
- **Households (Casas)**: Criar casa, gerar código de convite único (6 carateres alfanuméricos), entrar com código, sair da casa, expulsar membros (apenas o criador)
- **Missões**: Criar, listar, concluir e filtrar tarefas pendentes/concluídas
- **Gamificação**: XP, níveis, moedas, sequência de dias ativos (streak)
- **Loja**: Resgatar recompensas com moedas
- **Dashboard**: Resumo do jogador, prazo mais próximo, última recompensa resgatada, código da casa para partilhar

**Observação:** Para conseguir convidar membros para a sua casa, ambos precisam estar logados.

## Stack tecnológica

- [Angular 22](https://angular.io/) (standalone components, signals, control flow `@if`/`@for`/`@switch`)
- [Supabase](https://supabase.com/) (Auth, Database, Realtime)
- [RxJS](https://rxjs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/) (testes unitários)

## Requisitos do projeto

- [x] `@switch` no template do dashboard (badges de urgência)
- [x] Componente filho com `@Input`, `@Output` e `EventEmitter` (`app-household-invite-code`)
- [x] GitHub Actions + GitHub Pages (`.github/workflows/deploy.yml`)
- [x] Chave Supabase em `src/environments/environment.ts`
- [x] Limpeza de subscrições com `OnDestroy` (`dashboard`, `profile-setup`, `profile-edit`)
- [x] README.md com documentação do projeto

## Configuração do Supabase

Variáveis de ambiente em `src/environments/environment.ts`:

```ts
export const environment = {
    production: false,
    supabaseUrl: 'https://seu-projeto.supabase.co',
    supabaseKey: 'sua-chave-publica'
};
```

Tabelas necessárias no Supabase: `profiles`, `households`, `tasks`, `task_subtasks`, `rewards`, `user_rewards`, `avatar`, `role`.

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm start

# Build de produção
npm run build

# Build para GitHub Pages
npm run build -- --base-href=/taskflow-rpg/

# Testes
npm test
```

## Estrutura do projeto

```
src/
  app/
    components/          # Componentes independentes (profile-edit, household-invite-code, etc.)
    pages/               # Páginas (dashboard, profile-setup, task-list, shop, auth)
    services/            # Serviços (household, gamification, task, auth, supabase-service)
    models/              # Interfaces TypeScript (profile, task, household, reward)
  database/
    supabase.ts          # Tipos TypeScript gerados do Supabase
  environments/          # Variáveis de ambiente
```

## Deploy

O deploy é automático via GitHub Actions para GitHub Pages ao fazer push no branch `main`. O workflow builda o projeto com `--base-href=/taskflow-rpg/` e publica na branch `gh-pages`.

## Autores

Projeto desenvolvido para apresentação escolar — entrega 01/11/26, apresentação 02/11/26 às 09:00.
