# 🚀 Strapi Advanced Sitemap

[![npm version](https://img.shields.io/badge/npm-1.0.7-CB3837?style=flat-square&logo=npm)](https://www.npmjs.com/package/@webbycrown/strapi-advanced-sitemap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Strapi](https://img.shields.io/badge/Strapi-5.x-blue.svg)](https://strapi.io/)
[![Strapi Market](https://img.shields.io/badge/Strapi%20Market-Plugin-7A5AF8?style=flat-square&logo=strapi)](https://market.strapi.io/plugins/@webbycrown-strapi-advanced-sitemap)

SEO-ready XML sitemaps for Strapi CMS. Create manual URL sets or sitemap indexes, generate dynamic feeds from collection types, and expose every endpoint behind role-based permissions—no external services required.

- **NPM Package**: [@webbycrown/strapi-advanced-sitemap](https://www.npmjs.com/package/@webbycrown/strapi-advanced-sitemap)  
- **Strapi Market**: https://market.strapi.io/plugins/@webbycrown-strapi-advanced-sitemap



## 📘 User Guide

📺 **Learn how to use Advanced Sitemap in Strapi with our step-by-step guide**

[![Open User Guide](https://img.shields.io/badge/Open%20User%20Guide-Getting%20Started-2563eb?style=for-the-badge)](https://www.webbycrown.com/guides/strapi-advanced-sitemap/strapi-quick-start)

**Direct link:** https://www.webbycrown.com/guides/strapi-advanced-sitemap/strapi-quick-start

---

## 🎥 Overview & Usage Demo

A short introduction and quick overview of **Strapi Advanced Sitemap**, showcasing how to build manual or dynamic XML sitemaps, publish sitemap indexes, and control access per role inside the Strapi admin panel.

[![Watch the demo](https://raw.githubusercontent.com/webbycrown/strapi-advanced-sitemap/main/assets/strapi-advanced-sitemap.png)](https://www.youtube.com/watch?v=4HBuf8fhNCQ)

▶️ **[Watch Full Video on YouTube](https://www.youtube.com/watch?v=4HBuf8fhNCQ)**

---

## ✨ Features

### 🗂️ Manual Sitemap Builder
- **Single sitemap (`<urlset>`):** curate individual URLs with optional priority values  
- **Sitemap index (`<sitemapindex>`):** reference other sitemap files (internal or external)  
- **Automatic URL resolution:** combine relative paths with your site base URL  
- **UI hints & validation:** friendly helper text, required field checks, URL previews

### 🔁 Dynamic Collection Sitemaps
- **Pattern-based URLs:** use tokens like `/blog/[slug]` (supports nested fields)  
- **Entry prefix & base path:** compose clean URLs without extra middleware  
- **Frequency, priority, lastmod:** configure crawl metadata per sitemap  
- **Draft filtering:** includes only published entries from Draft & Publish collections

### 🔒 Permission-Aware Delivery
- **Role gating:** every endpoint maps to an action (`plugin::strapi-advanced-sitemap.controller.*`)  
- **Public crawler control:** enable only the endpoints you want search engines to reach  
- **API token support:** respect token-bound permissions for programmatic access

### 🛠️ Admin-First Workflow
- **Inline editing:** manage everything from Settings → Strapi Advanced Sitemap  
- **Frontend base URL control:** store the live site origin once and reuse it across manual and collection previews  
- **Instant feedback:** clear success/error messages plus live URL previews for every manual entry  
- **No redeploys:** sitemap definitions are stored in Strapi entities

---

## 📸 Feature Screens

### Configure Sitemap Page
![Configure Sitemap Page](https://raw.githubusercontent.com/webbycrown/strapi-advanced-sitemap/main/assets/configure-sitemap-page.png)

### Permissions in Public Role Screen
![Permissions in Public Role Screen](https://raw.githubusercontent.com/webbycrown/strapi-advanced-sitemap/main/assets/permissions.png)

### Manual Sitemap Settings (Sitemap Index)
![Manual Sitemap Settings (Sitemap Index)](https://raw.githubusercontent.com/webbycrown/strapi-advanced-sitemap/main/assets/manual-sitemap-settings-sitemap-index.png)

### Manual Sitemap Settings (URL Set)
![Manual Sitemap Settings (Url Set)](https://raw.githubusercontent.com/webbycrown/strapi-advanced-sitemap/main/assets/manual-sitemap-settings-url-set.png)

### Collection Sitemap Settings
![Collection Sitemap Settings](https://raw.githubusercontent.com/webbycrown/strapi-advanced-sitemap/main/assets/collection-sitemap-settings.png)

### Collection Sitemap Entry
![Collection Sitemap Entry](https://raw.githubusercontent.com/webbycrown/strapi-advanced-sitemap/main/assets/collection-sitemap-entry.png)

---

## 🛠️ Installation

### Via npm
```bash
npm install @webbycrown/strapi-advanced-sitemap
```

### Via yarn
```bash
yarn add @webbycrown/strapi-advanced-sitemap
```

### Enable the plugin
Update `config/plugins.js`:
```js
module.exports = {
  'strapi-advanced-sitemap': {
    enabled: true,
  },
};
```

Restart Strapi and rebuild the admin panel:
```bash
npm run build
npm run develop
```

---

## ⚡ Quick Start

1. **Open the admin panel** → *Settings → Strapi Advanced Sitemap*  
2. **Add a manual sitemap** (single or index) and configure filename/base path  
3. **Add entries**  
   - Single sitemap: supply URLs (relative or absolute) + optional priorities  
   - Index sitemap: supply links to other sitemap files  
4. **Add a collection sitemap**: pick a collection type, define a pattern (e.g. `/articles/[slug]`), and adjust metadata  
5. **Grant permissions**: Settings → Users & Permissions → Roles → Public (or another role) → enable the sitemap actions:
   - `serveRootSitemap`
   - `serveManualSitemapIndex`
   - `serveManualSitemapFile`
   - `serveCollectionSitemapFile`

### Available Endpoints
- `/sitemap.xml` – root sitemap index (manual + collection entries)  
- `/sitemaps/manual-sitemaps` – manual sitemap index (if configured)  
- `/sitemaps/{filename}.xml` – individual manual sitemap files  
- `/api/strapi-advanced-sitemap/collection-sitemaps/{id}.xml` – collection XML (also linked from the root)

---

## 🧭 Manual Sitemap Types

| Type | Emits | When to use | Entry expectations |
|------|-------|-------------|--------------------|
| **Single sitemap** | `<urlset>` | Hand-curated URLs (blogs, landing pages) | Each entry is a path or absolute URL; optional priority |
| **Sitemap index** | `<sitemapindex>` | Aggregate internal/external sitemap files | Each entry points to another sitemap file |

Relative paths are automatically combined with your configured base URL and per-sitemap base path.

---

## 🧱 Collection Sitemap Patterns

- Use `[fieldName]` tokens (nested allowed: `[author.slug]`) to build URLs  
- Combine with “Entry prefix” or “Base path” to match your routing strategy  
- `lastmod` draws from `updatedAt`, `publishedAt`, or `createdAt`  
- Draft entries are excluded when Draft & Publish is enabled

Example pattern:
```
/articles/[slug]
```

---

## 🔐 Permissions & Security

- Actions live under `plugin::strapi-advanced-sitemap.*`  
- Denied roles receive `401 Unauthorized` responses  
- API tokens respect the same action mapping  
- Manual sitemaps store relative paths only—final URLs are resolved server side

---

## 🧪 Troubleshooting

| Symptom | Fix |
|---------|-----|
| Sitemap returns 401 | Enable the corresponding plugin actions for that role |
| Manual sitemap URL 404s | Check filename + base path, ensure “Save changes” was clicked |
| Collection sitemap empty | Verify entries are published and the pattern resolves without leftover tokens |
| Admin UI stale | Run `npm run build` and restart Strapi |

---

## 📦 Publishing Notes

When submitting to the Strapi Marketplace include:
- Summary: “Configure manual and dynamic XML sitemaps from the Strapi admin.”  
- Feature bullets (manual vs index, collection patterns, permissions)  
- Screenshots of the Settings UI  
- Compatibility (Strapi version, Node version)  
- Link to this README for docs

---

## 📣 Changelog

### v1.0.7

- 📝 Updated the README to properly display the YouTube preview image in any documentation.

### v1.0.6

- 📝 Updated README to include Youtube Image


### v1.0.5

- 📝 Updated README to include Youtube Image

### v1.0.4

- 📝 Updated README to include Demo Video section
- ⚡ Improved documentation clarity for plugin setup and usage

### v1.0.3

- 🐛 Fixed bugs.
- 🛠️ Resolved minor issues affecting

### v1.0.2

- 📝 README documentation updates

### v1.0.1

- 📝 README documentation updates
- ✨ Improved helper text and UI hints in admin settings

### v1.0.0

- ✨ Initial release of Strapi Advanced Sitemap
- 🧭 Manual sitemap builder supporting URL sets and sitemap indexes
- ⚙️ Dynamic collection sitemaps powered by pattern tokens
- 🔐 Role-based access control for each sitemap endpoint
- 🌍 Configurable frontend base URL with live preview inside the admin panel
- 📦 Easy integration and management from Strapi settings
- 🚀 Published to NPM: @webbycrown/strapi-advanced-sitemap

---

## 📝 License

MIT – see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Crafted with ❤️ by <a href="https://webbycrown.com">WebbyCrown</a></strong>
</div>


