/**
 * Backlink Discovery & Monitoring Service
 *
 * Tracks backlinks, monitors domain authority, and detects broken backlinks.
 * Uses a lightweight internal tracking system with periodic checks.
 */

import { logger } from '../../utils/logger';

// ── Types ──────────────────────────────────────────────────────────

export interface Backlink {
    id: string;
    sourceUrl: string;
    sourceDomain: string;
    targetUrl: string;
    anchorText: string;
    isDoFollow: boolean;
    firstSeen: string;
    lastChecked: string;
    status: 'active' | 'broken' | 'removed' | 'pending';
    httpStatus?: number;
    domainAuthority?: number;
}

export interface DomainMetrics {
    domain: string;
    domainAuthority: number;
    pageAuthority: number;
    totalBacklinks: number;
    activeBacklinks: number;
    brokenBacklinks: number;
    doFollowLinks: number;
    noFollowLinks: number;
    referringDomains: number;
    lastUpdated: string;
}

export interface BacklinkReport {
    metrics: DomainMetrics;
    newBacklinks: Backlink[];
    lostBacklinks: Backlink[];
    brokenBacklinks: Backlink[];
    topReferringDomains: { domain: string; count: number; authority: number }[];
}

// ── In-Memory Store (replace with DB in production) ────────────────

const backlinkStore: Map<string, Backlink> = new Map();
const metricsStore: Map<string, DomainMetrics> = new Map();

// ── Domain Configuration ───────────────────────────────────────────

export const MONITORED_DOMAINS = [
    'swarshala.com',
    'nextmarks.com',
    'aruvalai.io',
] as const;

type MonitoredDomain = typeof MONITORED_DOMAINS[number];

// ── Backlink Service ───────────────────────────────────────────────

export class BacklinkService {
    /**
     * Register a known backlink for tracking.
     */
    static addBacklink(backlink: Omit<Backlink, 'id' | 'firstSeen' | 'lastChecked' | 'status'>): Backlink {
        const id = `${backlink.sourceDomain}-${backlink.targetUrl}-${Date.now()}`;
        const now = new Date().toISOString();

        const entry: Backlink = {
            ...backlink,
            id,
            firstSeen: now,
            lastChecked: now,
            status: 'pending',
        };

        backlinkStore.set(id, entry);
        logger.info({ backlinkId: id, source: backlink.sourceUrl }, 'Backlink registered');
        return entry;
    }

    /**
     * Check if a backlink is still active by performing an HTTP HEAD request.
     */
    static async checkBacklink(backlinkId: string): Promise<Backlink | null> {
        const backlink = backlinkStore.get(backlinkId);
        if (!backlink) return null;

        try {
            const response = await fetch(backlink.sourceUrl, {
                method: 'HEAD',
                redirect: 'follow',
                signal: AbortSignal.timeout(10000),
            });

            const now = new Date().toISOString();
            const updatedBacklink: Backlink = {
                ...backlink,
                lastChecked: now,
                httpStatus: response.status,
                status: response.ok ? 'active' : 'broken',
            };

            backlinkStore.set(backlinkId, updatedBacklink);
            return updatedBacklink;
        } catch (error) {
            const now = new Date().toISOString();
            const updatedBacklink: Backlink = {
                ...backlink,
                lastChecked: now,
                status: 'broken',
            };

            backlinkStore.set(backlinkId, updatedBacklink);
            logger.warn({ backlinkId, error }, 'Backlink check failed');
            return updatedBacklink;
        }
    }

    /**
     * Run a health check on all tracked backlinks.
     */
    static async checkAllBacklinks(): Promise<{ checked: number; broken: number }> {
        let checked = 0;
        let broken = 0;

        for (const [id] of backlinkStore) {
            const result = await BacklinkService.checkBacklink(id);
            checked++;
            if (result?.status === 'broken') broken++;

            // Rate limit: wait 1s between checks
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        logger.info({ checked, broken }, 'Backlink health check complete');
        return { checked, broken };
    }

    /**
     * Get all backlinks for a domain.
     */
    static getBacklinks(domain: string, status?: Backlink['status']): Backlink[] {
        const results: Backlink[] = [];
        for (const backlink of backlinkStore.values()) {
            const targetDomain = new URL(backlink.targetUrl).hostname.replace('www.', '');
            if (targetDomain === domain && (!status || backlink.status === status)) {
                results.push(backlink);
            }
        }
        return results;
    }

    /**
     * Get broken backlinks for a domain.
     */
    static getBrokenBacklinks(domain: string): Backlink[] {
        return BacklinkService.getBacklinks(domain, 'broken');
    }

    /**
     * Update domain metrics.
     */
    static updateMetrics(domain: MonitoredDomain, metrics: Partial<DomainMetrics>): DomainMetrics {
        const existing = metricsStore.get(domain) || {
            domain,
            domainAuthority: 0,
            pageAuthority: 0,
            totalBacklinks: 0,
            activeBacklinks: 0,
            brokenBacklinks: 0,
            doFollowLinks: 0,
            noFollowLinks: 0,
            referringDomains: 0,
            lastUpdated: new Date().toISOString(),
        };

        const updated: DomainMetrics = {
            ...existing,
            ...metrics,
            lastUpdated: new Date().toISOString(),
        };

        metricsStore.set(domain, updated);
        return updated;
    }

    /**
     * Get domain metrics.
     */
    static getMetrics(domain: string): DomainMetrics | null {
        return metricsStore.get(domain) || null;
    }

    /**
     * Generate a full backlink report for a domain.
     */
    static generateReport(domain: MonitoredDomain): BacklinkReport {
        const allBacklinks = BacklinkService.getBacklinks(domain);
        const metrics = BacklinkService.getMetrics(domain) || {
            domain,
            domainAuthority: 0,
            pageAuthority: 0,
            totalBacklinks: allBacklinks.length,
            activeBacklinks: allBacklinks.filter(b => b.status === 'active').length,
            brokenBacklinks: allBacklinks.filter(b => b.status === 'broken').length,
            doFollowLinks: allBacklinks.filter(b => b.isDoFollow).length,
            noFollowLinks: allBacklinks.filter(b => !b.isDoFollow).length,
            referringDomains: new Set(allBacklinks.map(b => b.sourceDomain)).size,
            lastUpdated: new Date().toISOString(),
        };

        // New backlinks (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const newBacklinks = allBacklinks.filter(b => b.firstSeen >= weekAgo);

        // Broken backlinks
        const brokenBacklinks = allBacklinks.filter(b => b.status === 'broken');

        // Lost backlinks (removed in last 30 days)
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const lostBacklinks = allBacklinks.filter(b => b.status === 'removed' && b.lastChecked >= monthAgo);

        // Top referring domains
        const domainCounts = new Map<string, { count: number; authority: number }>();
        for (const bl of allBacklinks) {
            const existing = domainCounts.get(bl.sourceDomain);
            if (existing) {
                existing.count++;
            } else {
                domainCounts.set(bl.sourceDomain, { count: 1, authority: bl.domainAuthority || 0 });
            }
        }
        const topReferringDomains = Array.from(domainCounts.entries())
            .map(([domain, data]) => ({ domain, ...data }))
            .sort((a, b) => b.authority - a.authority)
            .slice(0, 10);

        return {
            metrics,
            newBacklinks,
            lostBacklinks,
            brokenBacklinks,
            topReferringDomains,
        };
    }

    /**
     * Remove a backlink from tracking.
     */
    static removeBacklink(backlinkId: string): boolean {
        return backlinkStore.delete(backlinkId);
    }

    /**
     * Get summary stats across all monitored domains.
     */
    static getSummary(): {
        domains: { domain: string; metrics: DomainMetrics | null }[];
        totalBacklinks: number;
        totalBroken: number;
    } {
        const domains = MONITORED_DOMAINS.map(domain => ({
            domain,
            metrics: BacklinkService.getMetrics(domain),
        }));

        let totalBacklinks = 0;
        let totalBroken = 0;
        for (const domain of MONITORED_DOMAINS) {
            const backlinks = BacklinkService.getBacklinks(domain);
            totalBacklinks += backlinks.length;
            totalBroken += backlinks.filter(b => b.status === 'broken').length;
        }

        return { domains, totalBacklinks, totalBroken };
    }
}
