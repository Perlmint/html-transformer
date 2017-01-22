# html-transformer
HTML transformer

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