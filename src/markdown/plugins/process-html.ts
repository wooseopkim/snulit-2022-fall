import { Element, Node, Root, Text } from 'hast';
import is from 'hast-util-is-element';
import h from 'hastscript';
import { Parent } from 'unist';
import visit, { SKIP } from 'unist-util-visit';

export default function processHtml() {
  return (tree: Root) => {
    visit<Element>(tree, 'element', removeEmpty);
    visit<Element>(tree, 'element', buildDivs.bind(undefined, tree));
    visit<Element>(tree, 'element', markParagraphsWithNotes);
  };
};

function removeEmpty(node: Element, index: number, parent: Parent | undefined) {
  if (!isEmpty(node)) {
    return;
  }
  
  if (parent?.type === 'element') {
    parent.children.splice(index, 1);
  }
  return [SKIP, index] as [typeof SKIP, number];
}

function buildDivs(root: Root, node: Element, _: number, parent: Parent | undefined) {
  if (node.data?.skip || parent === undefined || !root.children.includes(parent as any) || !is(node, 'p')) {
    return;
  }

  node.tagName = 'div';

  buildParagraphs(node);
}

function buildParagraphs(node: Element, index: number = 0) {
  if (node.children.some(isNote)) {
    const merged: Node[] = [];
    
    while (index < node.children.length) {
      const current = node.children[index];
      const next = node.children[index + 1];

      node.children.splice(index, 1);
      merged.push(current);
      
      if (intendsNewline(current, (value) => value.endsWith('\n')) || intendsNewline(next, (value) => value.startsWith('\n'))) {
        break;
      }
    }
    
    const count = merged.length;
    if (count > 0) {
      const p = h('p', merged);
      node.children.splice(index, count - 1, p);
      
      if (node.children.length > 0) {
        buildParagraphs(node, index + 1);
      }

      return;
    }
  }
  
  visit<Node>(node, ['element', 'text'], buildParagraph.bind(undefined, node));
}

function buildParagraph(paragraph: Element, node: Node, index: number, parent: Parent | undefined) {
  if (paragraph !== parent || !isInline(node)) {
    return;
  }

  const previousSibling = parent.children[index - 1];
  const newSibling = (previousSibling as Element)?.children?.[(previousSibling as Element)?.children?.length - 1];
  const mergeable = node.data?.mergeable
    || is(previousSibling, 'p')
    && isInline(newSibling)
    && doesNotIntendNewline(newSibling, (value) => value.endsWith('\n'))
    && doesNotIntendNewline(node, (value) => value.startsWith('\n'));
  if (mergeable) {
    (previousSibling as Element).children.push(node as any);
    parent.children.splice(index, 1);
    return [SKIP, index];
  }

  const p = h('p', node);
  parent.children[index] = p;
}

function markParagraphsWithNotes(node: Element, index: number, parent: Parent | undefined) {
  if (!isNote(node)) {
    return;
  }
  
  const previousSibling = parent?.children?.[index - 1];
  const properties = (previousSibling as Element)?.properties;
  if (properties !== undefined) {
    properties.className = [...((properties.className as string[]) ?? []), 'before-note']
  }
}

function isNote(node: Node) {
  const className = (node as Element).properties?.className;
  if (Array.isArray(className)) {
    return className.includes('footnote') || className.includes('endnote-call');
  }
  if (typeof className === 'string') {
    return className === 'footnote' || className === 'endnote-call';
  }
  return false;
}

function isInline(node: Node) {
  return node?.type === 'text' || is(node, 'em');
}

const intendsNewline: typeof doesNotIntendNewline = (node, intend) => !doesNotIntendNewline(node, intend);

function doesNotIntendNewline(node: Node | undefined, intend: (value: string) => boolean) {
  if (node?.type === 'text') {
    const { value } = (node as Text);
    return !intend(value);
  }
  if (node?.type === 'element') {
    return (node as Element).children.every((child) => doesNotIntendNewline(child, intend));
  }
  return true;
}

function isEmpty(node: Node) {
  if (node.type === 'element') {
    return isEmptyElement(node as Element);
  }
  if (node.type === 'text') {
    return isEmptyText(node as Text);
  }
  return false;
}

function isEmptyElement(element: Element) {
  if (element.tagName === 'hr') {
    return false;
  }
  if (element.tagName === 'br') {
    return true;
  }
  if (element.children.length > 0 && element.children.every(isEmpty)) {
    return true;
  }
  if (Object.keys(element.properties ?? {}).length === 0 && element.children.length === 0) {
    return true;
  }
  return false;
}

function isEmptyText(text: Text) {
  if (text.value.trim().length === 0) {
    return true;
  }
  return false;
}
