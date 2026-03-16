import { Router } from 'express';
import { BacklinkService, MONITORED_DOMAINS } from './backlink.service';
import { SeoAnalyticsService } from './seo-analytics.service';

const router = Router();

// ── Backlink Endpoints ─────────────────────────────────────────────

// GET /api/v1/seo/backlinks/:domain
router.get('/backlinks/:domain', (req, res) => {
    const { domain } = req.params;
    const { status } = req.query;
    const backlinks = BacklinkService.getBacklinks(
        domain,
        status as 'active' | 'broken' | 'removed' | 'pending' | undefined,
    );
    res.json({ data: backlinks, count: backlinks.length });
});

// POST /api/v1/seo/backlinks
router.post('/backlinks', (req, res) => {
    const { sourceUrl, sourceDomain, targetUrl, anchorText, isDoFollow, domainAuthority } = req.body;
    if (!sourceUrl || !sourceDomain || !targetUrl) {
        res.status(400).json({ error: 'sourceUrl, sourceDomain, and targetUrl are required' });
        return;
    }
    const backlink = BacklinkService.addBacklink({
        sourceUrl,
        sourceDomain,
        targetUrl,
        anchorText: anchorText || '',
        isDoFollow: isDoFollow ?? true,
        domainAuthority,
    });
    res.status(201).json({ data: backlink });
});

// POST /api/v1/seo/backlinks/check-all
router.post('/backlinks/check-all', async (_req, res) => {
    const result = await BacklinkService.checkAllBacklinks();
    res.json({ data: result });
});

// GET /api/v1/seo/backlinks/:domain/broken
router.get('/backlinks/:domain/broken', (req, res) => {
    const broken = BacklinkService.getBrokenBacklinks(req.params.domain);
    res.json({ data: broken, count: broken.length });
});

// GET /api/v1/seo/backlinks/:domain/report
router.get('/backlinks/:domain/report', (req, res) => {
    const domain = req.params.domain as typeof MONITORED_DOMAINS[number];
    if (!MONITORED_DOMAINS.includes(domain)) {
        res.status(400).json({ error: `Domain must be one of: ${MONITORED_DOMAINS.join(', ')}` });
        return;
    }
    const report = BacklinkService.generateReport(domain);
    res.json({ data: report });
});

// PUT /api/v1/seo/metrics/:domain
router.put('/metrics/:domain', (req, res) => {
    const domain = req.params.domain as typeof MONITORED_DOMAINS[number];
    if (!MONITORED_DOMAINS.includes(domain)) {
        res.status(400).json({ error: `Domain must be one of: ${MONITORED_DOMAINS.join(', ')}` });
        return;
    }
    const metrics = BacklinkService.updateMetrics(domain, req.body);
    res.json({ data: metrics });
});

// GET /api/v1/seo/metrics/:domain
router.get('/metrics/:domain', (req, res) => {
    const metrics = BacklinkService.getMetrics(req.params.domain);
    res.json({ data: metrics });
});

// GET /api/v1/seo/summary
router.get('/summary', (_req, res) => {
    const summary = BacklinkService.getSummary();
    res.json({ data: summary });
});

// DELETE /api/v1/seo/backlinks/:id
router.delete('/backlinks/:id', (req, res) => {
    const deleted = BacklinkService.removeBacklink(req.params.id);
    res.json({ data: { deleted } });
});

// ── SEO Analytics Endpoints ────────────────────────────────────────

// POST /api/v1/seo/analytics/record
router.post('/analytics/record', (req, res) => {
    const { domain, indexedPages, organicTraffic, domainAuthority, pageAuthority, backlinks } = req.body;
    if (!domain) {
        res.status(400).json({ error: 'domain is required' });
        return;
    }
    const snapshot = SeoAnalyticsService.recordSnapshot({
        domain,
        indexedPages,
        organicTraffic,
        domainAuthority,
        pageAuthority,
        backlinks,
    });
    res.status(201).json({ data: snapshot });
});

// GET /api/v1/seo/analytics/:domain
router.get('/analytics/:domain', (req, res) => {
    const { days } = req.query;
    const snapshots = SeoAnalyticsService.getSnapshots(
        req.params.domain,
        days ? parseInt(days as string, 10) : 30,
    );
    res.json({ data: snapshots });
});

// GET /api/v1/seo/analytics/:domain/latest
router.get('/analytics/:domain/latest', (req, res) => {
    const latest = SeoAnalyticsService.getLatestSnapshot(req.params.domain);
    res.json({ data: latest });
});

// GET /api/v1/seo/analytics/:domain/trend
router.get('/analytics/:domain/trend', (req, res) => {
    const { days } = req.query;
    const trend = SeoAnalyticsService.getTrend(
        req.params.domain,
        days ? parseInt(days as string, 10) : 30,
    );
    res.json({ data: trend });
});

// GET /api/v1/seo/dashboard
router.get('/dashboard', (_req, res) => {
    const dashboard = SeoAnalyticsService.getDashboard();
    res.json({ data: dashboard });
});

export default router;
