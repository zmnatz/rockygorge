---
name: mui-emotion-specialist
description: Use ONLY when styling components with MUI and Emotion to ensure consistency with design patterns and theme usage.
---

# MUI & Emotion Specialist

This skill ensures that all UI components follow the project's design language using Material UI (MUI) and Emotion.

## Guidelines
- **Theme Usage**: Always use the theme provided by MUI via `useTheme` or `styled(Component)(({ theme }) => ({ ... }))`. Avoid hardcoded color or spacing values.
- **Styled Components**: Use Emotion's `styled` utility for complex styles and MUI's `sx` prop for simple, one-off adjustments.
- **Component Choice**: Prefer MUI's built-in components (e.g., `Box`, `Typography`, `Container`, `Grid`) over raw HTML elements.
- **Responsiveness**: Use MUI's breakpoint system (e.g., `xs`, `sm`, `md`, `lg`, `xl`) consistently.
- **Consistency**: Mimic existing styles in `src/components/` to maintain a cohesive look and feel.
