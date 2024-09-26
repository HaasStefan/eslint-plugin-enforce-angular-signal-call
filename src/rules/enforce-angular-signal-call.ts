import {ESLintUtils, TSESTree} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/HaasStefan/eslint-plugin-enforce-angular-signal-call/tree/master/docs/rules/${name}.md`);

export const enforceAngularSignalCallRule = createRule({
    name: 'enforce-angular-signal-call',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Enforce that Angular signals are called with the getter',
        },
        messages: {
            enforceAngularSignalCall: 'Angular signals should be called with the getter.',
        },
        schema: [], // No options
    },
    defaultOptions: [],
    create(context) {

        const {sourceCode} = context;

        // Check if we have access to TypeScript's parser services
        const services = sourceCode.parserServices;

        if (!services || !services.program || !services.esTreeNodeToTSNodeMap) {
            return {};
        }

        const checker = services.program.getTypeChecker();

        return {
            Identifier(node: TSESTree.Identifier) {
                const variableNode = services.esTreeNodeToTSNodeMap?.get(node);

                if (variableNode) {
                    // Get the type of the variable using the type checker
                    const type = checker.getTypeAtLocation(variableNode);

                    // Convert the type to a readable string
                    const typeName = checker.typeToString(type);

                    if (isSignal(typeName)) {
                        const parent = node.parent;

                        if (parent.type === 'AssignmentExpression') {
                            context.report({
                                node: node,
                                messageId: 'enforceAngularSignalCall',
                            });
                        } else if (parent.type === 'MemberExpression') {
                            const outerParent = visitAllMemberExpressionsAndGetParent(node);
                            if (outerParent.type === 'AssignmentExpression' ||
                                !(outerParent.type === 'CallExpression'
                                    && outerParent.callee.type === 'MemberExpression'
                                    && outerParent.callee.property.type === 'Identifier'
                                )
                                && !(outerParent.type === 'CallExpression' && outerParent.callee.type === 'Identifier' && outerParent.callee.name === 'untracked')
                            ) {
                                context.report({
                                    node: node,
                                    messageId: 'enforceAngularSignalCall',
                                });
                            }
                        } else if (parent.type === 'CallExpression' && !(parent.callee.type === 'Identifier' && parent.callee.name === node.name)) {
                            if (parent.callee.type === 'Identifier' && parent.callee.name === 'untracked') {
                                return;
                            }

                            context.report({
                                node: node,
                                messageId: 'enforceAngularSignalCall',
                            });
                        } else if (parent.type === 'ArrowFunctionExpression') {
                            context.report({
                                node: node,
                                messageId: 'enforceAngularSignalCall',
                            });
                        } else if (parent.type === 'VariableDeclarator' && parent.init && parent.init.type === 'Identifier' && parent.init.name === node.name) {
                            context.report({
                                node: node,
                                messageId: 'enforceAngularSignalCall',
                            });
                        }
                    }
                }
            }
        };
    },
});


type Signal = `Signal<${string}>` | `WritableSignal<${string}>` | `InputSignal<${string}>`;

function isSignal(type: string): type is Signal {
    const withoutGeneric = type.split('<')[0];

    return !!withoutGeneric && ["Signal", "WritableSignal", "InputSignal"].includes(withoutGeneric);
}


function visitAllMemberExpressionsAndGetParent(node: TSESTree.Identifier) {
    let parent = node.parent;
    while (parent.type === 'MemberExpression') {
        parent = parent.parent;
    }

    return parent;
}
