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
