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
            import {WritableSignal, signal} from "@angular/core";

            class HelloWorld {
                x: { y: WritableSignal<string> } = { y: signal("init") };
                
                constructor() {
                    this.x.y.set("hello");
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
        {
            code: `
            import {WritableSignal, signal, computed} from "@angular/core";
            
            class Progress {
              readonly mode: WritableSignal<ProgressMode | null> = signal<ProgressMode | null>(null);
              readonly isBusy = computed(() => this.mode() !== null);
            }
            `
        },
        {
            code: `
            import {WritableSignal, signal} from "@angular/core";
            
             class Test {
              private readonly x: WritableSignal<string> = signal("init");
              
              readonly y = this.x;
              }
            `
        },
        {
            code: `
            import {WritableSignal, signal} from "@angular/core";
            
            function foo(x: WritableSignal<any>) {
             console.log(x());
            }
            
            let x: WritableSignal<string> = signal("init");
            
            foo(x);
            `
        },
        {
            code: `
            
            import {WritableSignal, signal} from "@angular/core";
            
            class Test {
              something: WritableSignal<any>;
  
  constructor() {
    this.something = signal<any>(undefined);
  }

}
            `
        },
        {
            code: `
             import {WritableSignal, signal} from "@angular/core";
             
             let x: { y: WritableSignal<string> } = { };
             
             x.y = signal("init");
             x.y.set("hello");
            `
        }

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
              const y = x;
            })();
             `,  // Invalid case where signal is accessed but not called
            errors: [{messageId: 'enforceAngularSignalCall'}],
        },
        {
            name: 'foo(x)',
            code: `
            import {WritableSignal, signal} from "@angular/core";

            function foo(x: string) {
             console.log(x());
            }

            let x: WritableSignal<string> = signal("init");

            foo(x);
            `,
            errors: [{messageId: 'enforceAngularSignalCall'}],
        },
    ],
});
