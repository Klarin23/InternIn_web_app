# Patch `internin-web/package.json` — scripts & devDependencies

## 1. Installer (depuis `internin-web/`) — n’écrase rien

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
npx playwright install chromium
```

## 2. Ajouter dans `"scripts"` (conserver dev/build/start/lint)

```json
"lint": "eslint . --max-warnings=0",
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"quality": "node scripts/quality-check.mjs"
```

## 3. Fichiers à copier à la racine de `internin-web/`

- `vitest.config.mjs`
- `vitest/setup.js`
- `playwright.config.mjs`
- `__tests__/unit/*.test.js`
- `e2e/*.spec.js`
- `scripts/quality-check.mjs`

## 4. `.gitignore` (ajouter si absent)

```
coverage/
playwright-report/
test-results/
blob-report/
```
