import { Element, Node } from 'hast';
import is from 'hast-util-is-element';
import h from 'hastscript';
import visit, { SKIP } from 'unist-util-visit';

function convertParagraphs() {
  return (tree: Node) => {
    visit<Element>(tree, 'element', (node) => {
      if (!is(node, 'p') || node.data?.converted) {
        return;
      }

      node.tagName = 'div';

      visit<Node>(node, ['element', 'text'], (child, index, parent) => {
        if (parent !== node) {
          return;
        }

        if (is(child, 'br')) {
          parent.children.splice(index, 1);
          return [SKIP, index];
        }

        if (child.type === 'text' || is(child, 'em')) {
          const p = h('p', child);
          p.data = { converted: true };
          parent.children[index] = p;
        } else {
          console.warn('Unprocessable child:', child);
        }
      });
    });
  };
};

export default convertParagraphs;
