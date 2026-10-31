# TaskFlow RPG – Gestor Doméstico

Aplicação web SPA em **Angular** que transforma as tarefas domésticas num jogo: cada missão
concluída dá XP e moedas, e as moedas trocam-se por prémios definidos pela própria casa.

**Aplicação publicada:** https://github.com/ellenrfs10/taskflow-rpg
**Link do github pages:** https://ellenrfs10.github.io/taskflow-rpg/auth

## Funcionalidades

- Registo e login com **Supabase Auth**, e configuração do perfil (nome, classe e avatar).
- **Casas**: jogar sozinho, criar uma casa ou entrar numa com um código de convite de 6 caracteres.
- **Missões**: criar (formulário reativo com validação), concluir, eliminar, com urgência, prazo
  e temporizador no cartão.
- **Missões em conjunto**: convidar membros da casa, que aceitam o convite antes de a missão
  aparecer na lista deles.
- **Gamificação**: XP, nível, moedas e sequência de dias seguidos.
- **Loja de recompensas**: filtrar por categoria, ordenar por preço, criar, eliminar e resgatar prémios.
- **Dashboard** com o resumo do jogador, as missões pendentes e concluídas e o último prémio resgatado.

## Tecnologias

Angular (componentes standalone, signals, `@if`/`@for`/`@switch`), TypeScript, Reactive Forms,
Angular Router (com guards), `HttpClient`, RxJS, Supabase, GitHub Actions e GitHub Pages.

## Fonte de dados

- **Supabase** (PostgreSQL + Auth). A loja de prémios consome a **API REST do Supabase**
  (`/rest/v1/rewards`) com `HttpClient` num service, com a resposta tipada (`RewardRow`),
  `Observable` + `subscribe()` e estados de carregamento e de erro.
- O resto das operações usa o cliente `@supabase/supabase-js`.

## Estrutura

```
src/app
├── components/   componentes reutilizáveis (task-card, household-invite-code, auth, profile-edit)
├── pages/        páginas ligadas às rotas (dashboard, task-list, shop, profile-setup)
├── services/     acesso aos dados (task, shop, household, gamification, auth, catalog)
├── guards/       proteção das rotas privadas
└── models/       interfaces TypeScript (Task, Reward, Household...)
```

## Executar localmente

```bash
npm install
cp src/environments/environment.example.ts src/environments/environment.ts
# editar src/environments/environment.ts com o URL e a chave pública (publishable) do Supabase
npm start
```

A aplicação fica em http://localhost:4200. Para correr os testes: `npm test`.

## Variáveis de ambiente e deploy


Cada *push* para `main` faz o build de produção e publica no GitHub Pages
(`.github/workflows`). A chave pública só dá acesso ao que as regras de segurança
(Row Level Security) do Supabase permitirem.
