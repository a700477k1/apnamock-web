[DEPLOYMENT.md](https://github.com/user-attachments/files/28777122/DEPLOYMENT.md)
# ApnaMock Cloudflare Pages Deployment Guide

## Quick Start

### 1. Create GitHub Repository
- Create a new repository named `apnamock-web`
- Push these files to the main branch

### 2. Connect to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** > **Create a project**
3. Connect to your GitHub account
4. Select the `apnamock-web` repository
5. Configure build settings:
   - **Build command**: `echo "No build needed"`
   - **Build output directory**: `/` (root)
6. Click **Save and Deploy**

### 3. Custom Domain (Optional)
1. In Cloudflare Pages dashboard, go to **Custom domains**
2. Add your domain (e.g., `apnamock.com`)
3. Follow DNS configuration instructions
4. SSL certificate is automatically provisioned

## Architecture

```
Cloudflare Pages (Static HTML/CSS/JS)
    ↓
jsDelivr CDN (GitHub assets - CSS/JS/JSON)
    ↓
Google Apps Script (API - analytics, dynamic data)
    ↓
Google Sheets (Database - test data, user progress)
```

## File Structure

```
apnamock-web/
├── index.html          # Homepage
├── tests.html          # Test catalog
├── quiz.html           # Quiz interface
├── result.html         # Results page
├── favorites.html      # Saved tests
├── history.html        # Test history
├── custom-tests.html   # Custom test builder
├── privacy.html        # Privacy policy
├── terms.html          # Terms of use
├── contact.html        # Contact page
├── css/
│   └── apnamock.css    # Main stylesheet
├── js/
│   ├── apnamock-core.js
│   ├── data.js
│   ├── quiz.js
│   ├── result.js
│   └── ...             # Other modules
├── data/
│   ├── tests-index.json  # Test metadata
│   └── tests/          # Individual test files
└── assets/
    └── ...             # Images, logos
```

## Performance Optimization

### Caching Strategy
- Static assets: Cloudflare CDN (automatic)
- Test data: localStorage (7-day cache)
- User data: IndexedDB (offline support)

### Lazy Loading
- Tests: 20 per page with pagination
- Images: lazy loading with Intersection Observer
- JS modules: dynamic import() for non-critical code

## Free Tier Limits

| Service | Limit | Current Usage |
|---------|-------|---------------|
| Cloudflare Pages | Unlimited requests | Static site |
| jsDelivr | Unlimited bandwidth | GitHub assets |
| Google Apps Script | 20,000 fetches/day | API calls |
| Google Sheets | 5M cells/spreadsheet | Test data |

## Deployment Checklist

- [ ] All HTML files created
- [ ] CSS/JS paths updated to jsDelivr
- [ ] Test data uploaded to GitHub
- [ ] Google Apps Script deployed
- [ ] Environment variables set (if any)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Analytics tracking enabled

## Monitoring

- Cloudflare Analytics: Built-in (free)
- Google Analytics: Add tracking code
- Uptime: Cloudflare status page

## Support

For issues or questions:
- Cloudflare Docs: https://developers.cloudflare.com/pages
- GitHub Issues: Create issue in repository
- Community: Cloudflare Community Forums
