"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream = require("stream");
var parser2 = require("htmlparser2");
function isSelfClosedTag(tagname) {
    return tagname === "br" || tagname === "img";
}
var Transformer = (function (_super) {
    __extends(Transformer, _super);
    function Transformer(option) {
        var _this = _super.call(this, option) || this;
        _this.buffer = "";
        _this.tagModifier = {};
        _this.beforeCloseTags = {};
        _this.textTransforms = [];
        _this.parser = new parser2.Parser({
            ontext: function (text) { return _this._onText(text); },
            onopentag: function (name, attrib) { return _this._onOpenTag(name, attrib); },
            onclosetag: function (name) { return _this._onCloseTag(name); }
        }, {
            recognizeSelfClosing: false
        });
        return _this;
    }
    Transformer.prototype.onTag = function (tagname, attribute, pattern, transformer) {
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
    };
    Transformer.prototype.onBeforeClosingTag = function (tagname, transformer) {
        tagname = tagname.toLowerCase();
        if (this.beforeCloseTags[tagname] == null) {
            this.beforeCloseTags[tagname] = [];
        }
        this.beforeCloseTags[tagname].push(transformer);
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
            var execRes = transform[0].exec(text);
            if (execRes) {
                return transform[1](text, execRes);
            }
        }
        return text;
    };
    Transformer.prototype._onOpenTag = function (name, attrib) {
        var lowerName = name.toLowerCase();
        for (var _i = 0, _a = Object.keys(this.tagModifier)
            .filter(function (v) { return v === lowerName || v === "*"; }); _i < _a.length; _i++) {
            var tagKey = _a[_i];
            var attribModifiers = this.tagModifier[tagKey];
            var _loop_1 = function (attribKey) {
                for (var _i = 0, _a = Object.keys(attribModifiers)
                    .filter(function (v) { return v === attribKey.toLowerCase() || v === "*"; }); _i < _a.length; _i++) {
                    var attribTarget = _a[_i];
                    var valueModifiers = attribModifiers[attribTarget];
                    attrib[attribKey] = Transformer._transformString(attrib[attribKey], valueModifiers);
                }
            };
            for (var _b = 0, _c = Object.keys(attrib); _b < _c.length; _b++) {
                var attribKey = _c[_b];
                _loop_1(attribKey);
            }
        }
        var attribsStr = Object.keys(attrib).map(function (k) { return " " + k + "=\"" + attrib[k] + "\""; }).join("");
        var trailling = isSelfClosedTag(name) ? "/" : "";
        if (isSelfClosedTag(name)) {
            this._onProcessCloseTag(name);
        }
        this.push("<" + name + attribsStr + trailling + ">");
    };
    Transformer.prototype._onProcessCloseTag = function (name) {
        if (this.beforeCloseTags[name]) {
            for (var _i = 0, _a = this.beforeCloseTags[name]; _i < _a.length; _i++) {
                var transformer = _a[_i];
                this.push(transformer());
            }
        }
    };
    Transformer.prototype._onCloseTag = function (name) {
        if (!isSelfClosedTag(name)) {
            this._onProcessCloseTag(name);
            this.push("</" + name + ">");
        }
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
