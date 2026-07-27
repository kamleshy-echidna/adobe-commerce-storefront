# Mega Menu Block

## Overview

The Mega Menu block builds a nested category navigation menu from the Adobe Commerce catalog. At decoration time it fetches the store category tree via the Catalog Service GraphQL API and renders a multi-level `<ul>` / `<li>` structure with links to category pages. It is intended for use inside the header navigation (for example, as the submenu of a top-level nav item such as "Products").

## Integration

### Block Configuration

The block does not read authored configuration from the DOM. Category behavior is controlled by constants in `mega-menu.js`:

| Option | Default | Effect |
|--------|---------|--------|
| `ROOT_CATEGORY_ID` | `"2"` | Commerce category ID used as the root of the menu tree. Confirm this matches your store's root category. |
| `MAX_DEPTH` | `3` | Maximum category depth to fetch and render (root → category → subcategory → leaf). |

The Universal Editor model exposes an optional `title` field for authoring labels in da.live; it is not used by the block decoration logic.

### GraphQL Integration

The block uses `CS_FETCH_GRAPHQL` from `scripts/commerce.js` and the `GET_CATEGORY_CHILDREN` query to load categories by ID. Each level requests `id`, `name`, `urlPath`, and `children`, then recursively fetches child categories until `MAX_DEPTH` is reached or a category has no children.

Category links are rendered as `/{urlPath}` (for example, `/gear/bags`).

### URL Parameters

No URL parameters affect this block's behavior.

### Local Storage

No localStorage keys are used by this block.

### Events

This block does not emit or listen to any custom events.

## Behavior Patterns

### Placement in Navigation

1. **Inside a nav `<li>`** (typical header usage): The block element is replaced entirely by the generated category `<ul>`, so the submenu becomes a direct child of the parent nav item.
2. **Standalone**: If the block is not inside a parent `<li>`, its children are replaced with the generated `<ul>` while the block wrapper remains.

### Menu Structure

- Top-level menu items are the direct children of `ROOT_CATEGORY_ID`.
- Each category with descendants renders a nested `<ul>` under its `<li>`.
- Categories with a `urlPath` render as anchor links; categories without a `urlPath` render as plain text.

### User Interaction Flows

1. **Page load**: The block fetches the category tree asynchronously during decoration.
2. **Navigation**: Users click category links to navigate to Commerce category listing pages.
3. **Header integration**: Dropdown and keyboard behavior for the parent nav item are handled by the header block; this block only supplies the submenu markup.

### Error Handling

- **Empty catalog**: If the root category is missing or has no children, decoration exits early and no menu is rendered.
- **Missing nodes**: If a category ID returns no data, that branch is omitted from the tree.
- **GraphQL failures**: Errors from `CS_FETCH_GRAPHQL.fetchGraphQl` propagate to the caller; the block does not render a fallback UI.

## Files

- `mega-menu.js` - Fetches the category tree and renders nested navigation markup
- `_mega-menu.json` - Universal Editor model and block definition
