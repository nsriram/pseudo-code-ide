# React.js Best Practices

## Structure
- Use feature-based folders (`/features/*`)
- Separate: `components/`, `pages/`, `hooks/`, `services/`, `utils/`

## Components
- Prefer functional components + hooks
- Keep components small & reusable
- Use props destructuring

## Hooks
- Follow Rules of Hooks
- Extract custom hooks for reusable logic
- Avoid unnecessary `useEffect`

## State
- Keep state local when possible
- `useState` → simple, `useReducer` → complex
- Use Context / state libraries for global state

## Data Fetching
- Use React Query / SWR
- Handle loading + error states
- Keep API logic outside components

## Code Quality
- Naming: PascalCase (components), camelCase (vars)
- Use ESLint + Prettier
- Avoid magic values

## Performance
- Use `React.memo`, `useMemo`, `useCallback`
- Lazy load (`React.lazy`, `Suspense`)

## Testing
- Use Jest + React Testing Library
- Test behavior, not implementation

## Security
- Sanitize inputs
- Avoid `dangerouslySetInnerHTML`

## Accessibility
- Use semantic HTML
- Add `alt` and `aria-*` where needed

## Dependencies
- Avoid unnecessary libs
- Keep deps updated

## Env & Deploy
- Use `.env` for configs
- Separate dev/staging/prod

## Reusability
- Follow DRY
- Extract shared components/utilities

## Extras
- Use TypeScript
- Write clear commits