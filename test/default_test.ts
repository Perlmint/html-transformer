import { expect, assert } from "chai";
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { Transformer } from "../src";
import * as stream from "stream";

function transformTest(stream: stream.Transform, input: string, expected: string, done: () => void) {
    let output = "";
    stream
    .on('data', (d: any) => output = output + d)
    .on('finish', () => {
        assert.equal(output, expected);
        done();
    })
    .on('error', (e: Error) => {
        assert.ifError(e);
    })
    .end(input);
}

@suite class Default {
    @test "text node transform"(done: () => void) {
        const transformer = new Transformer();
        console.log("begin");
        transformer.setEncoding("utf-8");
        transformer.onText(/hello, (.+)/, text => "censored");
        transformTest(transformer, `<html>
<head>
    </head>
    <body>
        <div>hello, world!</div>
        <span>hello, everyone!</span>
        <span>hello nothing</span>
    </body>
</html>`, `<html>
<head>
    </head>
    <body>
        <div>censored</div>
        <span>censored</span>
        <span>hello nothing</span>
    </body>
</html>`, done);
    }

    @test "Transform the attribute value of specific tag, attribute"(done: () => void) {
        const transformer = new Transformer();
        let output = "";

        transformer.onTag("div", "x-nothing", /hello/, text => "censored");
        transformTest(transformer, `<html>
<head>
    </head>
    <body>
        <div x-nothing="hello">hello, world!</div>
        <div x-something="hello">hello, everyone!</div>
        <span x-nothing="hello">hello nothing</span>
    </body>
</html>`, `<html>
<head>
    </head>
    <body>
        <div x-nothing="censored">hello, world!</div>
        <div x-something="hello">hello, everyone!</div>
        <span x-nothing="hello">hello nothing</span>
    </body>
</html>`, done);
    }

    @test "Use * for tagname"(done: () => void) {
        const transformer = new Transformer();
        let output = "";

        transformer.onTag("*", "x-nothing", /hello/, text => "censored");
        transformTest(transformer, `<html>
<head>
    </head>
    <body>
        <div x-nothing="hello">hello, world!</div>
        <div x-something="hello">hello, everyone!</div>
        <span x-nothing="hello">hello nothing</span>
    </body>
</html>`, `<html>
<head>
    </head>
    <body>
        <div x-nothing="censored">hello, world!</div>
        <div x-something="hello">hello, everyone!</div>
        <span x-nothing="censored">hello nothing</span>
    </body>
</html>`, done);
    }

    @test "Insert new tag before closing body"(done: () => void) {
        const transformer = new Transformer();

        transformer.onBeforeClosingTag("body", () => {
            return "<script src=\"injected.js\"></script>";
        });
        transformTest(transformer, `<html>
<head>
    </head>
    <body>
        <div x-nothing="hello">hello, world!</div>
        <div x-something="hello">hello, everyone!</div>
        <span x-nothing="hello">hello nothing</span>
    </body>
</html>`, `<html>
<head>
    </head>
    <body>
        <div x-nothing="hello">hello, world!</div>
        <div x-something="hello">hello, everyone!</div>
        <span x-nothing="hello">hello nothing</span>
    <script src="injected.js"></script></body>
</html>`, done);
    }

    @test "Self closed tag"(done: () => void) {
        const transformer = new Transformer();

        transformer.onTag("img", "src", /@(.+)/, (text, matched) => {
            return `/static/${matched[1]}`;
        });
        transformTest(transformer,
        `<html><body><img src="@custom_res"/></body></html>`,
        `<html><body><img src="/static/custom_res"/></body></html>`, done);
    }
}