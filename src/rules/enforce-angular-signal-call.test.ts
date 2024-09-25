import {RuleTester} from "@typescript-eslint/rule-tester";
import {enforceAngularSignalCallRule} from "./enforce-angular-signal-call";
import * as vitest from "vitest";
import path from "node:path";
import tseslint from "typescript-eslint";

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            projectService: {
                allowDefaultProject: ["*.ts*"],
                defaultProject: "tsconfig.json",
            },
            tsconfigRootDir: path.join(__dirname, "../.."),
        },
    },
});

ruleTester.run("enforce-angular-signal-call", enforceAngularSignalCallRule, {
    valid: [
        {
            code: `
            import {WritableSignal, signal} from "@angular/core";

            let x: WritableSignal<string> = signal("init");
            
            x.set("hello");
            `
        },
        {
            code: `
            import {WritableSignal, signal} from "@angular/core";

            let x: WritableSignal<string> = signal("init");
            
            x.update("hello");
            `
        },
        {
            code: `
            import {WritableSignal, signal} from "@angular/core";

            class HelloWorld {
                x: WritableSignal<string> = signal("init");
                
                constructor() {
                    this.x.set("hello");
                }
            }
            `
        },
        {
            code: `
            import {WritableSignal, signal, effect, untracked} from "@angular/core";

            class HelloWorld {
                x: WritableSignal<string> = signal("init");
                
                constructor() {
                  effect(() => {
                   console.log(untracked(this.x));
                   }); 
                }
            }
            `
        },

    ],
    invalid: [
        {
            name: 'x = "hello"',
            code: `
             import {WritableSignal, signal} from "@angular/core";  
             
             let x: WritableSignal<string> = signal("init");
             x = "hello";
             `,  // Invalid case where signal is accessed but not called
            errors: [{messageId: 'enforceAngularSignalCall'}],
        },
        {
            name: 'console.log(x)',
            code: `
             import {WritableSignal, signal} from "@angular/core";  
             
             let x: WritableSignal<string> = signal("init");
              
             console.log(x); 
             `,  // Invalid case where signal is accessed but not called
            errors: [{messageId: 'enforceAngularSignalCall'}],
        },
        {
            name: 'let y = computed(() => x)',
            code: `
             import {WritableSignal, signal, computed} from "@angular/core";  
             
             let x: WritableSignal<string> = signal("init");
             let y = computed(() => x); 
             `,  // Invalid case where signal is accessed but not called
            errors: [{messageId: 'enforceAngularSignalCall'}],
        },
        {
            name: 'const y = mySignal',
            code: `
             import {WritableSignal, signal} from "@angular/core";  
             
             let x: WritableSignal<string> = signal("init");
              
            (() => {
              const y = mySignal;
            })(); 
             `,  // Invalid case where signal is accessed but not called
            errors: [{messageId: 'enforceAngularSignalCall'}],
        },
    ],
});
