import {RuleTester} from "@typescript-eslint/rule-tester";
import {enforceAngularSignalCallRule} from "./enforce-angular-signal-call";
import * as vitest from "vitest";

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester();

ruleTester.run("enforce-angular-signal-call", enforceAngularSignalCallRule, {
    valid: [{code: "let x = 1;"}],
    invalid: [
        {
            code: 'console.log("Hello");',
            errors: [{messageId: "enforceAngularSignalCall"}],
        },
    ],
});
