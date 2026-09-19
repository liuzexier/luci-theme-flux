/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './luasrc/**/*.htm',
    './htdocs/luci-static/flux/**/*.js',
    './preview/**/*.html',
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        'flux-accent': 'var(--flux-accent)',
        'flux-surface': 'var(--flux-surface)',
        'flux-text': 'var(--flux-text)',
        'flux-muted': 'var(--flux-muted)',
      },
    },
  },
};
