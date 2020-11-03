<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/knockout-lint/knockout-lint">
    <img src="assets/logo.png" alt="Logo" width="72">
  </a>

  <h3 align="center">Knockout Lint</h3>

  <p align="center">
    Lints knockout HTML files with included TypeScript compiler and type checker
    <br />
    <a href="https://github.com/knockout-lint/knockout-lint"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#getting-started">Getting Started</a>
    <b>·</b>
    <a href="#demo">View Demo</a>
    <b>·</b>
    <a href="https://github.com/knockout-lint/knockout-lint/issues">Report Bug</a>
    <b>·</b>
    <a href="https://github.com/knockout-lint/knockout-lint/issues">Request Feature</a>
  </p>
</p>

<br>

<!-- TABLE OF CONTENTS -->
<!-- omit in toc -->
## Table of Contents

- [About The Project](#about-the-project)
  - [Built with](#built-with)
- [Getting Started](#getting-started)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [License](#license)



<!-- ABOUT THE PROJECT -->
## About The Project

This project is a lint for the [Knockout](https://knockoutjs.com/) library. The lint includes the features to lint both the HTML and the Knockout bindings, also to compile and type check the bindings with the [TypeScript Compiler API][ts-compiler-api]. We mainly focus on keeping the lint fast to lint and type check. That is why we use our own parser for HTML to only parse the necessary nodes.

### Built with
  - [meriyah][meriyah] - A 100% compliant, self-hosted javascript parser. Supports ES2020 syntax.
  - [TypeScript Compiler API][ts-compiler-api] - Superset of JavaScript that compiles to clean JavaScript output.
  - [jison][jison] - Generates bottom-up parsers in JavaScript. Its API is similar to Bison's.



<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Installation

```
npm install --save-dev NPM_PACKAGE_NAME
```

<!-- USAGE EXAMPLES -->
## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_



<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/knockout-lint/knockout-lint/issues) for a list of proposed features (and known issues).



<!-- LICENSE -->
## License

Distributed under the MIT License. See [LICENSE][license-url] for more information.



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/knockout-lint/knockout-lint.svg?style=flat-square
[contributors-url]: https://github.com/knockout-lint/knockout-lint/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/knockout-lint/knockout-lint.svg?style=flat-square
[forks-url]: https://github.com/knockout-lint/knockout-lint/network/members
[stars-shield]: https://img.shields.io/github/stars/knockout-lint/knockout-lint.svg?style=flat-square
[stars-url]: https://github.com/knockout-lint/knockout-lint/stargazers
[issues-shield]: https://img.shields.io/github/issues/knockout-lint/knockout-lint.svg?style=flat-square
[issues-url]: https://github.com/knockout-lint/knockout-lint/issues
[license-shield]: https://img.shields.io/github/license/knockout-lint/knockout-lint.svg?style=flat-square
[license-url]: https://github.com/knockout-lint/knockout-lint/blob/master/LICENSE.txt
[ts-compiler-api]: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
[meriyah]: https://github.com/meriyah/meriyah
[jison]: https://github.com/zaach/jison
[product-screenshot]: images/screenshot.png
