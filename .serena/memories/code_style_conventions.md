# Code Style and Conventions

## TypeScript/React Standards
- Use functional components with React 19
- TypeScript is mandatory with strict types
- Use `.tsx` for components, `.ts` for utilities
- Interface names should be PascalCase with optional "Type" suffix (e.g., `AuthContextType`)

## File Organization
- Components in `src/components/` (organized by feature/layout)
- Pages in `src/pages/` (route components)
- Views in `src/views/` (feature views like RBAC management)
- Utilities in `src/lib/` (supabase.ts, imageUpload.ts, utils.ts)
- Contexts in `src/contexts/` (React Context providers)
- Store in `src/store/` (Zustand/Redux stores)

## Naming Conventions
- Components: PascalCase (e.g., `Header.tsx`)
- Utilities/functions: camelCase (e.g., `uploadImage()`)
- Constants: UPPERCASE_SNAKE_CASE
- Interfaces/Types: PascalCase with optional suffix

## Code Quality
- ESLint is configured with strict rules
- Build includes TypeScript compilation (`tsc && vite build`)
- Max warnings set to 0 (strict linting)
- All unused disable directives must be removed

## Imports
- Use path alias `@` for `src/` directory (configured in vite.config.ts)
- Group imports: external packages first, then internal modules
