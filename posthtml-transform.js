const posthtml = require('posthtml');
const config = require('cosmiconfig')
const loadPlugins = require('posthtml-load-config/lib/plugins.js')
const loadOptions = require('posthtml-load-options/lib/options.js')

//
// based posthtml-load-config
//
function posthtmlrc (ctx, path, options) {
  ctx = Object.assign({ cwd: process.cwd(), env: process.env.NODE_ENV }, ctx)
  path = path || ctx.cwd
  options = Object.assign({}, options)
  if (ctx.env === undefined) process.env.NODE_ENV = 'development'

  return config('posthtml', options).load(path)
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
  const posthtmlConfig = posthtmlrc(_pluginOptions);

  return {
    name: 'posthtml-transform',
    async transform({ fileExt, contents }) {
      if (!['.html', '.posthtml'].includes(fileExt) || !contents) return;

      const { plugins, options } = await posthtmlConfig;
      const stdout = await posthtml(plugins).process(contents, options);
      return stdout.html;
    }
  };
};
