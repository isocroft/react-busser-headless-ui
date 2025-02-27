[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# react-busser-headless-ui (WIP)
A progressive, atomic, highly reusable, flexible and configurable headless UI component library for ReactJS.

>**HIGHLIGHTS**

- Ships with zero styles (Paint on a blank canvas - no colors, background-colors or shadows except the ones you define)
- Uses modern [HTML](https://en.wikipedia.org/wiki/HTML5) tags for component structure where necessary (e.g. **details**, **summary**, **dialog** and **menu**)
- Minimizes the use of `useState()` especially for things [CSS](https://en.wikipedia.org/wiki/CSS3_(disambiguation)#:~:text=CSS3%20is%20an%20abbreviation%20for,stylesheet%20language%20for%20structured%20documents.) can already handle. (e.g. toggling the visibility of a DOM node or capturing invalid state)
- Reduces boilerplate associated with setting up a component especially around structure, testability and reusability.
- makes use of the very  best third-party libraries to handle forms, toasts, utilities and state management (i.e. [react-hook-form](https://react-hook-form.com/docs), [react-busser](https://github.com/codesplinta/busser/blob/main/README.md), [react-day-picker](https://daypicker.dev/), [react-dropzone](https://react-dropzone.js.org/#src) & [sonner](https://sonner.emilkowal.ski/getting-started)

![components-init](./components-init.png)
![component-next-init](./component-next-init.png)
![component-showcase](./component-showcase.png)
![component-next-showcase](./component-next-showcase.png)
![component-last-showcase](./component-last-showcase.png)

## Preamble

There are lots of headdless UI libraries out there (e.g. [Material UI](https://mui.com/), [Radix UI](https://www.radix-ui.com/) e.t.c). While many of these UI libraries give you the flexibility and atomicity to build what you want in a fairly easy manner, they don't give you a lot of options for configuration. Sometimes, all you have [a set of strict primitives](https://www.radix-ui.com/primitives) or [bloated themeing configurations](https://mui.com/material-ui/customization/theme-components/). Furthermore, `useState()` is over used for things that [CSS](https://en.wikipedia.org/wiki/CSS3_(disambiguation)#:~:text=CSS3%20is%20an%20abbreviation%20for,stylesheet%20language%20for%20structured%20documents.) can do already. **react-busser-headless-ui** steps into these gaps with superior rendering performance and optimized state management.

One of the reasons i started this project is that i kept waiting for [Radix UI](https://www.radix-ui.com/) to support [**DatePicker primitives** but till date it doesn't](https://github.com/radix-ui/primitives/discussions/969).
