# PostCSS specificity decorator

![Stability of "master" branch](https://img.shields.io/github/workflow/status/MorevM/postcss-specificity-decorator/Build/master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Last commit](https://img.shields.io/github/last-commit/morevm/postcss-specificity-decorator)
![Release version](https://img.shields.io/github/v/release/morevm/postcss-specificity-decorator?include_prereleases)
![GitHub Release Date](https://img.shields.io/github/release-date/morevm/postcss-specificity-decorator)
![Keywords](https://img.shields.io/github/package-json/keywords/morevm/postcss-specificity-decorator)

[PostCSS](https://github.com/postcss/postcss) plugin to increase the specificity of selectors via decorator-like syntax. \
Originally inspired from [postcss-increase-specificity](https://github.com/MadLittleMods/postcss-increase-specificity),
this plugin provides an easier way to pick selectors more selectively.

The main use case is to provide an easy way to increase the specificity of a selector when there is no way to control
the order of file inclusion and, accordingly, the order of selectors. \
These can be glob imports or usage of component frameworks using HOC strategy, etc. \
See details in ["Why"](#why) section.

## Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Why?](#why)
* [SASS limitations](#sass-limitations)
* [Plugin options](#plugin-options)
* [Inline plugin options](#inline-plugin-options)

## Installation

> The plugin doesn't ship with `postcss` - so make sure it's already installed.

### Using `yarn`

```bash
yarn add postcss-specificity-decorator --dev
```

### Using `npm`

```bash
npm install -D postcss-specificity-decorator
```

### Using `pnpm`

```bash
pnpm add -D postcss-specificity-decorator
```


## Usage

### Basic Example

> The plugin's default export provides a version for PostCSS 8. \
> If you need the version for PostCSS 7, import it with `/7` suffix like \
> `import specificityDecorator from 'postcss-specificity-decorator/7';`

```js
import postcss from 'postcss';
import specificityDecorator from 'postcss-specificity-decorator';
import fs from 'fs';

const input = fs.readFileSync('input.css', { encoding: 'utf8' });

const output = postcss([
  specificityDecorator({ /* options */ })
]).process(input).css;

console.log(output);
```

### Results

#### Input:

```css
/* @specificity */
.block {
  background-color: #ffffff;
}

.unchanged {
  color: rebeccapurple;
}

/* @specificity */
.foo, .bar {
  display: none;
}
```

#### Output:

```css
:not(#\9) .block {
  background-color: #ffffff;
}

.unchanged {
  color: rebeccapurple;
}

:not(#\9) .foo,
:not(#\9) .bar {
  display: inline-block;
  width: 50%;
}
```

### What it does?

It's just prepend a descendant selector piece: `:not(#\9)` (affects really nothing) repeated the specified `options.repeat` number of times.

---

## Why?

Let's imagine the situation:

```html
<div class="external-lib-class my-custom-class"></div>
```

```css
/* external lib with no write access */
.external-lib-class { overflow: hidden; }
```

```css
/* our custom styles */
.my-custom-class { overflow: visible; }
```

If external lib stylesheet comes first, the block will have `overflow: visible`. \
But if our custom styles come first, block will have `overflow: hidden;` applied (what's wrong with our intention).

Some environments don't provide a way to control the order in which stylesheets are included. Plugin solves it.

---

It seems not a big deal to increase specificity manually like `html .my-custom-class`,
but it becomes more complicated if you a trying to keep styles structure max flat as possible
(for example using [BEM methodology](https://en.bem.info/methodology/)) and/or using SCSS:

```html
<div class="block">
  <div class="block__element another-element"></div>
</div>
```

```scss
// another-element.scss
.another-element { color: #ffffff; }

// block.scss
.block {
  $b: &;

  &__element {
    color: red;

    #{$b}--active & { color: blue; }
  }
}
```

This is a very contrived example, but it shows the point. \
There needs to be a reliable way to make sure that the styles of an element take precedence over the styles of the block itself
regardless of the order in which the style files are included.

* **But...Can't we use `& &__element`?** \
  No, because nested parent selector will resolve to `.block--active .block .block__element` this way. \
  This scenario is solved by adding a modifier to the element itself instead of accessing through the parent block,
  but this is not always can be controlled (for example, in the case of using external libraries)
* **Maybe `html .block`?** \
  It actually works the same as previous example.

With plugin:

```scss
// block.scss
.block {
  $b: &;

  &__element { /* specificity */
    color: red;

    #{$b}--active & { /* specificity */
      color: blue;
    }
  }
}
```

The problem is gone. \
Yes, DX in case of using SCSS not so pleasant due [SASS limitations](#sass-limitations),
but all way better than other attempts to provide reliable mechanics.

## SASS limitations

### TL;DR

* It works only with `loud comments` because silent comments are stripped during `SCSS` -> `CSS` transformation.
* Decorator should be placed **inside** of rule, not on top. If there nested rules, decorator should be defined on each rule needed to process. \
  Good news is inner media queries can be applied automatically.

### Explanations

The main thing is, **PostCSS works with CSS**. \
It means `SCSS` -> `CSS` transformation happens **before** plugin runs, and here we are very much tied to how SASS compiler works. \
It doesn't bind comments to rules, so after transformation there is no way to know what the original comment referred to:

```scss
.block {
  /* @specificity */
  &__element {}
  /* @specificity */
  &__another-one {}
}

// It compiles into...

.block {
  /* @specificity */
  /* @specificity */
}
.block__element {}
.block__another-one {}
```

**Thats why we need to put decorator inside the rule** - just to know what it belongs to:

```scss
.block {
  &__element { /* @specificity */
    // ...
  }

  &__another-one { /* @specificity */
    // ...
  }
}
```

Nested media queries applied automatically:

```scss
.block {
  &__element { /* @specificity */
    // ...
    @media (max-width: 768px) {
      // ...
    }
  }
}

// Resolves to...

:not(#\9) .block__element {}

@media (max-width: 768px) {
  :not(#\9) .block__element {}
}
```

---

Using SASS, I believe you are mostly use the silent comments (`// comment`). \
Bad news here they are never emitted to compiled CSS, so there is no way to make it work. Only loud comments (`/* */`)

## Plugin options

* **``keyword``** \
  The keyword in comment that triggers plugin to process the rule. \
  The comment should start with that keyword to run. \
  Default: `'@specificity'`

* **``sourceType``** \
  Set it to `scss` if you are write your styles in SCSS. \
  Make sure you are read about [SASS limitations](#sass-limitations). \
  Default: `'css'`

## Inline plugin options

By default, plugin increases specificity with only one `:not(#\9)` prefix. \
If you need to increase specificity more, you must specify it explicitly by using inline `repeat` option represented by integer number:

```scss
/* @specificity 3 */
.block {}

// After transformation it becomes...
:not(#\9):not(#\9):not(#\9) .block {}
```
