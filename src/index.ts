import * as fs from "fs";
import * as stream from "stream";
import * as parser2 from "htmlparser2";

type StringTransformer = (text: string) => string;
type Transforms = [RegExp, StringTransformer][];

export class Transformer extends stream.Transform {
    constructor(option?: stream.TransformOptions) {
        super(option);
        this.parser = new parser2.Parser({
            ontext: text => this._onText(text),
            onopentag: (name, attrib) => this._onOpenTag(name, attrib)
        }, {
            recognizeSelfClosing: false
        });
    }

    protected buffer: string = "";
    protected parser: parser2.Parser;

    protected tagModifier: {[key:string]:{[key:string]:Transforms}} = {};
    onTag(tagname: string, attribute: string, pattern: RegExp, transformer: StringTransformer) {
        if (this.tagModifier[tagname] == null) {
            this.tagModifier[tagname] = {};
        }
        if (this.tagModifier[tagname][attribute] == null) {
            this.tagModifier[tagname][attribute] = [];
        }
        this.tagModifier[tagname][attribute].push([pattern, transformer]);

        return this;
    }

    protected textTransforms: Transforms = [];
    onText(pattern: RegExp, transformer: StringTransformer) {
        this.textTransforms.push([pattern, transformer]);

        return this;
    }

    protected _onText(text: string) {
        this.push(Transformer._transformString(text, this.textTransforms));
    }

    protected static _transformString(text: string, transforms: Transforms): string {
        for (const transform of transforms) {
            if (transform[0].test(text)) {
                return transform[1](text);
            }
        }
        return text;
    }

    protected _onOpenTag(name: string, attrib: {[key: string]: string}) {
        const lowerName = name.toLowerCase();
        const attribModifiers = this.tagModifier[lowerName];
        if (attribModifiers != null) {
            for (const attribKey of Object.keys(attrib)) {
                const valueModifiers = attribModifiers[attribKey.toLowerCase()];
                if (valueModifiers != null) {
                    attrib[attribKey] = Transformer._transformString(attrib[attribKey], valueModifiers);
                }
            }
        }

        const attribsStr = Object.keys(attrib).map(k => ` ${k}=\"${attrib[k]}\"`).join("");
        const trailling = lowerName === "br" || lowerName === "img" ? "/" : ""; 
        this.push(`<${name}${attribsStr}${trailling}>`);
    }

    protected _onCloseTag(name: string) {
        this.push(`</${name}>`);
    }

    protected _transform(chunk: string | Buffer, encoding: string, callback: (error?: Error, data?: string) => void): void {
        const chunkStr = typeof chunk === "string" ? chunk : chunk.toString('utf-8');
        this.parser.write(chunkStr);
        callback();
    }

    protected _flush(callback: () => void): void {
        this.parser.end();
    }
}