# Boilerplate for Snowpack + posthtml

## Configurations

### snowpack.config.js

```javascript
module.exports = {
  mount: {
    public: { url: '/', static: true },
    src: { url: '/' },
  },
  plugins: [
    ['./posthtml-transform', {
      plugins: {
        'posthtml-modules': { root: './src', },
      },
    }],
  ],
};
```

### snowpack.config.js + posthtml.config.js

snowpack.config.js

```javascript
module.exports = {
  mount: {
    public: { url: '/', static: true },
    src: { url: '/' },
  },
  plugins: [
    './posthtml-transform',
  ],
};
```

posthtml.config.js

```javascript
module.exports = (ctx) => {
  return {
    ...options,
    plugins: {
      'posthtml-modules': { root: './src', },
    }
  }
}
```

## See also

- [Snowpack](https://snowpack.dev/)
- [PostHTML](https://posthtml.org/)
- [posthtml-load-config](https://github.com/posthtml/posthtml-load-config)
