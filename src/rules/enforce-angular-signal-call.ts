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

        const {sourceCode} = context;

        // Check if we have access to TypeScript's parser services
        const services = sourceCode.parserServices;

        if (!services || !services.program || !services.esTreeNodeToTSNodeMap) {
            return {};
        }

        const checker = services.program.getTypeChecker();

        return {
            VariableDeclaration(node: TSESTree.VariableDeclaration) {
                // do nothing
            },
            AssignmentExpression(node: TSESTree.BinaryExpression) {
                const variableNode = services.esTreeNodeToTSNodeMap?.get(node.left);

                if (variableNode) {
                    // Get the type of the variable using the type checker
                    const type = checker.getTypeAtLocation(variableNode);

                    // Convert the type to a readable string
                    const typeName = checker.typeToString(type);

                    console.log(typeName)

                    if (isSignal(typeName)) {
                        context.report({
                            node: node,
                            messageId: 'enforceAngularSignalCall',
                        });
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
