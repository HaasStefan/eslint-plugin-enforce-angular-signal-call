import {ESLintUtils, TSESTree} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => `https://your-plugin-docs.com/rule/${name}`);

export const enforceAngularSignalCallRule = createRule({
    name: 'enforce-angular-signal-call',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow console.log',
        },
        messages: {
            enforceAngularSignalCall: 'Using console.log is not allowed.',
        },
        schema: [], // No options
    },
    defaultOptions: [],
    create(context) {
        return {
            CallExpression(node: TSESTree.CallExpression) {
                const callee = node.callee;
                if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && callee.object.name === 'console' && callee.property.type === 'Identifier' && callee.property.name === 'log') {
                    context.report({
                        node,
                        messageId: 'enforceAngularSignalCall',
                    });
                }
            },
        };
    },
});
