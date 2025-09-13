/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://thewildstudio.org',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: ['/admin/*', '/api/*', '/_next/*', '/404', '/500'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/_next', '/404', '/500'],
      },
    ],
    additionalSitemaps: [
      'https://thewildstudio.org/sitemap.xml',
      'https://thewildstudio.org/server-sitemap.xml',
    ],
  },
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  outDir: 'public',
}
