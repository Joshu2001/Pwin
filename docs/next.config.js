const nextra = require('nextra')
const createNextra = nextra.default || nextra

const withNextra = createNextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
})

module.exports = withNextra({
  reactStrictMode: true,
})
