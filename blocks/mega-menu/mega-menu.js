import { CS_FETCH_GRAPHQL } from '../../scripts/commerce.js';

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

const ROOT_CATEGORY_ID = '2'; // TODO: confirm this matches your store's root
const MAX_DEPTH = 3; // Products -> category -> subcategory -> leaf

async function fetchCategoryLevel(ids) {
  const response = await CS_FETCH_GRAPHQL.fetchGraphQl(CATEGORY_QUERY, {
    variables: { ids },
  });
  return response?.data?.categories ?? [];
}

async function buildTree(id, depth) {
  const [node] = await fetchCategoryLevel([id]);
  if (!node) return null;
  if (depth >= MAX_DEPTH || !node.children?.length) {
    return { ...node, childNodes: [] };
  }
  const children = await fetchCategoryLevel(node.children);
  const childNodes = await Promise.all(
    children.map((child) => buildTree(child.id, depth + 1)),
  );
  return { ...node, childNodes };
}

function renderNode(node) {
  const li = document.createElement('li');
  if (node.urlPath) {
    const a = document.createElement('a');
    a.href = `/${node.urlPath}`;
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

export default async function decorate(block) {
  const tree = await buildTree(ROOT_CATEGORY_ID, 0);
  if (!tree?.childNodes?.length) return;
  const ul = document.createElement('ul');
  tree.childNodes.forEach((node) => ul.append(renderNode(node)));
  const parentLi = block.closest('li');
  if (parentLi) {
    block.replaceWith(ul);
  } else {
    block.replaceChildren(ul);
  }
}
