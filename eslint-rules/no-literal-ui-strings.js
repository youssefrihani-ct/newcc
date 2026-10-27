// Fails on literal user-visible text: everything the user can read goes through t("English text") (spec 5d).

const UI_ATTRIBUTES = new Set([
  "placeholder", "title", "alt", "aria-label", "aria-description", "aria-placeholder",
  "label", "description", "tooltip", "helperText", "emptyText", "heading",
]);

const UI_PROPERTIES = new Set([
  "label", "title", "description", "placeholder", "message", "tooltip", "header",
  "heading", "emptyText", "helperText", "text", "caption", "subtitle",
]);

const UI_CALLS = new Set(["alert", "confirm", "prompt"]);
const UI_MEMBER_CALLS = new Set(["toast", "toast.success", "toast.error", "toast.info", "toast.warning"]);

const HAS_LETTER = /\p{L}/u;

function hasText(value) {
  return typeof value === "string" && HAS_LETTER.test(value);
}

function literalText(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked).join("");
  }
  return null;
}

function calleeName(callee) {
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression" && !callee.computed && callee.object.type === "Identifier") {
    return `${callee.object.name}.${callee.property.name}`;
  }
  return null;
}

export default {
  meta: {
    type: "problem",
    docs: { description: "Disallow literal user-visible text; use t(\"English text\")" },
    schema: [],
    messages: {
      literal: 'User-visible text must go through t(): {{text}}',
    },
  },
  create(context) {
    const report = (node, text) =>
      context.report({ node, messageId: "literal", data: { text: JSON.stringify(text.trim().slice(0, 40)) } });

    return {
      JSXText(node) {
        if (hasText(node.value)) report(node, node.value);
      },
      JSXExpressionContainer(node) {
        // {"Hello"} as a child (not as an attribute value, handled below)
        if (node.parent.type === "JSXElement" || node.parent.type === "JSXFragment") {
          const text = literalText(node.expression);
          if (hasText(text)) report(node, text);
        }
      },
      JSXAttribute(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : null;
        if (!name || !UI_ATTRIBUTES.has(name) || !node.value) return;
        const direct = literalText(node.value);
        if (hasText(direct)) return report(node, direct);
        if (node.value.type === "JSXExpressionContainer") {
          const text = literalText(node.value.expression);
          if (hasText(text)) report(node, text);
        }
      },
      Property(node) {
        if (node.computed || node.parent.type !== "ObjectExpression") return;
        const key = node.key.type === "Identifier" ? node.key.name : literalText(node.key);
        if (!key || !UI_PROPERTIES.has(key)) return;
        const text = literalText(node.value);
        if (hasText(text)) report(node.value, text);
      },
      CallExpression(node) {
        const name = calleeName(node.callee);
        if (!name || !(UI_CALLS.has(name) || UI_MEMBER_CALLS.has(name))) return;
        const text = literalText(node.arguments[0]);
        if (hasText(text)) report(node.arguments[0], text);
      },
    };
  },
};
