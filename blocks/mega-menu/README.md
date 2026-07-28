# Mega Menu Block

## Overview

The Mega Menu block builds a nested category navigation menu from the Adobe Commerce catalog. At decoration time it fetches the store category tree via the Catalog Service GraphQL API and renders a multi-level `<ul>` / `<li>` structure with links to category pages. It is intended for use inside the header navigation (for example, as the submenu of a top-level nav item such as "Products").

## Integration

### Block Configuration

The block is a `key-value-block`: authors provide configuration as rows in a two-column table. All rows are optional and fall back to the defaults below.

| Key | Default | Effect |
|--------|---------|--------|
| `root` | `"2"` | Commerce category ID used as the root of the menu tree. `"2"` is the default store root ("Default Category"). Set it to start the menu from a sub-tree. |
| `depth` | `3` | Maximum category depth to fetch and render (root → category → subcategory → leaf). |
| `title` | – | Optional authoring label only. Not used by the decoration logic. |

Configuration is read from the DOM with `readBlockConfig`. The defaults live as `DEFAULT_ROOT_CATEGORY_ID` and `DEFAULT_MAX_DEPTH` constants in `mega-menu.js`.

### GraphQL Integration

The block uses `CS_FETCH_GRAPHQL` (Catalog Service) from `scripts/commerce.js` and the `GET_CATEGORY_CHILDREN` query to load categories by ID. Each level requests `id`, `name`, `urlPath`, and `children`. In the Catalog Service schema, `children` is a list of child category **IDs** (`[String!]`), so the block fetches all of a node's children in a **single batched request** per level and reuses that data — a node is never fetched more than once.

Category pages in this site are **flat documents** with slashes replaced by dashes, so the block converts the catalog `urlPath` accordingly: `collections/new-luma-yoga-collection` → `/collections-new-luma-yoga-collection`. Links are then wrapped in `rootLink()` so store-view root paths and locale prefixes are respected. (The slash form, `/collections/new-luma-yoga-collection`, 404s.)

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
- **GraphQL failures**: Errors from `CS_FETCH_GRAPHQL.fetchGraphQl` are caught, logged with `console.warn`, and the block renders nothing rather than throwing.

## Files

- `mega-menu.js` - Fetches the category tree and renders nested navigation markup
- `mega-menu.css` - Scoped fallback styles for standalone usage (header submenu styles apply when nested in a nav `<li>`)
- `_mega-menu.json` - Universal Editor model and block definition

## Document Authoring Library

Code registration (`component-definition.json`, `component-models.json`, `component-filters.json`) makes the block available in **Universal Editor** (click `+` in a section on `ue.da.live`). It does **not** automatically add the block to the **da.live Library** sidekick.

The Library lists blocks from **DA content**, not from the Git repo. If Feature Card appears in Library but Mega Menu does not, Feature Card was added to your library content manually (for example during Site Creator setup) and Mega Menu still needs the same steps.

### Add Mega Menu to the Library

Follow the [Setup library](https://docs.da.live/administrators/guides/setup-library) guide:

1. **Create a block document** in DA content, for example `library/blocks/mega-menu`, with this table:

   | Mega Menu | |
   | --- | --- |
   | title | Products |

   The `title` value is optional and only used as an authoring label.

2. **Add a row** to your `library/blocks` sheet:

   | name | path |
   | --- | --- |
   | Mega Menu | `https://content.da.live/{org}/{site}/library/blocks/mega-menu` |

   Replace `{org}` and `{site}` with your DA org and site (for example `kamleshy-echidna` / `adobe-commerce-storefront`).

3. **Preview and publish** the block document and the blocks sheet.

4. **Verify** by opening any page in da.live, expanding **Library → Blocks**, and confirming **Mega Menu** appears.

A reference block table is in `drafts/library-blocks/mega-menu.plain.html`.

### Typical placement

Add Mega Menu inside the `/nav` fragment, nested under a top-level nav item (inside the parent `<li>` for "Products"). The block replaces itself with the category `<ul>` at decoration time.

