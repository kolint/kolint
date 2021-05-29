# Configuring

The type checking will be done by TypeScript and therefore the root tsconfig.json will be used. However, configuring KOLint will be done either by cli arguments (limited) or a [configuration file](#configuration-files). See [using the cli](./using-the-cli.md).

## Config file

Make a new file called `.kolint.js` (preferably), `.kolint.json` or `.kolint.yml` depending on which config language you plan to use. The file will be automatically used by KOLint cli.

{% hint style='tip' %}
Use can specify a custom filename with the flag `--config`, or the shorthand `-c`. You can also disable automatic config import by using the flag `--no-config`.
{% endhint %}

### JavaScript types

```javascript
/** @type {import('knockout-lint').ConfigOptions} */
module.exports = { ... }
```

### JSON or YAML schemas

The config schema is available in `knockout-lint/lib/config.schema.json`, which can be used with both JSON and YAML.

## Options

{% hint style='info' %}
Table below is auto-generated and should not be manually edited. See [the workflow](https://github.com/kolint/kolint/actions/workflows/config-docs.yml) on GitHub.
{% endhint %}

<!-- CONFIG TABLE START -->
<!-- CONFIG TABLE END -->

## Configuring rules

If a rule severity is modified globally, there is no way turning it on later via inline rule comments. If one or more error diagnostics is recived by the cli, it will exit with code 1.

- `"off"` will turn the rule off.
- `"warn" | "warning"` will turn of the rule as warning.
- `"error"` will turn on the rule as error.


## Inline rule comments

Rules can also be temporarly switched on and off with inline comments.

{% hint style='danger' %}
The inline rule disabling can also disable parsing and type errors. Be careful when using it!
{% endhint %}

The next example showcases how all rules and errors can be temporarly disabled. However, this is not recommended. Consider using single rule disabling instead.

```html
<!-- kolint-disable -->
All errors, warnings, type errors and parsing errors, will be ignored.
<!-- kolint-enable -->
```

The next example showcases how a single or multiple rules can be disabled using codes or names.

```html
<!-- kolint-disable TS2345 -->
<p data-bind="test: test"></p>
<!-- kolint-enable TS2345 -->
```
