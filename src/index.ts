import * as fs from "fs";
import * as stream from "stream";
import * as parser2 from "htmlparser2";

type StringTransformer = (text: string, matched: RegExpExecArray) => string;
type Transforms = [RegExp, StringTransformer][];

function isSelfClosedTag(tagname: string) {
    return tagname === "br" || tagname === "img";
}

export class Transformer extends stream.Transform {
    constructor(option?: stream.TransformOptions) {
        super(option);
        this.parser = new parser2.Parser({
            ontext: text => this._onText(text),
            onopentag: (name, attrib) => this._onOpenTag(name, attrib),
            onclosetag: name => this._onCloseTag(name)
        }, {
            recognizeSelfClosing: false
        });
    }

    protected buffer: string = "";
    protected parser: parser2.Parser;

    protected tagModifier: {[key:string]:{[key:string]:Transforms}} = {};
    onTag(tagname: string, attribute: string, pattern: RegExp, transformer: StringTransformer) {
        tagname = tagname.toLowerCase();
        if (this.tagModifier[tagname] == null) {
            this.tagModifier[tagname] = {};
        }
        attribute = attribute.toLowerCase();
        if (this.tagModifier[tagname][attribute] == null) {
            this.tagModifier[tagname][attribute] = [];
        }
        this.tagModifier[tagname][attribute].push([pattern, transformer]);

        return this;
    }

    protected beforeCloseTags: {[key:string]: (()=>string)[]} = {};
    onBeforeClosingTag(tagname: string, transformer: () => string) {
        tagname = tagname.toLowerCase();
        if (this.beforeCloseTags[tagname] == null) {
            this.beforeCloseTags[tagname] = [];
        }
        this.beforeCloseTags[tagname].push(transformer);
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
            const execRes = transform[0].exec(text);
            if (execRes) {
                return transform[1](text, execRes);
            }
        }
        return text;
    }

    protected _onOpenTag(name: string, attrib: {[key: string]: string}) {
        const lowerName = name.toLowerCase();
        for (const tagKey of Object.keys(this.tagModifier)
            .filter(v => v === lowerName || v === "*")) {
            const attribModifiers = this.tagModifier[tagKey];

            for (const attribKey of Object.keys(attrib)) {
                for (const attribTarget of Object.keys(attribModifiers)
                    .filter(v => v === attribKey.toLowerCase() || v === "*")) {
                    const valueModifiers = attribModifiers[attribTarget];
                    attrib[attribKey] = Transformer._transformString(attrib[attribKey], valueModifiers);
                }
            }
        }

        const attribsStr = Object.keys(attrib).map(k => ` ${k}=\"${attrib[k]}\"`).join("");
        const trailling = isSelfClosedTag(name) ? "/" : "";
        if (isSelfClosedTag(name)) {
            this._onProcessCloseTag(name);
        }
        this.push(`<${name}${attribsStr}${trailling}>`);
    }

    protected _onProcessCloseTag(name: string) {
        if (this.beforeCloseTags[name]) {
            for(const transformer of this.beforeCloseTags[name]) {
                this.push(transformer());
            }
        }
    }

    protected _onCloseTag(name: string) {
        if (!isSelfClosedTag(name)) {
            this._onProcessCloseTag(name);
            this.push(`</${name}>`);
        }
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