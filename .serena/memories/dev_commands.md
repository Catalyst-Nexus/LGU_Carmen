# Development Commands

## Package Management
- Package manager: npm
- Node package setup in `package.json` (type: module, ES modules)

## Development Workflow
- `npm run dev` - Start development server (Vite)
- `npm run build` - Production build (runs TypeScript check + vite build)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (strict mode, max-warnings 0)
- `npm run test` - Run Vitest tests
- `npm run test:ui` - Run Vitest with UI
- `npm run test:coverage` - Generate coverage report

## Environment Variables
Create `.env` file in project root (example in `.env.example`):
```
VITE_SUPABASE_URL=<self-hosted instance URL>
VITE_SUPABASE_ANON_KEY=<public/anon key>
```

## Build Setup
- Config in `vite.config.ts`
- TypeScript config in `tsconfig.json` (main) and `tsconfig.node.json`
- Tailwind configured via `@tailwindcss/vite` plugin
- Path alias: `@ → ./src`

## Windows Notes
- Use PowerShell or CMD for terminal commands
- Standard commands work: npm, git, etc.
