# MoneyBook

MoneyBook now includes a Streamlit entry point for simple deployment while keeping
the original React/Vite app available for local development.

## Deploy on Streamlit Community Cloud

1. Push this project to GitHub.
2. In Streamlit Community Cloud, choose this repository.
3. If your GitHub repository root is `my-ledger`, set the main file path to:

```text
app.py
```

If your GitHub repository root is `personal_resolve`, set the main file path to:

```text
my-ledger/app.py
```

4. Streamlit will install dependencies from `requirements.txt`. Streamlit
   supports this file either at the repository root or beside a subdirectory
   entry point, so the included `my-ledger/requirements.txt` works with the
   second layout.

The Streamlit app reads and writes `moneybook_data.json` in the same folder. On
hosted Streamlit, local file writes can be temporary after an app rebuild or
restart, so use an external database later if you need durable multi-user data.

## Run locally with Streamlit

```bash
pip install -r requirements.txt
streamlit run app.py
```

From the parent `personal_resolve` folder, run:

```bash
streamlit run my-ledger/app.py
```

## Original React app

The original frontend and local Express backend are still present.

```bash
npm install
npm run dev
node server.js
```

The React app uses `/api/*` routes served by `server.js`; the Streamlit version
does not require Node.js.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
