var expect = require('expect.js');
var Route = require('../').Route;
var RouteMatcher = require('../').RouteMatcher;

describe('Route', function() {
    it('should automatically create matcher', function() {
        var route = new Route('foo', '/foo/:bar');
        expect(route.getMatch('/foo/bar')).to.eql({
            bar: {
                name: 'bar',
                position: 0,
                value: 'bar'
            }
        });
    });

    it('should pass case-insensitive option to matcher', function() {
        var route = new Route('foo', '/foo/:bar', {
            caseInsensitive: true
        });
        expect(route.getMatch('/FOO/bar')).to.eql({
            bar: {
                name: 'bar',
                position: 0,
                value: 'bar'
            }
        });
    });

    it('should pass constraints option to matcher', function() {
        var route = new Route('foo', '/foo/:bar', {
            constraints: {
                bar: 'baz'
            }
        });
        expect(route.getMatch('/foo/baz')).to.eql({
            bar: {
                name: 'bar',
                position: 0,
                value: 'baz'
            }
        });

        expect(route.getMatch('/foo/bar')).to.equal(null);
    });

    it('should pass coercions option to matcher', function() {
        var route = new Route('foo', '/foo/:bar', {
            coercions: {
                bar: 'int'
            }
        });
        expect(route.getMatch('/foo/3').bar.value).to.equal(3);
        expect(route.getMatch('/foo/3').bar.value).to.not.equal('3');
    });

    it('should use prebuilt matcher', function() {
        var matcher = RouteMatcher.parse('/foo/:bar');
        var route = new Route('foo', matcher);
        expect(route.getMatch('/foo/bar')).to.eql({
            bar: {
                name: 'bar',
                position: 0,
                value: 'bar'
            }
        });
    });
});
