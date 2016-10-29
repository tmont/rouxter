(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Roux = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
    RouteMatcher: require('./src/route-matcher'),
    Route: require('./src/route')
};

},{"./src/route":3,"./src/route-matcher":2}],2:[function(require,module,exports){
function quote(str) {
    return str.replace(/[.\\+*[?^\]$(){}=!<>|:-]/g, '\\$&');
}

/**
 * @param {String} url
 * @param {RegExp} regex
 * @param {String[]} [params]
 * @param {Object} [constraints]
 * @param {Object} [coercions]
 * @constructor
 */
function RouteMatcher(url, regex, params, constraints, coercions) {
    this.url = url;
    this.regex = regex;
    this.params = params || [];
    this.constraints = constraints || {};
    this.coercions = coercions || {};

    if (!this.url) {
        throw new Error('A URL is required');
    }
    if (!(this.regex instanceof RegExp)) {
        throw new Error('regex must be an instance of RegExp');
    }
}

RouteMatcher.prototype = {
    /**
     * @param {String} url
     * @returns {Object[]}
     */
    getMatch: function(url) {
        var match = this.regex.exec(url);
        if (!match) {
            return null;
        }

        var coercions = this.coercions,
            constraints = this.constraints;

        //maybe not create lexical closures here?
        var routeParams = this.params.reduce(function(obj, name, i) {
            obj[name] = {
                position: i,
                name: name,
                value: match[i + 1] || ''
            };
            return obj;
        }, {});

        function applyConstraint(constraint, key) {
            if (!constraint) {
                return true;
            }

            var routeParamValue = routeParams[key].value;
            if (constraint instanceof RegExp) {
                if (!constraint.test(routeParamValue)) {
                    return null;
                }

                return true;
            }

            if (Array.isArray(constraint)) {
                for (var i = 0; i < constraint.length; i++) {
                    if (!applyConstraint(constraint[i], key)) {
                        return false;
                    }
                }

                return true;
            }

            if (typeof(constraint) === 'function') {
                return constraint(routeParams[key]);
            }

            return constraint.toString() === routeParamValue;
        }

        function coerce(key) {
            var coercion = coercions[key];
            if (!coercion) {
                return;
            }

            var newValue = routeParams[key].value;
            if (typeof(coercion) === 'string') {
                switch (coercion) {
                    case 'int':
                        newValue = parseInt(newValue);
                        break;
                    case 'number':
                        newValue = Number(newValue);
                        break;
                    case 'boolean':
                        switch (newValue.toLowerCase()) {
                            case 't':
                            case 'true':
                            case '1':
                            case 'on':
                                newValue = true;
                                break;
                            default:
                                newValue = false;
                                break;
                        }

                        break;
                }
            } else if (typeof(coercion) === 'function') {
                newValue = coercion(newValue, routeParams);
            }

            routeParams[key].value = newValue;
        }

        var keys = Object.keys(routeParams);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!applyConstraint(constraints[key], key)) {
                return null;
            }
        }

        //another iteration so that we don't coerce things we don't need to
        keys.forEach(coerce);

        return routeParams;
    }
};

/**
 * @param {String} url
 * @param {Object} [options]
 * @param {Object} [options.constraints]
 * @param {Boolean} [options.caseInsensitive]
 * @param {Object} [options.coercions]
 */
RouteMatcher.parse = function(url, options) {
    if (typeof(url) !== 'string') {
        throw new Error('URL must be a string');
    }
    if (url.charAt(0) !== '/') {
        throw new Error('Route matcher must start with "/"');
    }

    options = options || {};

    var c, i = 0;
    var params = [];
    var regex = '^';
    var paramName;
    while (c = url.charAt(i)) {
        switch (c) {
            case ':':
                //variable name
                paramName = /^(\w+)(\*?)/.exec(url.substring(i + 1));
                if (!paramName) {
                    //not a variable, but a literal ":"
                    regex += quote(c);
                    break;
                }
                i += paramName[0].length;
                params.push(paramName[1]);

                regex += '(';

                if (!paramName[2]) {
                    regex += '[^/]+';
                } else {
                    regex += '.+';
                }

                regex += ')';

                break;
            case '\\':
                i++;
                c = url.charAt(i);
                if (c) {
                    regex += quote(c);
                }
                break;
            case '*':
                //wildcard
                regex += '.*';
                break;
            default:
                regex += quote(c);
                break;
        }

        i++;
    }

    regex += '$';

    var regexOptions = '';
    if (options.caseInsensitive) {
        regexOptions += 'i';
    }

    return new RouteMatcher(
        url,
        new RegExp(regex, regexOptions),
        params,
        options.constraints || {},
        options.coercions || {}
    );
};

module.exports = RouteMatcher;

},{}],3:[function(require,module,exports){
var RouteMatcher = require('./route-matcher');

/**
 * @param {String} name
 * @param {RouteMatcher|String} [matcher]
 * @param {Object} [options]
 * @param {Boolean} [options.caseInsensitive]
 * @param {Object} [options.constraints]
 * @param {Object} [options.coercions]
 * @constructor
 */
function Route(name, matcher, options) {
    this.name = (String(name) || '').trim();
    if (!this.name) {
        throw new Error('Must provide a non-empty name for the route');
    }

    options = options || {};

    var matcherOptions = {
        caseInsensitive: !!options.caseInsensitive,
        constraints: options.constraints || {},
        coercions: options.coercions || {}
    };

    this.matcher = matcher instanceof RouteMatcher ? matcher : RouteMatcher.parse(matcher, matcherOptions);
}

Route.prototype = {
    /**
     * @param {String} url
     * @returns {Object[]}
     */
    getMatch: function(url) {
        return this.matcher.getMatch(url);
    }
};

module.exports = Route;

},{"./route-matcher":2}]},{},[1])(1)
});