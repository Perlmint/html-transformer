import { expect, assert } from "chai";
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { Transformer } from "../src";
import * as stream from "stream";

function promisefy(fn: (...args: any[]) => any, ...args: any[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            fn(...args, resolve);
        } catch (e) {
            reject(e);
        }
    });
}

@suite class Default {
    @test textNodeChange() {
        const htmlBuffer = new stream.Duplex();
        const transformer = new Transformer();
        let output = "";

        transformer.onText(/hello, (.+)/, text => "censored");
        htmlBuffer.pipe(transformer);
        transformer.on('data', (d : any) => output = output + d);

        transformer.setEncoding("utf-8");
        transformer.end(`<html>
<head>
    </head>
    <body>
        <div>hello, world!</div>
        <span>hello, everyone!</span>
        <span>hello nothing</span>
    </body>
</html>`);
        transformer.on('end', () => {
            assert.equal(output , `<html>
<head>
    </head>
    <body>
        <div>censored</div>
        <span>censored</span>
        <span>hello nothing</span>
    </body>
</html>`);
        });
    }

    @test attributeTransformTest() {
        const htmlBuffer = new stream.Duplex();
        const transformer = new Transformer();
        let output = "";

        transformer.onTag("div", "X-nothing", /hello/, text => "censored");
        htmlBuffer.pipe(transformer);
        transformer.on('data', (d : any) => output = output + d);

        transformer.setEncoding("utf-8");
        transformer.end(`<html>
<head>
    </head>
    <body>
        <div X-nothing="hello">hello, world!</div>
        <div X-something="hello">hello, everyone!</div>
        <span X-nothing="hello">hello nothing</span>
    </body>
</html>`);
        transformer.on('end', () => {
            assert.equal(output , `<html>
<head>
    </head>
    <body>
        <div X-nothing="censored">hello, world!</div>
        <div X-something="hello">hello, everyone!</div>
        <span X-nothing="hello">hello nothing</span>
    </body>
</html>`);
        });
    }

    @test attributeAsteriskTransformTest() {
        const htmlBuffer = new stream.Duplex();
        const transformer = new Transformer();
        let output = "";

        transformer.onTag("*", "X-nothing", /hello/, text => "censored");
        htmlBuffer.pipe(transformer);
        transformer.on('data', (d : any) => output = output + d);

        transformer.setEncoding("utf-8");
        transformer.end(`<html>
<head>
    </head>
    <body>
        <div X-nothing="hello">hello, world!</div>
        <div X-something="hello">hello, everyone!</div>
        <span X-nothing="hello">hello nothing</span>
    </body>
</html>`);
        transformer.on('end', () => {
            assert.equal(output , `<html>
<head>
    </head>
    <body>
        <div X-nothing="censored">hello, world!</div>
        <div X-something="hello">hello, everyone!</div>
        <span X-nothing="censored">hello nothing</span>
    </body>
</html>`);
        });
    }
}