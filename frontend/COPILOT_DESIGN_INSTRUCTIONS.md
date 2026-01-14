# Copilot Instructions - Frontend Design & Development

## Context & Architecture
This is the Ultimate TicTacToe web application frontend, built with **React + TypeScript + Vite + SCSS**. The frontend communicates with a FastAPI backend running on `http://localhost:8000` (or configurable via environment).

### Design Foundation
All UI development follows the **Dark Mode Design System** defined in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) and **Page Structure** in [PAGE_STRUCTURE.md](PAGE_STRUCTURE.md).

---

## Key Principles

1. **Type Safety First**: Use TypeScript strict mode. All props, functions, and component states must be explicitly typed.
2. **Component Composition**: Break UI into small, reusable components. Prefer composition over complex monolithic components.
3. **Dark Mode Only**: All colors use the palette defined in DESIGN_SYSTEM.md. No light mode variants needed.
4. **Accessibility**: Every component must support keyboard navigation, screen readers, and high contrast.
5. **Mobile-First**: Design responsive layouts starting from mobile (360px), scaling up to desktop.
6. **SCSS Modules**: Use `.module.scss` files with BEM naming convention. Import SCSS variables from `_variables.scss`.
7. **No Inline Styles**: All styling belongs in SCSS files, never inline `style={{}}`.

---

## File Structure Convention

```
src/
├── components/
│   ├── Layout/
│   │   ├── Navigation/
│   │   │   ├── Navigation.tsx          # Component
│   │   │   ├── Navigation.module.scss  # Styles
│   │   │   └── Navigation.types.ts     # Types/Props interface
│   │   ├── Sidebar/
│   │   └── Footer/
│   ├── UI/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.scss
│   │   │   ├── Button.types.ts
│   │   │   └── Button.test.tsx         # Optional
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Input/
│   │   └── ...
│   ├── Game/
│   │   ├── UltimateTicTacToeGameBoard/
│   │   ├── MoveHistoryLog/
│   │   └── GameHeader/
│   ├── Pages/
│   │   ├── LoginPage/
│   │   ├── DashboardPage/
│   │   ├── GameplayPage/
│   │   ├── GameHistoryPage/
│   │   ├── LeaderboardPage/
│   │   ├── AdminDashboard/
│   │   └── ...
│   └── Common/
│       ├── EmptyState/
│       ├── Loader/
│       └── Toast/
├── datamodels/
│   ├── tictactoe.ts     # Game logic types (mirrors backend)
│   └── users.ts         # User types
├── services/
│   └── ApiService.ts    # API client
├── hooks/
│   ├── useAuth.ts
│   ├── useGame.ts
│   └── ...
├── store/
│   └── appStore.ts      # State management (Zustand or Context)
├── utils/
│   ├── constants.ts
│   ├── validators.ts
│   └── helpers.ts
├── styles/
│   ├── _variables.scss        # Color & spacing variables
│   ├── _mixins.scss           # Reusable SCSS mixins
│   ├── _global.scss           # Global styles
│   └── index.scss             # Global imports
├── App.tsx
├── App.css
├── main.tsx
└── index.css
```

---

## Component Template

### Component File (`.tsx`)
```typescript
import { FC, useState, useCallback } from 'react';
import styles from './Button.module.scss';
import { ButtonProps } from './Button.types';

/**
 * Button component with primary, secondary, ghost, and danger variants.
 * Supports different sizes and states (loading, disabled).
 * 
 * @example
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click me
 * </Button>
 */
const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  onClick,
  className,
  ...rest
}) => {
  const classNames = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    disabled && styles['button--disabled'],
    loading && styles['button--loading'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? <span className={styles.spinner}>⟳</span> : children}
    </button>
  );
};

export default Button;
```

### Types File (`.types.ts`)
```typescript
import { ReactNode } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
```

### Styles File (`.module.scss`)
```scss
@import '../../styles/variables';

.button {
  padding: $spacing-md $spacing-lg;
  font-size: $font-size-body;
  font-weight: $font-weight-semi-bold;
  border-radius: $radius-md;
  border: none;
  cursor: pointer;
  transition: all $transition-standard;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  outline-offset: 2px;

  &:focus-visible {
    outline: 2px solid $color-primary;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }

  // Variants
  &--primary {
    background-color: $color-primary;
    color: $color-text-inverse;

    &:hover:not(:disabled) {
      background-color: darken($color-primary, 10%);
    }
  }

  &--secondary {
    background-color: $color-bg-tertiary;
    color: $color-text-primary;

    &:hover:not(:disabled) {
      background-color: lighten($color-bg-tertiary, 10%);
    }
  }

  &--ghost {
    background-color: transparent;
    border: 1px solid $color-bg-tertiary;
    color: $color-text-primary;

    &:hover:not(:disabled) {
      background-color: $color-bg-tertiary;
    }
  }

  &--danger {
    background-color: $color-danger;
    color: $color-text-inverse;

    &:hover:not(:disabled) {
      background-color: darken($color-danger, 10%);
    }
  }

  // Sizes
  &--sm {
    padding: $spacing-xs $spacing-md;
    font-size: $font-size-small;
  }

  &--lg {
    padding: $spacing-md $spacing-xl;
    font-size: $font-size-large;
  }

  // States
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--loading {
    pointer-events: none;
  }
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

---

## SCSS Variables & Imports

### Always include in new component SCSS files:
```scss
@import '../../styles/variables';
// Then use: $color-primary, $spacing-md, $font-size-body, etc.
```

### Available SCSS Variables (from `_variables.scss`):
```scss
// Colors
$color-bg-primary: #0f172a;
$color-bg-secondary: #1e293b;
$color-bg-tertiary: #334155;
$color-surface: #1a1f2e;
$color-primary: #3b82f6;
$color-secondary: #10b981;
$color-tertiary: #f59e0b;
$color-danger: #ef4444;
$color-info: #06b6d4;
$color-text-primary: #f1f5f9;
$color-text-secondary: #cbd5e1;
$color-text-tertiary: #94a3b8;
$color-text-inverse: #0f172a;

// Spacing
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 24px;
$spacing-2xl: 32px;
$spacing-3xl: 48px;

// Font
$font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
$font-size-h1: 32px;
$font-size-h2: 24px;
$font-size-h3: 20px;
$font-size-body-lg: 18px;
$font-size-body: 16px;
$font-size-small: 14px;
$font-size-label: 12px;
$font-size-caption: 11px;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semi-bold: 600;
$font-weight-bold: 700;

// Border Radius
$radius-sm: 4px;
$radius-md: 8px;
$radius-lg: 12px;
$radius-xl: 16px;

// Shadows
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2);
$shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.3);

// Transitions
$transition-fast: 150ms ease-out;
$transition-standard: 300ms ease-out;
$transition-slow: 500ms ease-out;

// Breakpoints
$breakpoint-mobile: 640px;
$breakpoint-tablet: 1024px;
```

---

## Naming Conventions

### CSS Classes (BEM - Block Element Modifier)
```scss
.component-name {
  // Block
}

.component-name__element {
  // Block__Element
}

.component-name--modifier {
  // Block--Modifier
}

.component-name__element--modifier {
  // Block__Element--Modifier
}
```

**Example:**
```scss
.game-card {
  // Main block
}

.game-card__header {
  // Element
}

.game-card__status {
  // Element
}

.game-card__status--active {
  // Element with modifier
}

.game-card--compact {
  // Block with modifier
}
```

### TypeScript Naming
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase prefixed with `use` (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `validateEmail.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Interfaces**: PascalCase prefixed with `I` or suffixed with `Props` (e.g., `IUser` or `UserProps`)

---

## API Integration

### ApiService Pattern
All API calls go through `ApiService.ts`:

```typescript
const response = await ApiService.get('/api/games/:gameId');
const data = await ApiService.post('/api/games', gameData);
const updated = await ApiService.put('/api/games/:gameId', updates);
const result = await ApiService.delete('/api/games/:gameId');
```

### Error Handling
```typescript
try {
  const user = await ApiService.get('/api/users/me');
  setUser(user);
} catch (error) {
  if (error.status === 401) {
    // Handle unauthorized
  } else {
    // Handle other errors
    showToast(error.message, 'error');
  }
}
```

---

## State Management

### Using Zustand (Recommended)
Create stores in `src/store/`:

```typescript
import { create } from 'zustand';
import { IGame } from '../datamodels/tictactoe';

interface GameStore {
  currentGame: IGame | null;
  setCurrentGame: (game: IGame) => void;
  clearCurrentGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentGame: null,
  setCurrentGame: (game) => set({ currentGame: game }),
  clearCurrentGame: () => set({ currentGame: null }),
}));
```

### Usage in Components
```typescript
const GameplayPage: FC = () => {
  const { currentGame, setCurrentGame } = useGameStore();

  useEffect(() => {
    fetchGame().then(setCurrentGame);
  }, []);

  return <div>{currentGame?.id}</div>;
};
```

---

## Responsive Design Pattern

### Using SCSS Mixins (add to `_mixins.scss`)
```scss
@mixin mobile-only {
  @media (max-width: $breakpoint-mobile) {
    @content;
  }
}

@mixin tablet-and-up {
  @media (min-width: $breakpoint-mobile + 1px) {
    @content;
  }
}

@mixin desktop-only {
  @media (min-width: $breakpoint-tablet + 1px) {
    @content;
  }
}
```

### Usage in Components
```scss
.card {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  @include tablet-and-up {
    flex-direction: row;
  }

  @include desktop-only {
    max-width: 1200px;
  }
}
```

---

## Form Validation

### Patterns for Form Components
```typescript
interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginForm: FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (formData.password.length < 8) newErrors.password = 'Min 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await ApiService.post('/api/auth/login', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
      />
      <Button type="submit">Login</Button>
    </form>
  );
};
```

---

## Accessibility Checklist for Every Component

- [ ] Semantic HTML: `<button>` not `<div onClick>`
- [ ] ARIA labels on icon-only buttons: `aria-label="Close"`
- [ ] Focus visible on all interactive elements
- [ ] Color not sole means of information (e.g., labels with icons)
- [ ] Contrast ratio ≥ 7:1 for text
- [ ] Keyboard navigation: Tab, Enter, Escape work
- [ ] Alt text on images (if any)
- [ ] Form labels associated with inputs: `<label htmlFor="email">`
- [ ] ARIA live regions for dynamic content

---

## Testing Guidelines

### Component Testing with Vitest
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

## Common Pitfalls to Avoid

1. ❌ Inline styles: Use SCSS modules instead
2. ❌ Hardcoded colors: Use `$color-*` variables
3. ❌ Missing TypeScript types: Every prop interface must be explicit
4. ❌ Components without accessibility: Missing labels, focus indicators, ARIA
5. ❌ No responsive design: Components must work on mobile, tablet, desktop
6. ❌ Over-complex monolithic components: Break into smaller reusable pieces
7. ❌ Direct DOM manipulation: Use React state/props instead of `document.querySelector`
8. ❌ Unhandled API errors: Always wrap API calls in try-catch with user feedback
9. ❌ No loading states: Show spinners/skeletons during async operations
10. ❌ Prop drilling: Use Context API or Zustand for shared state

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start Vite dev server with HMR

# Build & Deploy
npm run build            # Build production bundle
npm run preview          # Preview production build locally

# Linting & Formatting
npm run lint             # Run ESLint
npm run lint --fix       # Fix lint errors

# Testing
npm run test             # Run tests with Vitest
npm run test:coverage    # Generate coverage report
```

---

## Page Development Checklist

When building a new page, ensure:

- [ ] Created page file in `src/components/Pages/`
- [ ] Added route in routing configuration
- [ ] Imported and used `Navigation` component
- [ ] All TypeScript types defined
- [ ] SCSS module created with `_variables.scss` import
- [ ] Mobile responsive (tested at 360px, 768px, 1024px)
- [ ] Accessibility review (keyboard nav, focus, ARIA)
- [ ] Error states handled and displayed
- [ ] Loading states with spinners/skeletons
- [ ] Empty states with helpful messaging
- [ ] API error handling with user feedback
- [ ] Form validation (if applicable)

---

## When in Doubt

1. **Color**: Check `DESIGN_SYSTEM.md` - all colors are predefined
2. **Spacing**: Use `$spacing-*` variables (xs, sm, md, lg, xl, 2xl, 3xl)
3. **Typography**: Use semantic heading components, check font sizes in DESIGN_SYSTEM.md
4. **Component exists?**: Check `PAGE_STRUCTURE.md` for shared component library
5. **Layout pattern**: Check other pages in `src/components/Pages/` for similar layouts
6. **API endpoint**: Check backend `server.py` for available routes
7. **State needed?**: Use Zustand store in `src/store/`
8. **Need a hook?**: Create in `src/hooks/` with `use` prefix

---

## Architecture Decision Records (ADRs)

### Why SCSS Modules with BEM?
- Type-safe styles (SCSS + TypeScript)
- No CSS class conflicts
- Easy refactoring
- Self-documenting naming

### Why Zustand over Redux?
- Simpler, less boilerplate
- Smaller bundle size
- Easier to learn and maintain
- Sufficient for app complexity

### Why Vite over Create React App?
- Faster build and HMR
- Modern ES modules
- Smaller default bundle
- Better DX

---

