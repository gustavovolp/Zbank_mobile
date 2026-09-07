# Zbank Mobile — Gerenciamento Financeiro

> Tech Challenge Fase 03 — POSTECH

---

## Sobre o Projeto

Zbank Mobile é a versão mobile do Zbank (o app web do Zbank pode ser encontrado [aqui](https://github.com/gustavovolp/Zbank)), desenvolvida com **React Native + Expo**. Permite ao usuário se autenticar, visualizar um dashboard com gráficos e análises financeiras, listar e filtrar suas transações (com paginação via Cloud Firestore) e adicionar/editar transações com upload de recibos para o Firebase Storage.

---

## Funcionalidades

- **Autenticação**: login e criação de conta com e-mail/senha (Firebase Authentication).
- **Dashboard**: saldo atual, total de receitas e despesas, gráficos de receitas x despesas e de gastos por categoria, com transição animada (`Animated`) entre a seção de resumo e a de gráficos.
- **Listagem de transações**: scroll infinito (paginação no Cloud Firestore), busca por descrição, filtros por tipo, categoria e intervalo de datas.
- **Adicionar/editar transação**: validação avançada (valor, categoria, descrição), sugestão automática de categoria a partir da descrição, upload de recibo (imagem ou PDF) para o Firebase Storage, exclusão de transação.
- Estado global via **Context API** (`AuthContext` para autenticação, `TransactionsContext` para as transações).

---

## Tecnologias Utilizadas

- [Expo](https://expo.dev/) (React Native, TypeScript)
- [React Navigation](https://reactnavigation.org/) (bottom tabs + native stack)
- [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore, Storage)
- [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit) + `react-native-svg`
- [react-hook-form](https://react-hook-form.com/)
- `expo-image-picker` / `expo-document-picker` (upload de recibos)
- `@react-native-community/datetimepicker`

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- npm
- App [Expo Go](https://expo.dev/go) instalado no celular (Android ou iOS) **ou** um emulador Android/simulador iOS configurado
- Uma conta Google para criar o projeto Firebase

---

## 1. Criando o projeto Firebase

O app depende de um projeto Firebase próprio (Authentication + Firestore + Storage). Siga o passo a passo:

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e clique em **"Adicionar projeto"**. Dê um nome (ex.: `zbank-mobile`) e conclua a criação (o Google Analytics é opcional).
2. No menu lateral, vá em **Build > Authentication** → aba **Sign-in method** → habilite o provedor **E-mail/senha**.
3. Vá em **Build > Firestore Database** → **Criar banco de dados** → inicie em **modo de produção** (as regras de segurança do passo 3 abaixo liberam o acesso correto) → escolha a região mais próxima.
4. Vá em **Build > Storage** → **Começar** → mantenha o modo de produção → mesma região do Firestore.
5. Ainda no console, vá em **Configurações do projeto** (ícone de engrenagem) → aba **Geral** → em "Seus apps", clique no ícone **`</>`** (Web) para registrar um app Web (mesmo sendo um app mobile, o SDK JS do Firebase usa a config de um "app Web"). Dê um apelido e finalize — não precisa configurar Hosting.
6. Copie os valores do objeto `firebaseConfig` exibido (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

### Regras de segurança

Em **Firestore Database > Regras**, substitua pelo conteúdo abaixo (garante que cada usuário só acesse as próprias transações) e publique:

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

Em **Storage > Regras**, substitua e publique:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{userId}/{allPaths=**} {
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

Preencha o `.env` com os valores copiados do `firebaseConfig` no passo 1.6:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
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
- **Web** (smoke-test, funcionalidade limitada — câmera/document picker/date picker nativos podem não funcionar no navegador): `npm run web`.

Na primeira execução, crie uma conta pela tela **"Criar conta"** (não há usuário de demonstração pré-cadastrado, já que o projeto Firebase é criado do zero por quem for rodar o app).

---

## Estrutura do Projeto

```
zbank-mobile/
├── App.tsx                        # carregamento de fontes, providers e navegação raiz
├── src/
│   ├── config/
│   │   └── firebase.ts            # inicialização do Firebase (Auth, Firestore, Storage)
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
│   ├── components/                # Button, FormField, SelectField, SaldoCard, TransactionItem
│   ├── constants/
│   │   ├── categorias.ts          # categorias por tipo + sugestão automática por descrição
│   │   └── theme.ts               # cores e tipografia do design system Zbank
│   ├── types/transaction.ts
│   └── utils/anexoUtils.ts        # validação de anexos (tipo/tamanho)
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
  anexo: { nome, tipoArquivo, tamanho, url } | null,
  criadoEm: number       // epoch ms — cursor de paginação
}
```

Os recibos são armazenados no Storage em `receipts/{uid}/{transactionId}/{arquivo}`.

---

## Design System

Reaproveita a identidade visual do [Zbank web](https://github.com/gustavovolp/Zbank):

| Variável | Valor |
|---|---|
| `primary` | `#9747FF` |
| `secondary` | `#502588` |
| `neutral` | `#4A4949` |

Fonte de destaque: Orbitron (logo/títulos).

---

## Limitações conhecidas

- A busca por descrição na listagem é aplicada sobre a página de transações já carregada (client-side), não sobre toda a coleção — o Cloud Firestore não oferece busca full-text nativa. Filtros de tipo, categoria e intervalo de datas, por outro lado, são aplicados diretamente na consulta ao Firestore.
- Se os filtros de categoria/tipo forem combinados e o Firestore pedir a criação de um índice composto (mensagem de erro com um link), basta abrir o link indicado no console para criá-lo automaticamente.

---

## Vídeo Demonstrativo

Lembrete para a entrega: gravar um vídeo de até 5 minutos mostrando login/autenticação, adicionar/editar transação, listar e filtrar transações, upload de anexo e a integração com o Firebase (dados aparecendo no console do Firestore/Storage).
