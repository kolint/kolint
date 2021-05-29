# Using the CLI

The package `knockout-lint` comes with the cli which can be used with both `knockout-lint` and `kolint`.

## Installation

You can also try to package without installing it using `npx knockout-lint`.

```sh
npm i knockout-lint -g # install globally
npm i knockout-lint -D # install as dev dependency
```

## Usage
KOLint is used with one or more arguments as glob patterns or filenames to the view files.

```sh
kolint views/**/*.html
```

## Help

See all the available argument flags and help by using:

```
kolint --help
```
