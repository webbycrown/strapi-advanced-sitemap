# 🚀 Strapi Advanced Sitemap

[![npm version](https://badge.fury.io/js/%40webbycrown%2Fstrapi-advanced-sitemap.svg)](https://www.npmjs.com/package/@webbycrown/strapi-advanced-sitemap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Strapi](https://img.shields.io/badge/Strapi-5.x-blue.svg)](https://strapi.io/)

SEO-ready XML sitemaps for Strapi CMS. Create manual URL sets or sitemap indexes, generate dynamic feeds from collection types, and expose every endpoint behind role-based permissions—no external services required.

📦 **NPM Package**: [@webbycrown/strapi-advanced-sitemap](https://www.npmjs.com/package/@webbycrown/strapi-advanced-sitemap)  
💻 **Repository**: [GitHub – webbycrown/strapi-advanced-sitemap](https://github.com/webbycrown/strapi-advanced-sitemap)

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
![Configure Sitemap Page](https://github.com/user-attachments/assets/5009771b-8e79-404f-9eb2-f24f40f8030b)

### Permissions in Public Role Screen
![Permissions in Public Role Screen](https://github.com/user-attachments/assets/e4c62666-2524-426e-bf7f-6988b1d1f71c)

### Manual Sitemap Settings (Sitemap Index)
![Manual Sitemap Settings (Sitemap Index)](https://github.com/user-attachments/assets/606f4e57-1897-4c9d-8de7-10df6580f06b)

### Manual Sitemap Settings (URL Set)
![Manual Sitemap Settings (Url Set)](https://github.com/user-attachments/assets/7cb32f52-eb14-4db4-84f9-cad7b0fd8ab7)

### Collection Sitemap Settings
![Collection Sitemap Settings](https://github.com/user-attachments/assets/a0597dd6-03e6-4d16-81f7-96c60c1bec60)

### Collection Sitemap Entry
![Collection Sitemap Entry](https://github.com/user-attachments/assets/b04bea0d-6c52-4795-8e65-73740e19cd3e)

---

## 🎥 Demo Video

[![Watch the demo](https://img.youtube.com/vi/4HBuf8fhNCQ/hqdefault.jpg)](https://www.youtube.com/watch?v=4HBuf8fhNCQ)  
[View on YouTube](https://www.youtube.com/watch?v=4HBuf8fhNCQ)

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

## 📝 License

MIT – see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Crafted with ❤️ by <a href="https://webbycrown.com">WebbyCrown</a></strong>
</div>


