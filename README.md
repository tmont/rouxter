# rouxter

[![Build Status](https://travis-ci.org/tmont/rouxter.svg?branch=master)](https://travis-ci.org/tmont/rouxter)
[![NPM version](https://img.shields.io/npm/v/rouxter.svg)](https://www.npmjs.com/package/rouxter)

A simple URL router for the client or server. Supports
case sensitivity, route value constraints and wildcards.

Smallish (~1.3KB gzipped) with no dependencies.

`rouxter` is pronounced `ROOTER`. Yelling is optional. `roux` was already taken
and I'm not very clever.

## Installation
### Server
```bash
npm install rouxter
```

### Client
The client version is built using 
[browserify](https://github.com/substack/node-browserify). It is
located at [dist/rouxter.js](dist/rouxter.js). If you want to minify it,
clone the repo and run `npm run minify`, or use your own favored
flavor of minification.

```html
<script src="/path/to/rouxter.js"></script>
```

## Usage
Note that on the client, there is a global `Rouxter` variable
attached to the window.

```javascript
const Route = require('rouxter').Route; //window.Rouxter.Route on the client

//configuring routes
const myRoutes = {
    home: new Route('home', '/'),
    about: new Route('about', '/about'),
    post: new Route('post', '/article/:id', {
        constraints: {
            id: /^\d{1,5}$/
        }
    }),
    api: new Route('api', '/api/v:version/:method*.:format', {
        constraints: {
            version: /^[12]$/,
            format: /^(xml|json|html|txt)$/
        },
        coercions: {
            version: 'int'
        }
    })
};

//using routes
const match = myRoutes.api.getMatch('/api/v2/users/all.json');
if (match) {
    console.log(match);
/*
{ version: { position: 0, name: 'version', value: 2 },
  method: { position: 1, name: 'method', value: 'users/all' },
  format: { position: 2, name: 'format', value: 'json' } }    
 */
}
```

### Variables
Route variables are created by prefixing the variable name with a
colon. They will be keyed by name with their value in the return
value of `getMatch`.

### Wildcards
By default, forward slashes act as delimiters for variables. So the
URL `/foo/:bar/baz` will match `/foo/hello/baz` but not `/foo/hello/world/baz`.

To match things with a forward slash, append a `*` to the variable name:
`/foo/:bar*/baz` will now match both `/foo/hello/baz` and `/foo/hello/world/baz`.

### Other Route Parsing Details
* A regular expression is generated from the URL you provide, and those regular
  expressions are always greedy. For example, `/foo/:bar*/baz/bat` will set `bar` to
  `baz/bat/baz/bat` if you pass it `/foo/bar/baz/bat/baz/bat/baz/bat`.
* All route URLs are anchored at the start and end: `/foo/bar` will match `/foo/bar` but not
  `/foo/bar/baz` or `/hello/foo/bar`
* To match a literal `:` or a literal `*` in a route, prefix it with a backslash `\`
* Variable names can be any combination of alphanumeric characters and the underscore
* The route URL must start with a forward slash

### Options
#### `caseInsensitive`
```javascript
const myRoute = new Route('/foo/:bar', { 
    caseInsensitive: true
});
```

This makes the regular expression match case insensitive.
So the above will match both `/foo/bar` and `/FoO/BAr`.

#### `constraints`
```javascript
const myRoute = new Route('/foo/:bar', { 
    constraints: {
        bar: /^\d+$/
    }
});
```

This option enforces constrains the route values. In the above example,
the route parameter `bar` must be an integer. So `/foo/123` would match
but `/foo/bar` would not.

Constraints can be regular expressions or a function, or an arbitrarily
nested array of both. If you use an array, ALL constraints within the array
must be satisfied for the route to match (this is helpful for reusing
constraints in multiple routes).

More complicated example that requires `bar` to be a positive integer
less than 100:

```javascript
const myRoute = new Route('/foo/:bar', { 
    constraints: {
        bar: [
            /^\d+$/,
            function(param) {
                var int = parseInt(param.value);
                return int > 0 && int < 100;
            }
        ]
    }
});
```

#### `coercions`
```javascript
const myRoute = new Route('/foo/:bar', { 
    coercions: {
        bar: 'int'
    }
});
```

This option coerces the route parameter value into something else.
The above example would run `parseInt` on the value of `bar`. So
if you match `/foo/3` you would get `3` instead of `"3"` for the value of `bar`.

Possible builtin coercions are `int`, `boolean` and `number`. Alternatively, you can also
provide a function to perform a custom coercion. For example:

```javascript
const myRoute = new Route('/foo/:bar', {
    constraints: {
        bar: /^\d+$/
    },
    coercions: {
        bar: function(value, params) {
            var bar = parseInt(value);
            if (bar < 0) {
                return 'negative';
            }
            if (bar < 100) {
                return 'small';
            }
            
            return 'large';
        }
    }
});
```

This will coerce `bar` into either `"negative"`, `"small"` or `"large"` depending
on its integral value.

## Development
* Run tests with `npm test`
* Build client library with `npm run compile`
* Minify client library with `npm run minify`
* Build and minify the client library with `npm run build`
