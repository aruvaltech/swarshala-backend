/**
 * SEO Analytics Service
 *
 * Tracks and stores SEO metrics over time for all monitored domains.
 * Provides trend analysis and dashboard data.
 */

import { MONITORED_DOMAINS } from './backlink.service';
import { logger } from '../../utils/logger';

// ── Types ──────────────────────────────────────────────────────────

export interface SeoSnapshot {
    id: string;
    domain: string;
    date: string;
    indexedPages: number;
    organicTraffic: number;
    domainAuthority: number;
    pageAuthority: number;
    backlinks: number;
    createdAt: string;
}

export interface SeoTrend {
    domain: string;
    period: string;
    indexedPagesChange: number;
    organicTrafficChange: number;
    domainAuthorityChange: number;
    backlinksChange: number;
    snapshots: SeoSnapshot[];
}

export interface SeoDashboard {
    domains: {
        domain: string;
        latest: SeoSnapshot | null;
        trend: SeoTrend | null;
    }[];
    summary: {
        totalIndexedPages: number;
        totalOrganicTraffic: number;
        averageDomainAuthority: number;
        totalBacklinks: number;
    };
}

// ── In-Memory Store ────────────────────────────────────────────────

const snapshotStore: Map<string, SeoSnapshot[]> = new Map();

// ── Service ────────────────────────────────────────────────────────

export class SeoAnalyticsService {
    /**
     * Record an SEO metrics snapshot.
     */
    static recordSnapshot(data: {
        domain: string;
        indexedPages?: number;
        organicTraffic?: number;
        domainAuthority?: number;
        pageAuthority?: number;
        backlinks?: number;
    }): SeoSnapshot {
        const id = `${data.domain}-${Date.now()}`;
        const now = new Date().toISOString();

        const snapshot: SeoSnapshot = {
            id,
            domain: data.domain,
            date: now.split('T')[0],
            indexedPages: data.indexedPages ?? 0,
            organicTraffic: data.organicTraffic ?? 0,
            domainAuthority: data.domainAuthority ?? 0,
            pageAuthority: data.pageAuthority ?? 0,
            backlinks: data.backlinks ?? 0,
            createdAt: now,
        };

        const existing = snapshotStore.get(data.domain) || [];
        existing.push(snapshot);
        snapshotStore.set(data.domain, existing);

        logger.info({ domain: data.domain, snapshotId: id }, 'SEO snapshot recorded');
        return snapshot;
    }

    /**
     * Get snapshots for a domain within N days.
     */
    static getSnapshots(domain: string, days = 30): SeoSnapshot[] {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const all = snapshotStore.get(domain) || [];
        return all.filter(s => s.createdAt >= cutoff).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    /**
     * Get the latest snapshot for a domain.
     */
    static getLatestSnapshot(domain: string): SeoSnapshot | null {
        const all = snapshotStore.get(domain) || [];
        return all.length > 0 ? all[all.length - 1] : null;
    }

    /**
     * Compute trend data over a period.
     */
    static getTrend(domain: string, days = 30): SeoTrend {
        const snapshots = SeoAnalyticsService.getSnapshots(domain, days);

        let indexedPagesChange = 0;
        let organicTrafficChange = 0;
        let domainAuthorityChange = 0;
        let backlinksChange = 0;

        if (snapshots.length >= 2) {
            const first = snapshots[0];
            const last = snapshots[snapshots.length - 1];

            indexedPagesChange = last.indexedPages - first.indexedPages;
            organicTrafficChange = last.organicTraffic - first.organicTraffic;
            domainAuthorityChange = last.domainAuthority - first.domainAuthority;
            backlinksChange = last.backlinks - first.backlinks;
        }

        return {
            domain,
            period: `${days} days`,
            indexedPagesChange,
            organicTrafficChange,
            domainAuthorityChange,
            backlinksChange,
            snapshots,
        };
    }

    /**
     * Get full dashboard data across all domains.
     */
    static getDashboard(): SeoDashboard {
        const domains = MONITORED_DOMAINS.map(domain => ({
            domain,
            latest: SeoAnalyticsService.getLatestSnapshot(domain),
            trend: SeoAnalyticsService.getTrend(domain, 30),
        }));

        const latestSnapshots = domains
            .map(d => d.latest)
            .filter((s): s is SeoSnapshot => s !== null);

        const summary = {
            totalIndexedPages: latestSnapshots.reduce((sum, s) => sum + s.indexedPages, 0),
            totalOrganicTraffic: latestSnapshots.reduce((sum, s) => sum + s.organicTraffic, 0),
            averageDomainAuthority: latestSnapshots.length > 0
                ? Math.round(latestSnapshots.reduce((sum, s) => sum + s.domainAuthority, 0) / latestSnapshots.length)
                : 0,
            totalBacklinks: latestSnapshots.reduce((sum, s) => sum + s.backlinks, 0),
        };

        return { domains, summary };
    }
}
