// Snowpack Configuration File

/** @type {import("snowpack").SnowpackUserConfig } */
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
