var expect = require('expect.js');
var sinon = require('sinon');
var RouteMatcher = require('../').RouteMatcher;

function shouldNotMatch(matcher, url) {
    expect(matcher.getMatch(url)).to.equal(null);
}

function shouldMatch(matcher, url, expectedValue) {
    expect(matcher.getMatch(url)).to.eql(expectedValue);
}

describe('RouteMatcher', function() {
    describe('without variables', function() {
        var matcher;

        beforeEach(function() {
            matcher = RouteMatcher.parse('/foo/bar');
        });

        it('should match exactly', function() {
            shouldMatch(matcher, '/foo/bar', {});
        });
        it('should not match as prefix', function() {
            shouldNotMatch(matcher, '/foo/bar/baz');
        });
        it('should not match as suffix', function() {
            shouldNotMatch(matcher, '/lol/foo/bar');
        });
        it('should not match in middle', function() {
            shouldNotMatch(matcher, '/lol/foo/bar/baz');
        });
    });

    describe('with single variable at end', function() {
        var matcher;

        beforeEach(function() {
            matcher = RouteMatcher.parse('/foo/:bar');
        });

        it('should match value', function() {
            shouldMatch(matcher, '/foo/baz', {
                bar: {
                    name: 'bar',
                    position: 0,
                    value: 'baz'
                }
            });
        });

        it('should not match without value', function() {
            shouldNotMatch(matcher, '/foo/');
        });
    });

    describe('with single variable at beginning', function() {
        var matcher;

        beforeEach(function() {
            matcher = RouteMatcher.parse('/:bar/foo');
        });

        it('should match value', function() {
            shouldMatch(matcher, '/baz/foo', {
                bar: {
                    name: 'bar',
                    position: 0,
                    value: 'baz'
                }
            });
        });

        it('should not match without value', function() {
            shouldNotMatch(matcher, '//foo');
        });
    });

    describe('with single variable in the middle', function() {
        var matcher;

        beforeEach(function() {
            matcher = RouteMatcher.parse('/foo/:bar/baz');
        });

        it('should match value', function() {
            shouldMatch(matcher, '/foo/lol/baz', {
                bar: {
                    name: 'bar',
                    position: 0,
                    value: 'lol'
                }
            });
        });

        it('should not match without value', function() {
            shouldNotMatch(matcher, '/foo//baz');
        });
    });

    describe('with multiple variables', function() {
        var matcher;

        beforeEach(function() {
            matcher = RouteMatcher.parse('/:foo/:bar/:baz');
        });

        it('should match value', function() {
            shouldMatch(matcher, '/bat/qux/meh', {
                foo: {
                    name: 'foo',
                    position: 0,
                    value: 'bat'
                },
                bar: {
                    name: 'bar',
                    position: 1,
                    value: 'qux'
                },
                baz: {
                    name: 'baz',
                    position: 2,
                    value: 'meh'
                }
            });
        });

        it('should not match if a forward slash separates variable value', function() {
            shouldNotMatch(matcher, '/foo/bar/baz/bat');
        });
    });

    describe('with variable and constraints', function() {
        describe('string constraint', function() {
            var matcher;
            beforeEach(function() {
                matcher = RouteMatcher.parse('/foo/:bar', {
                    constraints: {
                        bar: 'yarp'
                    }
                });
            });

            it('should match value', function() {
                shouldMatch(matcher, '/foo/yarp', {
                    bar: {
                        name: 'bar',
                        position: 0,
                        value: 'yarp'
                    }
                });
            });

            it('should not match', function() {
                shouldNotMatch(matcher, '/foo/bar');
            });
        });

        describe('regex constraint', function() {
            var matcher;
            beforeEach(function() {
                matcher = RouteMatcher.parse('/foo/:bar', {
                    constraints: {
                        bar: /yarp?/
                    }
                });
            });

            it('should match value', function() {
                shouldMatch(matcher, '/foo/yarp', {
                    bar: {
                        name: 'bar',
                        position: 0,
                        value: 'yarp'
                    }
                });

                shouldMatch(matcher, '/foo/yar', {
                    bar: {
                        name: 'bar',
                        position: 0,
                        value: 'yar'
                    }
                });
            });

            it('should not match', function() {
                shouldNotMatch(matcher, '/foo/bar');
            });
        });

        describe('nested constraints', function() {
            var matcher;
            beforeEach(function() {
                matcher = RouteMatcher.parse('/foo/:bar', {
                    constraints: {
                        bar: [
                            /.a./,
                            [ /^b/, /r$/ ]
                        ]
                    }
                });
            });

            it('should match value', function() {
                shouldMatch(matcher, '/foo/bar', {
                    bar: {
                        name: 'bar',
                        position: 0,
                        value: 'bar'
                    }
                });
            });

            it('should not match', function() {
                shouldNotMatch(matcher, '/foo/rap');
                shouldNotMatch(matcher, '/foo/ba');
                shouldNotMatch(matcher, '/foo/bars');
                shouldNotMatch(matcher, '/foo/bat');
            });
        });

        describe('function constraint', function() {
            var matcher,
                options;

            beforeEach(function() {
                options = {
                    constraints: {
                        bar: function(param) {
                            return param.value === 'lol';
                        }
                    }
                };
                matcher = RouteMatcher.parse('/foo/:bar', options);

                sinon.spy(options.constraints, 'bar');
            });

            it('should match value', function() {
                shouldMatch(matcher, '/foo/lol', {
                    bar: {
                        name: 'bar',
                        position: 0,
                        value: 'lol'
                    }
                });

                expect(options.constraints.bar.callCount).to.equal(1);
                expect(options.constraints.bar.getCall(0).args[0]).to.eql({
                    name: 'bar',
                    position: 0,
                    value: 'lol'
                });
            });

            it('should not match', function() {
                shouldNotMatch(matcher, '/foo/notlol');
            });
        });
    });

    describe('case insensitive', function() {
        var matcher;

        beforeEach(function() {
            matcher = RouteMatcher.parse('/foo/bar', {
                caseInsensitive: true
            });
        });

        it('should match', function() {
            shouldMatch(matcher, '/foo/bar', {});
            shouldMatch(matcher, '/foo/BAR', {});
            shouldMatch(matcher, '/FOO/BAR', {});
            shouldMatch(matcher, '/Foo/BaR', {});
        });
    });

    describe('with wildcard', function() {
        describe('with variable in middle', function() {
            var matcher;

            beforeEach(function() {
                matcher = RouteMatcher.parse('/foo/:bar*/baz');
            });

            it('should match', function() {
                shouldMatch(matcher, '/foo/bar/bat/qux/baz', {
                    bar: {
                        name: 'bar',
                        position: 0,
                        value: 'bar/bat/qux'
                    }
                });
            });
        });

        describe('with variable at end', function() {
            var matcher;

            beforeEach(function() {
                matcher = RouteMatcher.parse('/foo/:bar*');
            });

            it('should match', function() {
                shouldMatch(matcher, '/foo/bar/bat/qux/baz', {
                    bar: {
                        name: 'bar',
                        position: 0,
                        value: 'bar/bat/qux/baz'
                    }
                });
            });
        });

        describe('with no variable at end', function() {
            var matcher;

            beforeEach(function() {
                matcher = RouteMatcher.parse('/foo/*');
            });

            it('should match', function() {
                shouldMatch(matcher, '/foo/bar/bat/qux/baz', {});
            });

            it('should match without value', function() {
                shouldMatch(matcher, '/foo/', {});
            });

            it('should not match without trailing slash', function() {
                shouldNotMatch(matcher, '/foo');
            });
        });

        describe('with no variable in middle', function() {
            var matcher;

            beforeEach(function() {
                matcher = RouteMatcher.parse('/foo/*/baz');
            });

            it('should match', function() {
                shouldMatch(matcher, '/foo/bar/bat/qux/baz', {});
            });

            it('should match without value', function() {
                shouldMatch(matcher, '/foo//baz', {});
            });

            it('should not match without trailing slash', function() {
                shouldNotMatch(matcher, '/foo/baz');
            });
        });

        describe('multiple wildcards', function() {
            var matcher;

            beforeEach(function() {
                matcher = RouteMatcher.parse('/foo/*/baz/*/qux');
            });

            it('should match', function() {
                shouldMatch(matcher, '/foo/bar/baz/bat/qux', {});
            });

            it('should match without value', function() {
                shouldMatch(matcher, '/foo//baz//qux', {});
            });
        });
    });

    describe('with coercion', function() {
        function ensureValue(matcher, url, expectedValue) {
            const match = matcher.getMatch(url);
            expect(match).to.not.equal(null);
            expect(match).to.have.property('bar');
            expect(match.bar).to.have.property('value', expectedValue);
        }

        it('should coerce to integer', function() {
            const matcher = RouteMatcher.parse('/foo/:bar', {
                coercions: {
                    bar: 'int'
                }
            });

            ensureValue(matcher, '/foo/3', 3);
        });

        it('should coerce to number', function() {
            const matcher = RouteMatcher.parse('/foo/:bar', {
                coercions: {
                    bar: 'number'
                }
            });

            ensureValue(matcher, '/foo/-3.35', -3.35);
        });

        it('should coerce to boolean', function() {
            const matcher = RouteMatcher.parse('/foo/:bar', {
                coercions: {
                    bar: 'boolean'
                }
            });

            ensureValue(matcher, '/foo/true', true);
            ensureValue(matcher, '/foo/t', true);
            ensureValue(matcher, '/foo/1', true);
            ensureValue(matcher, '/foo/on', true);
            ensureValue(matcher, '/foo/ON', true);
            ensureValue(matcher, '/foo/TRUE', true);
            ensureValue(matcher, '/foo/T', true);
            ensureValue(matcher, '/foo/0', false);
            ensureValue(matcher, '/foo/asdf', false);
            ensureValue(matcher, '/foo/false', false);
            ensureValue(matcher, '/foo/f', false);
            ensureValue(matcher, '/foo/off', false);
            ensureValue(matcher, '/foo/OFF', false);
            ensureValue(matcher, '/foo/FALSE', false);
        });

        it('should coerce using custom function', function() {
            var options = {
                coercions: {
                    bar: function(value, routeParams) {
                        return 'lol';
                    }
                }
            };

            const matcher = RouteMatcher.parse('/foo/:bar', options);

            sinon.spy(options.coercions, 'bar');

            ensureValue(matcher, '/foo/anything', 'lol');

            expect(options.coercions.bar.callCount).to.equal(1);
            expect(options.coercions.bar.getCall(0).args[0]).to.equal('anything');
            expect(options.coercions.bar.getCall(0).args[1]).to.eql({
                bar: {
                    name: 'bar',
                    position: 0,
                    value: 'lol'
                }
            });
        });
    });

    describe('backslash escaping', function() {
        it('should match literal asterisk', function() {
            const matcher = RouteMatcher.parse('/foo\\*/:bar');
            shouldMatch(matcher, '/foo*/bar', {
                bar: {
                    name: 'bar',
                    position: 0,
                    value: 'bar'
                }
            });
        });

        it('should match literal colon', function() {
            const matcher = RouteMatcher.parse('/foo/:bar\\::baz');
            shouldMatch(matcher, '/foo/bar:baz', {
                bar: {
                    name: 'bar',
                    position: 0,
                    value: 'bar'
                },
                baz: {
                    name: 'baz',
                    position: 1,
                    value: 'baz'
                }
            });
        });
    });
});
