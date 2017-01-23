/// <reference types="node" />
import * as stream from "stream";
import * as parser2 from "htmlparser2";
export declare type StringTransformer = (text: string, matched: RegExpExecArray) => string;
export declare type Transforms = [RegExp, StringTransformer][];
/**
 * Transform HTML stream
 **/
export declare class Transformer extends stream.Transform {
    constructor(option?: stream.TransformOptions);
    protected buffer: string;
    protected parser: parser2.Parser;
    protected tagModifier: {
        [key: string]: {
            [key: string]: Transforms;
        };
    };
    /**
     * Append transform for tag attribute value.
     * @param tagname Target tag name. can use '*' for any tag
     * @param attribute Attribute name. can use '*' for any attribute
     * @param pattern Attribute pattern to transform
     * @param transformer Transform function.
     **/
    onTag(tagname: string, attribute: string, pattern: RegExp, transformer: StringTransformer): this;
    protected beforeCloseTags: {
        [key: string]: (() => string)[];
    };
    /**
     * Insert some value before closing tag
     * @param tagname Target tag name. Can't use '*'
     * @param transformer Generator that returns inserted before closing tag
     **/
    onBeforeClosingTag(tagname: string, transformer: () => string): this;
    protected textTransforms: Transforms;
    /**
     * Append text node transform
     * @param pattern Text pattern to find
     * @param transformer text node content transform function
     **/
    onText(pattern: RegExp, transformer: StringTransformer): this;
    protected _onText(text: string): void;
    protected static _transformString(text: string, transforms: Transforms): string;
    protected _onOpenTag(name: string, attrib: {
        [key: string]: string;
    }): void;
    protected _onProcessCloseTag(name: string): void;
    protected _onCloseTag(name: string): void;
    protected _transform(chunk: string | Buffer, encoding: string, callback: (error?: Error, data?: string) => void): void;
    protected _flush(callback: () => void): void;
}
