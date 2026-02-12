# Regaarder Documentation Site

A modern documentation site built with [Next.js](https://nextjs.org/) and [Nextra](https://nextra.site/).

## Setup

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building

```bash
npm run build
```

This creates an optimized production build in the `.next` folder.

### Production

```bash
npm start
```

## Structure

- `pages/` - Documentation pages and sections
  - `index.mdx` - Home page
  - `payments/` - Payment system docs
  - `ads/` - Advertising system docs
  - `video/` - Video system docs
  - `features/` - Platform features docs
  - `admin/` - Admin features docs
- `theme.config.jsx` - Nextra theme configuration
- `next.config.js` - Next.js configuration

## Adding New Pages

1. Create a new `.mdx` file in the appropriate `pages/` subdirectory
2. Update the `_meta.json` file in that directory to add navigation
3. The page will be automatically available at the corresponding URL

## Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Select this `docs` folder as the root directory
4. Click Deploy

Vercel will automatically detect the Next.js project and deploy it.

## GitHub Integration

The theme is configured to link to your GitHub repository. Update the `theme.config.jsx` file with your actual GitHub URLs:

```jsx
project: {
  link: 'https://github.com/yourusername/regaarder',
},
docsRepositoryBase: 'https://github.com/yourusername/regaarder/tree/main/docs',
```

## Support

For issues or improvements, please refer to:
- [Nextra Documentation](https://nextra.site/)
- [Next.js Documentation](https://nextjs.org/docs)
