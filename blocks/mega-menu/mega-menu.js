import { readBlockConfig } from '../../scripts/aem.js';
import { CS_FETCH_GRAPHQL, rootLink } from '../../scripts/commerce.js';

const CATEGORY_QUERY = `
  query GET_CATEGORY_CHILDREN($ids: [String!]!) {
    categories(ids: $ids) {
      id
      name
      urlPath
      children
    }
  }
`;

// Commerce category id used as the root of the menu tree.
// "2" is the default store root ("Default Category"); authors can override
// it with a "root" row in the block, e.g. to start the menu from a sub-tree.
const DEFAULT_ROOT_CATEGORY_ID = '2';
// Maximum category depth to render (root -> category -> subcategory -> leaf).
const DEFAULT_MAX_DEPTH = 3;

/**
 * Fetches a set of categories by id in a single request.
 * @param {string[]} ids Commerce category ids
 * @returns {Promise<Array>} category nodes (id, name, urlPath, children)
 */
async function fetchCategoryLevel(ids) {
  const response = await CS_FETCH_GRAPHQL.fetchGraphQl(CATEGORY_QUERY, {
    variables: { ids },
  });
  return response?.data?.categories ?? [];
}

/**
 * Recursively builds the category tree from an already-fetched node.
 * Each level fetches all of a node's children in one batched request and
 * reuses that data, so a node is never fetched more than once.
 * @param {Object} node category node (must include `children` ids)
 * @param {number} depth current depth (root is 0)
 * @param {number} maxDepth maximum depth to descend
 * @returns {Promise<Object>} node with a resolved `childNodes` array
 */
async function buildTree(node, depth, maxDepth) {
  if (depth >= maxDepth || !node.children?.length) {
    return { ...node, childNodes: [] };
  }
  const children = await fetchCategoryLevel(node.children);
  const childNodes = await Promise.all(
    children.map((child) => buildTree(child, depth + 1, maxDepth)),
  );
  return { ...node, childNodes };
}

/**
 * Builds the storefront link for a category.
 * The Catalog Service returns `urlPath` as a slash-separated path
 * (e.g. "collections/new-luma-yoga-collection"), but category pages in this
 * site are flat documents with the slashes replaced by dashes
 * (e.g. /collections-new-luma-yoga-collection). rootLink adds the store-view
 * root path.
 * @param {string} urlPath slash-separated catalog url path
 * @returns {string} localized href
 */
function categoryHref(urlPath) {
  return rootLink(`/${urlPath.replace(/\//g, '-')}`);
}

/**
 * Renders a category node as an `<li>` with an optional nested `<ul>`.
 * @param {Object} node category node
 * @returns {HTMLLIElement}
 */
function renderNode(node) {
  const li = document.createElement('li');
  if (node.urlPath) {
    const a = document.createElement('a');
    a.href = categoryHref(node.urlPath);
    a.textContent = node.name;
    li.append(a);
  } else {
    const p = document.createElement('p');
    p.textContent = node.name;
    li.append(p);
  }
  if (node.childNodes?.length) {
    const ul = document.createElement('ul');
    node.childNodes.forEach((child) => ul.append(renderNode(child)));
    li.append(ul);
  }
  return li;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const rootId = config.root || DEFAULT_ROOT_CATEGORY_ID;
  const maxDepth = Number.parseInt(config.depth, 10) || DEFAULT_MAX_DEPTH;

  let tree;
  try {
    const [root] = await fetchCategoryLevel([rootId]);
    if (!root) return;
    tree = await buildTree(root, 0, maxDepth);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('mega-menu: failed to load category tree', error);
    return;
  }

  if (!tree?.childNodes?.length) return;

  const ul = document.createElement('ul');
  tree.childNodes.forEach((node) => ul.append(renderNode(node)));

  // Inside a nav <li> (typical header usage) the block replaces itself so the
  // category <ul> becomes a direct child of the parent nav item. Standalone,
  // the block wrapper is kept and its children replaced.
  if (block.closest('li')) {
    block.replaceWith(ul);
  } else {
    block.replaceChildren(ul);
  }
}
