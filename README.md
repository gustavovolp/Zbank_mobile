# Zbank Mobile — Gerenciamento Financeiro

> Tech Challenge Fase 04 — POSTECH (evolução do app mobile da Fase 03)

---

## Sobre o Projeto

Zbank Mobile é a versão mobile do Zbank (o app web pode ser encontrado [aqui](https://github.com/gustavovolp/Zbank)), desenvolvida com **React Native + Expo**. Permite ao usuário se autenticar, acompanhar um dashboard com gráficos e listar, filtrar, adicionar e editar suas transações, com dados no Cloud Firestore.

A Fase 4 não adiciona telas novas: ela **reestrutura o app por dentro** para ficar mais escalável, modular, performático e seguro, seguindo os requisitos do desafio.

> **Nota sobre o escopo**: o desafio da Fase 3 pedia upload de recibos para o Firebase Storage. Desde o final de 2024 o Firebase exige o plano pago (Blaze, com cartão cadastrado) para habilitar o Storage em projetos novos — como o objetivo era manter o projeto 100% gratuito, essa funcionalidade específica não foi implementada.

---

## O que a Fase 4 entrega

| Requisito do desafio | Solução implementada | Onde está |
|---|---|---|
| Arquitetura modular | Código organizado por módulos de negócio (`auth`, `transactions`, `dashboard`) + núcleo compartilhado (`core`) + casca do app (`shell`) | `src/modules`, `src/core`, `src/shell` |
| Separar apresentação, domínio e infraestrutura (Clean Architecture) | Cada módulo tem as 3 camadas; o domínio é TypeScript puro (sem React, Firebase ou Redux) e define *portas* que a infraestrutura implementa. A regra de dependência é verificada por um teste automatizado | `modules/*/domain`, `modules/*/infrastructure`, `modules/*/presentation`, `src/architecture.test.ts` |
| State management avançado | Redux Toolkit: slices, normalização com `createEntityAdapter`, seletores memoizados (`createSelector`), thunks com injeção de dependências e proteção contra respostas fora de ordem | `modules/*/presentation/state`, `src/shell` |
| Lazy loading e pré-carregamento | Telas e gráficos carregados sob demanda (`React.lazy` + `Suspense`, chunks separados) e pré-carregados em momentos ociosos; dados da sessão pré-buscados no login | `core/presentation/lazy.tsx`, `shell/navigation`, `shell/session.ts` |
| Cache para otimizar requisições | Cache em memória com TTL e invalidação nas escritas + cache persistente **criptografado** com *stale-while-revalidate* | `modules/transactions/infrastructure/CachedTransactionRepository.ts`, `core/infrastructure/cache` |
| Programação reativa | RxJS: `Observable` para autenticação e dados em tempo real, pipeline de busca (`debounce` + `distinctUntilChanged`) e sincronização reativa da lista | `searchStream.ts`, `shell/session.ts`, repositórios |
| Autenticação segura | Sessão do Firebase guardada no Keychain/Keystore (`expo-secure-store`), política de senha, mensagens de erro que não revelam se a conta existe, regras do Firestore por usuário | `core/infrastructure/security`, `modules/auth` |
| Criptografia de dados sensíveis | AES-256-GCM (autenticada) nos dados financeiros em cache, com chave aleatória guardada no armazenamento seguro; cache apagado no logout | `core/infrastructure/security/encryption.ts` |

---

## Funcionalidades

- **Autenticação**: login e criação de conta com e-mail/senha (Firebase Authentication). No cadastro, a senha precisa ter pelo menos 6 caracteres, 1 letra maiúscula e 1 caractere especial. Há uma aba dedicada ("Sair") para encerrar a sessão.
- **Dashboard**: saldo atual (com opção de ocultar o valor), botão **Nova transação** para lançar direto da tela inicial, resumo por categoria e gráficos de receitas x despesas e de gastos por categoria, com transição animada (`Animated`).
- **Listagem de transações**: scroll infinito (paginação no Cloud Firestore), busca por descrição, filtros por tipo, categoria e intervalo de datas (com validação).
- **Adicionar/editar/excluir transação**: validação avançada (valor, categoria, descrição, data) e sugestão automática de categoria a partir da descrição.
- **Dados de exemplo automáticos**: toda conta nova já recebe ~10 transações de exemplo, para o dashboard e a listagem não começarem vazios.
- Identidade visual do [Zbank web](https://github.com/gustavovolp/Zbank): mesma paleta, fonte Orbitron e ícones da [Bootstrap Icons](https://icons.getbootstrap.com/).

---

## Arquitetura

### Camadas e regra de dependência

```
┌──────────────────────────── presentation ────────────────────────────┐
│  telas · componentes · Redux (slices/seletores) · streams RxJS       │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ dispara casos de uso (injetados)
┌───────────────────────────────▼─────────────── domain ───────────────┐
│  entidades · regras (validação, resumo, senha) · casos de uso        │
│  portas (interfaces): TransactionRepository, AuthRepository ...      │
└───────────────────────────────▲──────────────────────────────────────┘
                                │ implementam as portas
┌───────────────────────────────┴───────────── infrastructure ─────────┐
│  Firestore · Firebase Auth · cache criptografado · SecureStore       │
└──────────────────────────────────────────────────────────────────────┘
```

As dependências sempre apontam para dentro: o **domínio não conhece** React, Firebase, Redux nem Expo — por isso as regras de negócio rodam (e são testadas) em Node puro, sem celular e sem backend. Quem liga tudo é a *composição de dependências* em `src/core/di/container.ts`, o único lugar que conhece as implementações concretas.

Essas regras não são só convenção: `src/architecture.test.ts` lê os imports de todo o código e **falha** se alguém, por exemplo, importar o Firebase dentro do domínio, usar a infraestrutura direto numa tela, ou fizer o módulo `auth` depender do módulo `transactions`.

### Estrutura de pastas

```
src/
├── core/                              # núcleo compartilhado
│   ├── domain/                        # ValidationError, Clock, utilitários puros
│   ├── infrastructure/
│   │   ├── firebase/firebaseClient.ts # Firebase (sessão persistida no SecureStore)
│   │   ├── security/                  # AES-GCM, chave, SecureStore em "chunks"
│   │   ├── cache/EncryptedCache.ts    # cache persistente criptografado
│   │   └── storage/KeyValueStore.ts   # abstração de armazenamento
│   ├── presentation/                  # tema, componentes base, lazy, ícones
│   └── di/                            # container (composição) e tipos das dependências
├── modules/
│   ├── auth/
│   │   ├── domain/                    # entidades, AuthRepository (porta), casos de uso, política de senha
│   │   ├── infrastructure/            # FirebaseAuthRepository
│   │   └── presentation/              # telas de login/cadastro + authSlice
│   ├── transactions/
│   │   ├── domain/                    # entidades, categorias, validação, resumo, casos de uso
│   │   ├── infrastructure/            # FirestoreTransactionRepository + CachedTransactionRepository
│   │   └── presentation/              # lista, formulário, transactionsSlice, seletores, streams
│   └── dashboard/presentation/        # DashboardScreen, SaldoCard, gráficos (lazy)
├── shell/                             # casca do app: store, hooks, sessão, navegação
├── testing/                           # dublês em memória usados nos testes
└── architecture.test.ts               # testa a regra de dependência entre camadas
```

### Fluxo de uma ação (exemplo: salvar uma transação)

1. `TransactionFormScreen` (presentation) valida o formulário com as regras do domínio e despacha `addTransaction(draft)`.
2. O *thunk* do Redux chama o caso de uso `AddTransaction` (injetado via `extraArgument`), que valida e normaliza os dados.
3. O caso de uso chama a porta `TransactionRepository.add(...)` — na prática, o `CachedTransactionRepository`, que delega ao `FirestoreTransactionRepository` e invalida o cache.
4. O Firestore notifica o *stream* em tempo real → o dashboard atualiza sozinho; a primeira página da lista é recarregada.

### Gerenciamento de estado (Redux Toolkit)

- **Slices por módulo** (`auth`, `transactions`), combinados em `shell/rootReducer.ts`.
- **Normalização** das transações com `createEntityAdapter` e **seletores memoizados** (`createSelector`) para busca e resumo financeiro — componentes só re-renderizam quando o dado que usam muda.
- **Injeção de dependências nos thunks** (`extraArgument`): o estado não conhece o Firebase; nos testes, o mesmo store roda com repositórios em memória.
- **Respostas fora de ordem são descartadas**: cada busca da primeira página carrega um `requestId`, e a "próxima página" carrega uma `version` — se o usuário trocar de filtro no meio de uma requisição, o resultado antigo é ignorado.

### Programação reativa (RxJS)

- As portas de autenticação e de transações em tempo real devolvem `Observable` (envolvendo `onAuthStateChanged` e `onSnapshot` do Firebase); a sessão compõe e cancela as assinaturas com `Subscription`.
- **Busca**: `debounce` com seletor (digitar espera uma pausa, limpar é imediato) + `distinctUntilChanged` — filtrar a lista em memória não gera requisições.
- **Sincronização da lista**: toda emissão do stream em tempo real passa por `debounceTime`; só se a primeira página divergir do stream a lista é recarregada (é assim que os dados de exemplo aparecem sozinhos logo após o cadastro).
- **Cache como stream**: ao abrir o app, o dashboard emite primeiro o snapshot criptografado do cache e, em seguida, os dados ao vivo (*stale-while-revalidate*).

### Performance

- **Lazy loading**: `DashboardScreen`, `TransactionsListScreen`, `TransactionFormScreen` e os gráficos (`react-native-chart-kit`) são carregados sob demanda com `React.lazy` + `Suspense`. No build web (`npx expo export --platform web`) eles viram *chunks* separados (os gráficos, por exemplo, ficam num arquivo de ~65 KB que só é baixado quando necessário).
- **Pré-carregamento**: enquanto o usuário está na tela de login, o app pré-carrega (em momentos ociosos, via `InteractionManager`) as telas principais; depois de logado, pré-carrega o formulário e os gráficos. Os **dados** também são pré-buscados: a lista e o stream em tempo real começam assim que o usuário entra, antes de ele abrir qualquer aba. As fontes são carregadas antes de a splash screen sumir.
- **Cache**:
  - *Em memória*: a primeira página da lista é reaproveitada por 60 s (chave = usuário + filtros + tamanho da página) e **invalidada em toda escrita** (com um contador de geração para nunca gravar uma resposta que começou antes da mutação). Puxar para atualizar ignora o cache.
  - *Persistente e criptografado*: as últimas 300 transações (base do dashboard) ficam em disco, **criptografadas**, com validade de 7 dias.
- **Listas**: `TransactionItem` memoizado, callbacks estáveis e `FlatList` ajustada (`windowSize`, `initialNumToRender`, `removeClippedSubviews`).

### Segurança

- **Sessão no armazenamento seguro**: o Firebase Auth persiste o token no Keychain (iOS) / Keystore (Android) via `expo-secure-store`, com acessibilidade `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (não migra para outro aparelho nem para backups). Como o SecureStore limita o tamanho de cada valor e o formato das chaves, o valor é dividido em pedaços de até 1000 caracteres e as chaves são sanitizadas (`chunkedStore.ts`).
- **Criptografia de dados sensíveis**: o cache de transações é cifrado com **AES-256-GCM** (`@noble/ciphers`), com nonce aleatório de 96 bits por gravação e autenticação do conteúdo — qualquer adulteração é detectada, o registro é descartado e o app busca os dados de novo. A chave de 256 bits é gerada com o gerador criptográfico do sistema (`expo-crypto`) e guardada no SecureStore.
- **Higiene de dados**: no logout, o cache (memória e disco) é apagado. A criptografia e o cache têm testes automatizados, incluindo adulteração e troca de chave.
- **Autenticação**: política de senha no domínio (mín. 6 caracteres, 1 maiúscula, 1 especial); "usuário não existe" e "senha errada" produzem a **mesma mensagem** (evita enumeração de contas); mensagens técnicas nunca vazam para a tela.
- **Backend**: regras do Firestore garantem que cada usuário só acesse as próprias transações e **validam o formato dos dados no servidor** (veja o passo 6 do setup).
- **Segredos**: o `.env` não é versionado; as chaves do Firebase são identificadores públicos de projeto (a proteção real está nas regras do Firestore).

---

## Tecnologias Utilizadas

- [Expo](https://expo.dev/) (React Native, TypeScript)
- [React Navigation](https://reactnavigation.org/) (bottom tabs + native stack)
- [Redux Toolkit](https://redux-toolkit.js.org/) + `react-redux` (estado global)
- [RxJS](https://rxjs.dev/) (programação reativa)
- [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore)
- `expo-secure-store` + `expo-crypto` + [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers) (armazenamento seguro e criptografia AES-GCM)
- [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit) + `react-native-svg`
- `@react-native-community/datetimepicker`
- [Vitest](https://vitest.dev/) (testes)
- Ícones: path data da biblioteca [bootstrap-icons](https://icons.getbootstrap.com/) renderizada via `react-native-svg`

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- npm
- App [Expo Go](https://expo.dev/go) instalado no celular (Android ou iOS) **ou** um emulador Android/simulador iOS configurado
- Uma conta Google para criar o projeto Firebase

---

## 1. Criando o projeto Firebase

O app depende de um projeto Firebase próprio (Authentication + Firestore, ambos disponíveis no plano gratuito Spark). Siga o passo a passo:

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e clique em **"Adicionar projeto"**. Dê um nome (ex.: `zbank-mobile`) e conclua a criação (o Google Analytics é opcional).
2. No menu lateral, vá em **Build > Authentication** → aba **Sign-in method** → habilite o provedor **E-mail/senha**.
3. Vá em **Build > Firestore Database** → **Criar banco de dados** → inicie em **modo de produção** (as regras de segurança abaixo liberam o acesso correto) → escolha a região mais próxima.
4. Ainda no console, vá em **Configurações do projeto** (ícone de engrenagem) → aba **Geral** → em "Seus apps", clique no ícone **`</>`** (Web) para registrar um app Web (mesmo sendo um app mobile, o SDK JS do Firebase usa a config de um "app Web"). Dê um apelido e finalize — não precisa configurar Hosting.
5. Copie os valores do objeto `firebaseConfig` exibido (apiKey, authDomain, projectId, messagingSenderId, appId).
6. **Obrigatório**: em **Firestore Database → Regras**, substitua o conteúdo pelo bloco abaixo e clique em **Publicar**.

> ⚠️ Sem esse passo o app não funciona: no modo de produção, o Firestore nega qualquer leitura/escrita por padrão até que uma regra libere o acesso. Pular esta etapa faz login e cadastro funcionarem normalmente, mas toda operação de transação (criar conta já popula dados de exemplo, listar, adicionar, editar) falha com erro de permissão.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    function isValidTransaction(data) {
      return data.valor is number && data.valor > 0 && data.valor <= 1000000000
        && data.tipo in ['deposito', 'transferencia']
        && data.categoria is string && data.categoria.size() > 0
        && data.descricao is string && data.descricao.size() >= 3 && data.descricao.size() <= 120
        && data.data is string && data.data.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
        && data.criadoEm is number;
    }

    match /users/{userId}/transactions/{transactionId} {
      allow read, delete: if isOwner(userId);
      allow create, update: if isOwner(userId) && isValidTransaction(request.resource.data);
    }
  }
}
```

Essas regras fazem duas coisas: **isolam os dados por usuário** (`request.auth.uid == userId`) e **validam o formato de cada transação no servidor** (tipo, valor positivo, tamanho da descrição, data no formato `AAAA-MM-DD`), como segunda linha de defesa caso alguém contorne o app e fale direto com a API.

---

## 2. Configurando o projeto localmente

### Clone o repositório

```bash
git clone https://github.com/gustavovolp/Zbank_mobile.git
cd Zbank_mobile
```

### Instale as dependências

```bash
npm install
```

### Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com os valores copiados do `firebaseConfig` no passo 1.5:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

> O `.env` não é versionado (está no `.gitignore`). As variáveis usam o prefixo `EXPO_PUBLIC_` para serem lidas pelo app em tempo de execução — suporte nativo do Expo, sem necessidade de plugins extras.

---

## 3. Rodando o projeto

```bash
npx expo start
```

Isso abre o Metro Bundler no terminal com um QR code. Para rodar:

- **No celular**: abra o app **Expo Go** e escaneie o QR code (Android) ou use a câmera nativa (iOS).
- **Emulador Android**: com o Android Studio configurado, pressione `a` no terminal.
- **Simulador iOS** (necessário macOS): pressione `i` no terminal.
- **Web** (apenas smoke-test, com limitações — veja "Limitações conhecidas"): `npm run web`.

Na primeira execução, crie uma conta pela tela **"Criar conta"** (não há usuário de demonstração pré-cadastrado, já que o projeto Firebase é criado do zero por quem for rodar o app). Logo após o cadastro, o Dashboard e a lista de Transações já aparecem preenchidos com ~10 lançamentos de exemplo, criados automaticamente.

---

## 4. Testes

```bash
npm test            # 155 testes automatizados (Vitest)
npm run typecheck   # verificação de tipos (TypeScript, modo estrito)
```

Como o domínio é independente de framework e as dependências são injetadas, os testes rodam em Node, sem celular e sem Firebase. Eles cobrem:

- **Domínio**: política de senha, categorias e sugestão, validação de transações e filtros, cálculo do resumo (em centavos, sem erro de ponto flutuante), casos de uso de autenticação e de transações.
- **Segurança e cache**: criptografia AES-GCM (ida e volta, nonce novo a cada gravação, detecção de adulteração, chave errada), armazenamento seguro em pedaços (limites do SecureStore), cache criptografado (validade, adulteração, limpeza).
- **Cache de requisições**: TTL, invalidação nas escritas, resposta antiga descartada, *stale-while-revalidate*, isolamento por usuário, limpeza no logout.
- **Estado e reatividade**: paginação, corridas de requisição, mutações, seletores memoizados, `debounce` da busca (com timers falsos), sincronização reativa da lista, encerramento da sessão.
- **Arquitetura**: regra de dependência entre camadas e independência entre módulos (`src/architecture.test.ts`).

O adaptador real do Firestore (`FirestoreTransactionRepository`) e a integração com o SecureStore do aparelho dependem de backend/dispositivo e são validados manualmente pelo roteiro abaixo.

---

## Roteiro de teste rápido

Depois de configurar o Firebase e rodar o app, siga esta ordem para validar tudo:

1. **Cadastro**: toque em "Criar conta", preencha nome/e-mail/senha (teste uma senha fraca primeiro para ver a validação bloqueando) e confirme. Deve cair no Dashboard, já com ~10 transações de exemplo (e a aba "Transações" também já preenchida).
2. **Dashboard**: alterne entre "Resumo" e "Gráficos" (transição animada; os gráficos são carregados sob demanda) e toque no ícone de olho para ocultar/mostrar o saldo.
3. **Listagem**: na aba "Transações", teste a busca (digite rápido: o filtro só roda após uma pausa) e abra o filtro (funil) para filtrar por tipo, categoria e datas — tente uma data inválida ou intervalo invertido para ver a validação.
4. **Adicionar**: toque em "Nova transação" no Dashboard (ou em "+" na aba Transações), tente salvar vazio (erros de validação), depois preencha e salve (ex.: descrição "Uber" sugere a categoria Transporte).
5. **Editar / Excluir**: abra a transação criada, altere e salve; depois exclua.
6. **Cache**: feche o app completamente e abra de novo — o Dashboard já aparece com os dados do cache criptografado enquanto os dados ao vivo chegam.
7. **Conferência no Firebase**: no Firestore Database, confira os documentos em `users/{uid}/transactions`.
8. **Logout**: toque na aba "Sair", confirme e verifique que volta ao Login (o cache local é apagado).
9. **Login novamente**: entre com a mesma conta e confirme que os dados persistiram.

---

## Modelo de dados (Cloud Firestore)

Cada usuário tem sua própria subcoleção de transações:

```
users/{uid}/transactions/{transactionId}
{
  valor: number,
  tipo: "deposito" | "transferencia",
  data: string,          // "AAAA-MM-DD"
  descricao: string,
  categoria: string,
  criadoEm: number       // epoch ms — ordenação e paginação
}
```

---

## Design System

Reaproveita a identidade visual do [Zbank web](https://github.com/gustavovolp/Zbank):

| Variável | Valor |
|---|---|
| `primary` | `#9747FF` |
| `secondary` | `#502588` |
| `neutral` | `#4A4949` |

Fonte de destaque: Orbitron (logo/títulos). Ícones: [Bootstrap Icons](https://icons.getbootstrap.com/).

---

## Limitações conhecidas

- **Upload de recibos (Firebase Storage) não foi implementado** — desde o final de 2024 o Firebase só libera o Storage em projetos com o plano pago Blaze (exige cartão cadastrado). Como a prioridade era manter o projeto inteiramente gratuito, essa funcionalidade específica da Fase 3 ficou de fora.
- **No navegador (`npm run web`) o armazenamento "seguro" não é seguro**: não existe Keychain/Keystore no web, então a sessão e a chave do cache caem para o `localStorage`. O modo web existe só como smoke-test de desenvolvimento; a proteção descrita na seção de segurança vale para o app nativo (Expo Go / build).
- **Não há bloqueio por biometria** nem criptografia ponta a ponta dos documentos no Firestore (o Google já cifra os dados em repouso no servidor); são evoluções possíveis.
- A busca por descrição age sobre as páginas já carregadas (em memória), pois o Cloud Firestore não oferece busca full-text nativa. Filtros de tipo, categoria e datas são aplicados na consulta ao Firestore.
- Se filtros combinados fizerem o Firestore pedir um índice composto (erro com um link), basta abrir o link no console para criá-lo automaticamente.
- Ao atualizar da Fase 3 para a Fase 4, quem já estava logado precisa entrar de novo uma vez: a sessão agora fica no armazenamento seguro, em vez do AsyncStorage.

---

## Vídeo Demonstrativo

Lembrete para a entrega: gravar um vídeo de até 5 minutos mostrando as principais funcionalidades (login, dashboard, listar/filtrar, adicionar/editar) e destacando as melhorias da Fase 4: a estrutura em camadas, o lazy loading/cache e a segurança (cache criptografado e sessão no armazenamento seguro).
