# Zbank Mobile — Gerenciamento Financeiro

> Tech Challenge Fase 03 — POSTECH

---

## Sobre o Projeto

Zbank Mobile é a versão mobile do Zbank (o app web do Zbank pode ser encontrado [aqui](https://github.com/gustavovolp/Zbank)), desenvolvida com **React Native + Expo**. Permite ao usuário se autenticar, visualizar um dashboard com gráficos e análises financeiras e listar, filtrar, adicionar e editar suas transações com paginação via Cloud Firestore.

> **Nota sobre o escopo**: o desafio original pede upload de recibos para o Firebase Storage. Desde o final de 2024 o Firebase exige o plano pago (Blaze, com cartão cadastrado) para habilitar o Storage em projetos novos — como o objetivo aqui era manter o projeto 100% gratuito, essa funcionalidade específica não foi implementada.

---

## Funcionalidades

- **Autenticação**: login e criação de conta com e-mail/senha (Firebase Authentication). No cadastro, a senha precisa ter pelo menos 6 caracteres, 1 letra maiúscula e 1 caractere especial. Há uma aba dedicada ("Sair") para encerrar a sessão a qualquer momento.
- **Dashboard**: saldo atual (com opção de ocultar o valor, como no Zbank web), gráficos de receitas x despesas e de gastos por categoria, com transição animada (`Animated`) entre a seção de resumo e a de gráficos.
- **Listagem de transações**: scroll infinito (paginação no Cloud Firestore), busca por descrição, filtros por tipo, categoria e intervalo de datas.
- **Adicionar/editar transação**: validação avançada (valor, categoria, descrição), sugestão automática de categoria a partir da descrição, exclusão de transação.
- **Dados de exemplo automáticos**: ao criar uma conta, o app já popula a coleção do usuário com algumas transações de exemplo, para o dashboard e a listagem não aparecerem vazios na primeira vez que a pessoa entra.
- Identidade visual reaproveitada do [Zbank web](https://github.com/gustavovolp/Zbank): mesma paleta de cores, fonte Orbitron nos títulos/logo e ícones da biblioteca [Bootstrap Icons](https://icons.getbootstrap.com/) (mesma dependência já usada no repositório web).
- Estado global via **Context API** (`AuthContext` para autenticação, `TransactionsContext` para as transações).

---

## Tecnologias Utilizadas

- [Expo](https://expo.dev/) (React Native, TypeScript)
- [React Navigation](https://reactnavigation.org/) (bottom tabs + native stack)
- [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore)
- [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit) + `react-native-svg`
- `@react-native-community/datetimepicker`
- Ícones: path data da biblioteca [bootstrap-icons](https://icons.getbootstrap.com/) renderizada via `react-native-svg` (componente `BootstrapIcon`)

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
    match /users/{userId}/transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

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
- **Web** (smoke-test, funcionalidade limitada — o date picker nativo pode não funcionar no navegador): `npm run web`.

Na primeira execução, crie uma conta pela tela **"Criar conta"** (não há usuário de demonstração pré-cadastrado, já que o projeto Firebase é criado do zero por quem for rodar o app). Logo após o cadastro, o Dashboard e a lista de Transações já aparecem preenchidos com ~10 lançamentos de exemplo, criados automaticamente para não começar vazio.

---

## Estrutura do Projeto

```
zbank-mobile/
├── App.tsx                        # carregamento de fontes, providers e navegação raiz
├── src/
│   ├── config/
│   │   └── firebase.ts            # inicialização do Firebase (Auth, Firestore)
│   ├── contexts/
│   │   ├── AuthContext.tsx        # login, registro, logout, estado do usuário
│   │   └── TransactionsContext.tsx # CRUD, paginação e filtros das transações
│   ├── navigation/
│   │   ├── RootNavigator.tsx      # alterna AuthStack <-> AppNavigator
│   │   ├── AuthStack.tsx          # telas de Login e Cadastro
│   │   └── AppNavigator.tsx       # tabs (Dashboard, Transações) + tela de formulário
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── TransactionsListScreen.tsx
│   │   └── TransactionFormScreen.tsx
│   ├── components/                # Button, FormField, SelectField, SaldoCard, TransactionItem, BootstrapIcon
│   ├── constants/
│   │   ├── categorias.ts          # categorias por tipo + sugestão automática por descrição
│   │   ├── theme.ts               # cores e tipografia do design system Zbank
│   │   └── bootstrapIcons.ts      # path data dos ícones (bootstrap-icons)
│   ├── utils/
│   │   ├── seedDemoData.ts        # transações de exemplo criadas no primeiro cadastro
│   │   ├── senha.ts               # validação de força da senha no cadastro
│   │   └── confirm.ts             # diálogos de confirmação (compatível com web e nativo)
│   └── types/transaction.ts
└── .env.example
```

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
  criadoEm: number       // epoch ms — cursor de paginação
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

Fonte de destaque: Orbitron (logo/títulos). Ícones: [Bootstrap Icons](https://icons.getbootstrap.com/), a mesma biblioteca já listada como dependência no Zbank web.

---

## Limitações conhecidas

- **Upload de recibos (Firebase Storage) não foi implementado** — desde o final de 2024 o Firebase só libera o Storage em projetos com o plano pago Blaze (exige cartão cadastrado). Como a prioridade era manter o projeto inteiramente gratuito, essa funcionalidade específica do desafio ficou de fora; todo o restante (dashboard, autenticação, listagem paginada/filtrada, CRUD de transações) está implementado e funcional.
- A busca por descrição na listagem é aplicada sobre a página de transações já carregada (client-side), não sobre toda a coleção — o Cloud Firestore não oferece busca full-text nativa. Filtros de tipo, categoria e intervalo de datas, por outro lado, são aplicados diretamente na consulta ao Firestore.
- Se os filtros de categoria/tipo forem combinados e o Firestore pedir a criação de um índice composto (mensagem de erro com um link), basta abrir o link indicado no console para criá-lo automaticamente.

---

## Roteiro de teste rápido

Depois de configurar o Firebase e rodar o app (seções acima), siga esta ordem para validar todas as funcionalidades:

1. **Cadastro**: toque em "Criar conta", preencha nome/e-mail/senha (teste uma senha fraca primeiro pra ver a validação bloqueando) e confirme. Deve cair direto no Dashboard, já com ~10 transações de exemplo.
2. **Dashboard**: alterne entre "Resumo" e "Gráficos" (transição animada) e toque no ícone de olho pra ocultar/mostrar o saldo.
3. **Listagem**: vá na aba "Transações", teste a busca por descrição e abra o filtro (ícone de funil) para filtrar por tipo, categoria e intervalo de datas.
4. **Adicionar**: toque no botão "+", tente salvar o formulário vazio (deve mostrar os erros de validação), depois preencha e salve uma transação nova.
5. **Editar**: abra a transação recém-criada na lista, altere algum campo e salve de novo.
6. **Excluir**: exclua uma transação pelo botão na tela de edição.
7. **Conferência no Firebase**: abra o Firestore Database no console e confira que os documentos em `users/{uid}/transactions` batem com o que aparece no app.
8. **Logout**: toque na aba "Sair", confirme, e verifique que volta para a tela de Login.
9. **Login novamente**: entre com a mesma conta e confirme que os dados persistiram.

---

## Vídeo Demonstrativo

Lembrete para a entrega: gravar um vídeo de até 5 minutos mostrando login/autenticação, adicionar/editar transação, listar e filtrar transações e a integração com o Firebase (dados aparecendo no console do Firestore).
#   Z b a n k _ R e a c t N a t i v e  
 #   Z b a n k _ R e a c t N a t i v e  
 