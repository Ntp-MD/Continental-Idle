# Wiki Update Workflow

## Overview
The wiki is data-driven and automatically pulls from game data files. When you add new features or game details, update the wiki by editing `src/data/wiki/index.ts`.

## Structure

### Data Source Files
- `src/data/themes.ts` - Theme definitions (automatically used by wiki)
- `src/data/buildings.ts` - Building definitions (automatically used by wiki)
- `src/data/wiki/index.ts` - Wiki content structure

### Wiki Content Types
```typescript
type WikiContent =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 3 | 4; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'info-box'; title: string; content: string[] }
  | { type: 'warning-box'; title: string; content: string[] }
  | { type: 'code'; code: string }
```

## When Adding New Features

### 1. New Theme
- Add theme to `src/data/themes.ts`
- Wiki automatically includes it in theme tables (no wiki update needed)

### 2. New Building
- Add building to `src/data/buildings.ts`
- Wiki automatically includes it in building table (no wiki update needed)

### 3. New Game Mechanic
- Add new section to `wikiSections` in `src/data/wiki/index.ts`
- Example:
```typescript
{
  id: 'new-mechanic',
  title: 'New Mechanic Name',
  content: [
    { type: 'paragraph', text: 'Description of the mechanic' },
    { type: 'list', items: ['Feature 1', 'Feature 2'] }
  ]
}
```

### 4. Update Existing Section
- Find the section in `wikiSections`
- Edit the `content` array
- Use markdown syntax: `**bold**` for bold text

## Automatic Updates

The following are automatically updated from game data:
- Theme count (from THEMES array)
- Building count (from BUILDINGS array)
- Theme tables (name, city, currency, accent, unlock prestige)
- Building tables (name, base rate, base cost)

## Manual Updates Required

These require manual updates in `src/data/wiki/index.ts`:
- Feature descriptions
- Mechanic explanations
- Tutorial text
- Roadmap phases
- Technical specifications

## Best Practices

1. **Keep it synced**: When adding a feature, immediately update the wiki
2. **Use templates**: Copy existing section structures for new sections
3. **Test in-game**: Open the wiki in-game to verify changes
4. **Consistent formatting**: Use the same content types as existing sections
5. **Markdown support**: Use `**text**` for bold, the renderer handles it

## Example: Adding a New Section

```typescript
// In src/data/wiki/index.ts
{
  id: 'new-feature',
  title: 'New Feature',
  content: [
    {
      type: 'paragraph',
      text: '**New Feature** allows players to do X, Y, and Z.'
    },
    {
      type: 'heading',
      level: 3,
      text: 'How It Works'
    },
    {
      type: 'list',
      items: [
        'Step 1: Do this',
        'Step 2: Do that',
        'Step 3: Profit'
      ]
    },
    {
      type: 'info-box',
      title: 'Tip',
      content: [
        'Use this feature wisely for maximum benefit'
      ]
    }
  ]
}
```

## Quick Reference

| Action | File | Auto/Manual |
|--------|------|-------------|
| Add theme | `themes.ts` | Auto |
| Add building | `buildings.ts` | Auto |
| Add mechanic | `wiki/index.ts` | Manual |
| Update description | `wiki/index.ts` | Manual |
| Update roadmap | `wiki/index.ts` | Manual |
