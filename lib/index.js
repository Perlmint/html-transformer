"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream = require("stream");
var parser2 = require("htmlparser2");
var Transformer = (function (_super) {
    __extends(Transformer, _super);
    function Transformer(option) {
        var _this = _super.call(this, option) || this;
        _this.buffer = "";
        _this.tagModifier = {};
        _this.textTransforms = [];
        _this.parser = new parser2.Parser({
            ontext: function (text) { return _this._onText(text); },
            onopentag: function (name, attrib) { return _this._onOpenTag(name, attrib); }
        }, {
            recognizeSelfClosing: false
        });
        return _this;
    }
    Transformer.prototype.onTag = function (tagname, attribute, pattern, transformer) {
        if (this.tagModifier[tagname] == null) {
            this.tagModifier[tagname] = {};
        }
        if (this.tagModifier[tagname][attribute] == null) {
            this.tagModifier[tagname][attribute] = [];
        }
        this.tagModifier[tagname][attribute].push([pattern, transformer]);
        return this;
    };
    Transformer.prototype.onText = function (pattern, transformer) {
        this.textTransforms.push([pattern, transformer]);
        return this;
    };
    Transformer.prototype._onText = function (text) {
        this.push(Transformer._transformString(text, this.textTransforms));
    };
    Transformer._transformString = function (text, transforms) {
        for (var _i = 0, transforms_1 = transforms; _i < transforms_1.length; _i++) {
            var transform = transforms_1[_i];
            if (transform[0].test(text)) {
                return transform[1](text);
            }
        }
        return text;
    };
    Transformer.prototype._onOpenTag = function (name, attrib) {
        var lowerName = name.toLowerCase();
        var attribModifiers = this.tagModifier[lowerName];
        if (attribModifiers != null) {
            for (var _i = 0, _a = Object.keys(attrib); _i < _a.length; _i++) {
                var attribKey = _a[_i];
                var valueModifiers = attribModifiers[attribKey.toLowerCase()];
                if (valueModifiers != null) {
                    attrib[attribKey] = Transformer._transformString(attrib[attribKey], valueModifiers);
                }
            }
        }
        var attribsStr = Object.keys(attrib).map(function (k) { return " " + k + "=\"" + attrib[k] + "\""; }).join("");
        var trailling = lowerName === "br" || lowerName === "img" ? "/" : "";
        this.push("<" + name + attribsStr + trailling + ">");
    };
    Transformer.prototype._onCloseTag = function (name) {
        this.push("</" + name + ">");
    };
    Transformer.prototype._transform = function (chunk, encoding, callback) {
        var chunkStr = typeof chunk === "string" ? chunk : chunk.toString('utf-8');
        this.parser.write(chunkStr);
        callback();
    };
    Transformer.prototype._flush = function (callback) {
        this.parser.end();
    };
    return Transformer;
}(stream.Transform));
exports.Transformer = Transformer;
