<!--
THIS FILE IS AUTO GENERATED
THIS FILE !!SHOULD!! BE COMMITED
SEE 'tools/gen-config-schema.js'
-->

# Config

All of the options available in KOLint's config file. JSON schema available at `lib/config.schema.json` in the package.

| name | type | description | default |
| :- | :- | :- | :- |
| framework | `object` | Framework function. Only available in JavaScript config files. `function (filepath, options): { bindinghandlers, viewmodels }` | `undefined` |
| out | `string` | Output directory, works similarly to tsconfig's outDir. | `undefined` |
| outExt | `string` | TS output file extension, should start with dot. | `undefined` |
| root | `string,boolean` | Root directory, defaults to cwd. | `undefined` |
| severity | `object` | Severity for rules. Map with the key with the diagnostic name or code and the value as 'off', 'warning' or 'error'. | `undefined` |

_Do not edit this documentation file._
