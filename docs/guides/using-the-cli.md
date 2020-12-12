# Using the CLI
KOLint's package `knockout-lint` at NPM comes with a CLI ready to use.

## Installation

Install the package `knockout-lint` by using [NPM](https://nodejs.org). You can also try to package without installing it using `npx knockout-lint`.

```sh
npm i knockout-lint -g # install globally
npm i knockout-lint -D # install as dev dependency
```

## Usage
`knockout-lint` is used with one or more arguments as glob patterns to the view files.

```sh
knockout-lint views/**/*.html
```

## Config

Create a new file called `.kolint.js` (prefered), `.kolint.json` or `.kolint.yml`. The file will be automatically used.

**Note!** 
- Use can specify a custom filename with the argument option `--config`, or the shorthand option `-c`. See [#help](#help).
- Disable automatic config import by using `--no-config`.

## Help

See all the available argument options and help by using:

```
knockout-lint --help
```
