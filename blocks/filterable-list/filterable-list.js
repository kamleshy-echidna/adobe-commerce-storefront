import { readBlockConfig, toClassName } from '../../scripts/aem.js';

const CONFIG_KEYS = new Set(['placeholder', 'empty-message', 'search-label']);

let itemId = 0;

/**
 * Splits authored rows into optional key-value config rows and content item rows.
 * @param {Element} block
 * @returns {{ config: Record<string, string>, itemRows: Element[] }}
 */
function parseRows(block) {
  const configRows = [];
  const itemRows = [];

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    if (cols.length === 2) {
      const key = toClassName(cols[0].textContent);
      if (CONFIG_KEYS.has(key)) {
        configRows.push(row);
        return;
      }
    }
    itemRows.push(row);
  });

  const configContainer = document.createElement('div');
  configRows.forEach((row) => configContainer.append(row));
  const config = readBlockConfig(configContainer);

  return { config, itemRows };
}

/**
 * Builds a list item from one authored table row.
 * @param {Element} row
 * @returns {HTMLLIElement|null}
 */
function buildListItem(row) {
  const cols = [...row.children];
  if (cols.length < 2) return null;

  let category = '';
  let titleCol;
  let bodyCol;

  if (cols.length >= 3) {
    const [categoryCol, titleColumn, bodyColumn] = cols;
    category = categoryCol.textContent.trim();
    titleCol = titleColumn;
    bodyCol = bodyColumn;
  } else {
    const [titleColumn, bodyColumn] = cols;
    titleCol = titleColumn;
    bodyCol = bodyColumn;
  }

  const li = document.createElement('li');
  li.className = 'filterable-list-item';
  if (category) {
    li.dataset.category = category;
  }

  itemId += 1;
  const titleId = `filterable-list-title-${itemId}`;
  const heading = document.createElement('h3');
  heading.id = titleId;
  heading.className = 'filterable-list-item-title';
  if (titleCol.childNodes.length) {
    heading.append(...titleCol.childNodes);
  } else {
    heading.textContent = titleCol.textContent.trim();
  }

  const body = document.createElement('div');
  body.className = 'filterable-list-item-body';
  if (bodyCol.childNodes.length) {
    body.append(...bodyCol.childNodes);
  } else {
    body.textContent = bodyCol.textContent.trim();
  }

  li.setAttribute('aria-labelledby', titleId);
  li.append(heading, body);
  return li;
}

/**
 * Collects unique category labels from rendered list items.
 * @param {HTMLUListElement} list
 * @returns {string[]}
 */
function getCategories(list) {
  const categories = new Set();
  list.querySelectorAll('.filterable-list-item[data-category]').forEach((item) => {
    if (item.dataset.category) categories.add(item.dataset.category);
  });
  return [...categories].sort((a, b) => a.localeCompare(b));
}

/**
 * Returns true when an item matches the current search text and category.
 * @param {HTMLLIElement} item
 * @param {string} query
 * @param {string} category
 */
function itemMatches(item, query, category) {
  const matchesSearch = !query || item.textContent.toLowerCase().includes(query);
  const matchesCategory = !category || item.dataset.category === category;
  return matchesSearch && matchesCategory;
}

/**
 * Updates visible items and the live status message.
 * @param {Element} block
 * @param {HTMLUListElement} list
 * @param {HTMLInputElement} input
 * @param {Element} status
 * @param {string} activeCategory
 * @param {string} emptyMessage
 */
function applyFilters(block, list, input, status, activeCategory, emptyMessage) {
  const query = input.value.trim().toLowerCase();
  const items = [...list.querySelectorAll('.filterable-list-item')];
  let visibleCount = 0;

  items.forEach((item) => {
    const visible = itemMatches(item, query, activeCategory);
    item.toggleAttribute('hidden', !visible);
    if (visible) visibleCount += 1;
  });

  const total = items.length;
  if (visibleCount === 0) {
    status.textContent = emptyMessage;
  } else if (visibleCount === total) {
    status.textContent = `Showing all ${total} items`;
  } else {
    status.textContent = `Showing ${visibleCount} of ${total} items`;
  }

  block.classList.toggle('filterable-list-empty', visibleCount === 0);
}

/**
 * Wires search input and optional category filter buttons.
 * @param {Element} block
 * @param {HTMLUListElement} list
 * @param {HTMLInputElement} input
 * @param {Element} status
 * @param {string} emptyMessage
 * @param {string[]} categories
 */
function bindEvents(block, list, input, status, emptyMessage, categories) {
  let activeCategory = '';

  const runFilter = () => {
    applyFilters(block, list, input, status, activeCategory, emptyMessage);
  };

  input.addEventListener('input', runFilter);

  if (categories.length) {
    const categoryNav = block.querySelector('.filterable-list-categories');
    categoryNav.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-category]');
      if (!button || !categoryNav.contains(button)) return;

      activeCategory = button.dataset.category;
      categoryNav.querySelectorAll('button').forEach((btn) => {
        const isActive = btn === button;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      runFilter();
    });
  }

  runFilter();
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const { config, itemRows } = parseRows(block);
  const placeholder = config.placeholder || 'Search…';
  const emptyMessage = config['empty-message'] || 'No matching items.';
  const searchLabel = config['search-label'] || 'Search';

  const list = document.createElement('ul');
  list.className = 'filterable-list-items';

  itemRows.forEach((row) => {
    const item = buildListItem(row);
    if (item) list.append(item);
    row.remove();
  });

  const categories = getCategories(list);

  const categoryButtons = categories.map((category) => (
    `<li><button type="button" class="filterable-list-category" data-category="${category}" aria-pressed="false">${category}</button></li>`
  )).join('');

  const categoryMarkup = categories.length
    ? `<nav class="filterable-list-categories" aria-label="Filter by category"><ul>${'<li><button type="button" class="filterable-list-category active" data-category="" aria-pressed="true">All</button></li>'}${categoryButtons}</ul></nav>`
    : '';

  const fragment = document.createRange().createContextualFragment(`
    <div class="filterable-list-controls">
      <label class="filterable-list-search">
        <span class="filterable-list-search-label">${searchLabel}</span>
        <input
          type="search"
          class="filterable-list-input"
          placeholder="${placeholder}"
          autocomplete="off"
        />
      </label>
      ${categoryMarkup}
      <p class="filterable-list-status" aria-live="polite" aria-atomic="true"></p>
    </div>
  `);

  block.replaceChildren(fragment, list);

  const input = block.querySelector('.filterable-list-input');
  const status = block.querySelector('.filterable-list-status');
  bindEvents(block, list, input, status, emptyMessage, categories);
}
