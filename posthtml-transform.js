const fs = require('fs');
const path = require('path');
const posthtml = require('posthtml');
const config = require('cosmiconfig')
const loadPlugins = require('posthtml-load-config/lib/plugins.js')
const loadOptions = require('posthtml-load-options/lib/options.js')

//
// based posthtml-load-config
//
function posthtmlrc(ctx, loadPath, options) {
  ctx = Object.assign({ cwd: process.cwd(), env: process.env.NODE_ENV }, ctx)
  loadPath = loadPath || ctx.cwd
  options = Object.assign({}, options)
  if (ctx.env === undefined) process.env.NODE_ENV = 'development'

  return config('posthtml', options).load(loadPath)
    .then(result => result ? result.config : {})
    .then(config => {
      config = (typeof config === 'function') ? config(ctx) : Object.assign(config, ctx);
      if (!config.plugins) config.plugins = [];
      return {
        plugins: loadPlugins(config),
        options: loadOptions(config)
      };
    });
}

module.exports = function(_snowpackConfig, _pluginOptions) {
  const { root, mount } = _snowpackConfig;
  const posthtmlConfig = posthtmlrc(_pluginOptions);
  const supportExtends = ['.html', '.posthtml'];
  // <module href="/partials/head.html" ...
  // <include src="components/button.html" ...
  const partialsPattern = new RegExp(`\\b(?:href|src)="([^"]+\.(?:${supportExtends.join('|')}))"`, 'g');

  const scanned = new Set();
  const partials = new Proxy(new Map(), {
    get(target, name) {
      const ret = Reflect.get(target, name);
      if (typeof ret === 'function') return ret.bind(target);
      if (!target.has(name)) target.set(name, new Set());  // set default
      return target.get(name);
    }
  });

  function getPaths(filename) {
    const filePaths = [];
    for (let [mountPath, attr] of Object.entries(mount || {})) {
      const fullPath = path.join(mountPath, filename);
      if (!attr.static && fs.existsSync(fullPath)) {
        filePaths.push(fullPath);
      }
    }
    return filePaths;
  }

  async function collectPartials(filePath) {
    if (scanned.has(filePath)) return;
    scanned.add(filePath);

    fs.readFile(filePath, 'utf8', (error, content) => {
      if (error) throw error;
      Array.from(content.matchAll(partialsPattern), match => {
        paths = (match[1].startsWith(root))
          ? match[1]
          : getPaths(match[1]);
        paths.forEach(fullPath => {
          partials[fullPath].add(filePath);
          collectPartials(fullPath);
        });
      });
    });
  }

  return {
    name: 'posthtml-transform',
    resolve: {
      input: supportExtends,
      output: ['.html'],
    },
    async load({filePath, isDev}) {
      if (!isDev) return;
      await collectPartials(filePath);
    },
    async transform({ fileExt, contents }) {
      if (!supportExtends.includes(fileExt) || !contents) return;

      const { plugins, options } = await posthtmlConfig;
      const stdout = await posthtml(plugins).process(contents, options);
      return stdout.html;
    },
    onChange({ filePath }) {
      if (!supportExtends.includes(path.extname(filePath))) return;
      Array.from(partials.keys()).filter(key => key.endsWith(filePath)).forEach(source => {
        partials[source].forEach(target => {
          this.markChanged(target);
        });
      });
    },
  };
};
