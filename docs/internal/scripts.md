# Scripts

Scripts defined in package.json. May be outdated.

<br>

| FLAG | MEANING         |
| :--- | :-------------- |
| 🏴‍☠️   | depricated script |

<br>

|       name        |              description              |                          script                           |
| :---------------: | :-----------------------------------: | :-------------------------------------------------------: |
|      install      |           NPM install hook            | `node tools/gen-config-schema.js --no-docs --no-override` |
|       build       |      TS build and compile-parser      |  `npx tsc --build . spec demo && npm run compile-parser`  |
|       watch       |               TS watch                |           `npx tsc --build . spec demo --watch`           |
|       test        |           Run specification           |                `node ./spec/build/spec.js`                |
|       demo        |              Run demo 🏴‍☠️              |             `node ./demo/build/lint.test.js`              |
|       lint        |              Run ESLint               |         `npx eslint src/**/*.ts spec/src/**/*.ts`         |
|  compile-parser   |    Compile lib/document-parser.js     |          `node build/parser/parser-compiler.js`           |
| gen-config-schema | Generate JSON schema and config.md 🏴‍☠️ |             `node tools/gen-config-schema.js`             |