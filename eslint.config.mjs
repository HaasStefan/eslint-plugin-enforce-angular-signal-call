import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
    {files: ["**/*.{js,mjs,cjs,ts}"]},
    {ignores: ["lib"]},
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["*.config.*"],
                    defaultProject: "tsconfig.json"
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
];
