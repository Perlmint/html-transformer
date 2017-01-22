# html-transformer
HTML transformer

[![npm version](https://badge.fury.io/js/html-transformer.svg)](https://badge.fury.io/js/html-transformer)
[![Build Status](https://travis-ci.org/Perlmint/html-transformer.svg?branch=master)](https://travis-ci.org/Perlmint/html-transformer)
[![codecov](https://codecov.io/gh/Perlmint/html-transformer/branch/master/graph/badge.svg)](https://codecov.io/gh/Perlmint/html-transformer)
[![dependencies Status](https://david-dm.org/perlmint/html-transformer/status.svg)](https://david-dm.org/perlmint/html-transformer)
[![devDependencies Status](https://david-dm.org/perlmint/html-transformer/dev-status.svg)](https://david-dm.org/perlmint/html-transformer?type=dev)

## Example
```javascript
import Transformer from "html-transformer";

let env = {};
/**
  set env
 */

const transformer = new Transformer();
transformer.onText(/{{[^}]+}}/, (_, matched) => {
    return env[matched[1]];
})
.onTag("*", "placeholder", /{{[^}]+}}/, (_, matched) => {
    return env[matched[1]];
})
.onBeforeClosingTag("body", () => {
    return "<script src=\"inject_some_js.js\"></script>";
}).pipe(htmlOutput);
htmlInput.pipe(transformer);
```