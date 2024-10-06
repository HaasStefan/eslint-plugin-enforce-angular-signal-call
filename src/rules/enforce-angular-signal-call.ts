import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

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
        const { sourceCode } = context;
        const services = sourceCode.parserServices;

        if (!services || !services.program || !services.esTreeNodeToTSNodeMap) {
            return {};
        }

        const checker = services.program.getTypeChecker();

        return {
            Identifier(node: TSESTree.Identifier) {
                const variableNode = services.esTreeNodeToTSNodeMap?.get(node);

                if (variableNode) {
                    const type = checker.getTypeAtLocation(variableNode);
                    const typeName = checker.typeToString(type);

                    if (isSignal(typeName)) {
                        handleSignalNode(node, context, services, checker);
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

function handleSignalNode(
    node: TSESTree.Identifier,
    context: any,
    services: any,
    checker: any
) {
    const parent = node.parent;

    if (parent.type === 'AssignmentExpression') {
        reportSignalCall(context, node);
    } else if (parent.type === 'MemberExpression') {
        handleMemberExpression(node, context, services, checker);
    } else if (parent.type === 'CallExpression' && !(parent.callee.type === 'Identifier' && parent.callee.name === node.name)) {
        checkCallExpression(parent, context, services, checker, node);
    } else if (parent.type === 'ArrowFunctionExpression' || (parent.type === 'VariableDeclarator' && parent.init && parent.init.type === 'Identifier' && parent.init.name === node.name)) {
        reportSignalCall(context, node);
    }
}

function handleMemberExpression(
    node: TSESTree.Identifier,
    context: any,
    services: any,
    checker: any
) {
    const outerParent = visitAllMemberExpressionsAndGetParent(node);

    if (outerParent.type === 'PropertyDefinition') return;

    if (outerParent.type === 'AssignmentExpression' && outerParent.right.type === 'CallExpression' && isSignalAssignment(outerParent.right)) return;

    if (outerParent.type === 'Property') {
        const keyNode = outerParent.key;
        if (keyNode.type === 'Identifier') {
            const keyTsNode = services.esTreeNodeToTSNodeMap?.get(keyNode);
            if (keyTsNode) {
                const keyType = checker.getTypeAtLocation(keyTsNode);
                if (isSignal(checker.typeToString(keyType))) {
                    return;
                }
            }
        }
        return;
    }

    if (outerParent.type === 'CallExpression') {
        checkCallExpression(outerParent, context, services, checker, node);
    } else {
        reportSignalCall(context, node);
    }
}

function checkCallExpression(
    parent: TSESTree.Node,
    context: any,
    services: any,
    checker: any,
    node: TSESTree.Identifier
) {
    if (parent.type !== 'CallExpression') return;

    if (parent.callee.type === 'Identifier' && parent.callee.name === 'untracked') {
        return;
    }

    if (parent.callee.type === 'Identifier' || parent.callee.type === 'MemberExpression') {
        const calleeTsNode = services.esTreeNodeToTSNodeMap?.get(parent.callee);

        if (calleeTsNode) {
            const calleeType = checker.getTypeAtLocation(calleeTsNode);
            const signatures = calleeType.getCallSignatures();

            if (signatures.length > 0) {
                const signature = signatures[0];

                if (signature.parameters.length > 0 && parent.arguments.length > 0) {
                    for (let i = 0; i < Math.min(signature.parameters.length, parent.arguments.length); i++) {
                        const paramSymbol = signature.parameters[i];
                        const arg = parent.arguments[i];
                        const argTsNode = services.esTreeNodeToTSNodeMap?.get(arg);

                        if (argTsNode) {
                            const argType = checker.getTypeAtLocation(argTsNode);
                            const paramType = checker.getTypeOfSymbolAtLocation(paramSymbol, calleeTsNode);
                            const paramTypeName = checker.typeToString(paramType);

                            if (!isSignal(paramTypeName) && isSignal(checker.typeToString(argType))) {
                                reportSignalCall(context, node);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}

function reportSignalCall(context: any, node: TSESTree.Identifier) {
    context.report({
        node: node,
        messageId: 'enforceAngularSignalCall',
    });
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
