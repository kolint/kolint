# Using the CLI

KOLint's package name `knockout-lint` is not to be confused with the cli name `kolint`.

## Installation

You can also try to package without installing it using `npx knockout-lint`.

```sh
npm i knockout-lint -g # install globally
npm i knockout-lint -D # install as dev dependency
```

## Usage
`kolint` is used with one or more arguments as glob patterns to the view files.

```sh
kolint views/**/*.html
```

## Config

Create a new file called `.kolint.js` (preferably), `.kolint.json` or `.kolint.yml`. The file will be automatically used by `kolint` if the config flag is not used.

{% hint style='tip' %}
Use can specify a custom filename with the argument flag `--config`, or the shorthand `-c` or disable automatic config import by using `--no-config`.
{% endhint %}

## Help

See all the available argument flags and help by using:

```
kolint --help
```
