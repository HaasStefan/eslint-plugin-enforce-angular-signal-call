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
            enforceAngularSignalCall: 'An Angular signal should be called with its getter method',
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

                            if (outerParent.type === 'PropertyDefinition') return;

                            if (outerParent.type === 'AssignmentExpression'
                                && outerParent.right.type === 'CallExpression'
                                && isSignalAssignment(outerParent.right))
                                return;

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

                            if (parent.callee.type === 'Identifier' || parent.callee.type === 'MemberExpression') {
                                // Get the TypeScript AST node for the callee (the function being called)
                                const calleeTsNode = services.esTreeNodeToTSNodeMap?.get(parent.callee);

                                if (calleeTsNode) {
                                    // Get the type of the function being called
                                    const calleeType = checker.getTypeAtLocation(calleeTsNode);

                                    // Get the function signature (we assume it's a function call)
                                    const signatures = calleeType.getCallSignatures();

                                    if (signatures.length > 0) {
                                        const signature = signatures[0]; // First signature for simplicity

                                        if (signature.parameters.length > 0 && parent.arguments.length > 0) {

                                            for (let i = 0; i < Math.min(signature.parameters.length, parent.arguments.length); i++) {
                                                const paramSymbol = signature.parameters[i];
                                                const arg = parent.arguments[i];
                                                const argTsNode = services.esTreeNodeToTSNodeMap?.get(arg);

                                                if (argTsNode) {
                                                    const argType = checker.getTypeAtLocation(argTsNode);
                                                    const paramType = checker.getTypeOfSymbolAtLocation(paramSymbol, calleeTsNode);
                                                    const paramTypeName = checker.typeToString(paramType);

                                                    // If the parameter type is a signal, enforce the signal getter rule
                                                    if (!isSignal(paramTypeName) && isSignal(checker.typeToString(argType))) {
                                                        context.report({
                                                            node: node,
                                                            messageId: 'enforceAngularSignalCall',
                                                        });
                                                        return;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
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


function isSignalAssignment(node: TSESTree.CallExpression) {
    return node.callee.type === 'Identifier' && node.callee.name === 'signal';
}
