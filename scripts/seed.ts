/**
 * Seed script: creates a platform admin user and a demo tenant with sample data.
 *
 * Usage: npx tsx scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...\n');

    // ── 1. Platform Admin Tenant + User ────────────────────────
    const platformTenant = await prisma.tenant.upsert({
        where: { slug: 'platform' },
        update: {},
        create: {
            slug: 'platform',
            name: 'SwarShala Platform',
            status: 'ACTIVE',
        },
    });
    console.log(`✅ Platform tenant: ${platformTenant.slug} (${platformTenant.id})`);

    const adminPasswordHash = await argon2.hash('Admin@12345', { type: argon2.argon2id });

    const platformAdmin = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: platformTenant.id, email: 'admin@swarshala.com' } },
        update: {},
        create: {
            tenantId: platformTenant.id,
            email: 'admin@swarshala.com',
            passwordHash: adminPasswordHash,
            name: 'Platform Admin',
            role: 'PLATFORM_ADMIN',
            isActive: true,
        },
    });
    console.log(`✅ Platform admin: ${platformAdmin.email} (password: Admin@12345)`);

    // ── 2. SwarShala Website Tenant (for public website forms) ─
    const swarshalaOwnerHash = await argon2.hash('SwarShala@12345', { type: argon2.argon2id });

    const swarshalaWebTenant = await prisma.tenant.upsert({
        where: { slug: 'swarshala' },
        update: {},
        create: {
            slug: 'swarshala',
            name: 'SwarShala Music Academy',
            status: 'ACTIVE',
            settings: {
                currency: 'INR',
                timezone: 'Asia/Kolkata',
                isWebsiteTenant: true,
            },
        },
    });
    console.log(`✅ SwarShala tenant: ${swarshalaWebTenant.slug} (${swarshalaWebTenant.id})`);

    const swarshalaOwner = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: swarshalaWebTenant.id, email: 'owner@swarshala.com' } },
        update: {},
        create: {
            tenantId: swarshalaWebTenant.id,
            email: 'owner@swarshala.com',
            passwordHash: swarshalaOwnerHash,
            name: 'SwarShala Admin',
            role: 'TENANT_OWNER',
            isActive: true,
        },
    });
    console.log(`✅ SwarShala owner: ${swarshalaOwner.email} (password: SwarShala@12345)`);

    // ── 3. Demo Tenant ─────────────────────────────────────────
    const demoTenant = await prisma.tenant.upsert({
        where: { slug: 'instatune' },
        update: {},
        create: {
            slug: 'instatune',
            name: 'InstaTune Music Academy',
            status: 'ACTIVE',
            settings: {
                currency: 'INR',
                timezone: 'Asia/Kolkata',
            },
        },
    });
    console.log(`✅ Demo tenant: ${demoTenant.slug} (${demoTenant.id})`);

    const ownerPasswordHash = await argon2.hash('Owner@12345', { type: argon2.argon2id });

    const owner = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: demoTenant.id, email: 'owner@instatune.com' } },
        update: {},
        create: {
            tenantId: demoTenant.id,
            email: 'owner@instatune.com',
            passwordHash: ownerPasswordHash,
            name: 'Rahul Sharma',
            role: 'TENANT_OWNER',
            isActive: true,
        },
    });
    console.log(`✅ Tenant owner: ${owner.email} (password: Owner@12345)`);

    const staffPasswordHash = await argon2.hash('Staff@12345', { type: argon2.argon2id });

    const staff = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: demoTenant.id, email: 'staff@instatune.com' } },
        update: {},
        create: {
            tenantId: demoTenant.id,
            email: 'staff@instatune.com',
            passwordHash: staffPasswordHash,
            name: 'Priya Singh',
            role: 'TENANT_STAFF',
            isActive: true,
        },
    });
    console.log(`✅ Tenant staff: ${staff.email} (password: Staff@12345)`);

    // ── 3. Demo Products ───────────────────────────────────────
    const products = await Promise.all([
        prisma.product.create({
            data: {
                tenantId: demoTenant.id,
                type: 'COURSE',
                name: 'Guitar Beginner Course (3 months)',
                description: 'Comprehensive beginner guitar course covering chords, strumming, and basic theory.',
                price: 12000,
                currency: 'INR',
                duration: '3 months',
                taxRate: 18,
                isActive: true,
            },
        }),
        prisma.product.create({
            data: {
                tenantId: demoTenant.id,
                type: 'COURSE',
                name: 'Tabla Intermediate Course (6 months)',
                description: 'Intermediate level tabla training focusing on classical compositions.',
                price: 18000,
                currency: 'INR',
                duration: '6 months',
                taxRate: 18,
                isActive: true,
            },
        }),
        prisma.product.create({
            data: {
                tenantId: demoTenant.id,
                type: 'INSTRUMENT',
                name: 'Yamaha Acoustic Guitar',
                description: 'Yamaha F280 acoustic guitar for beginners.',
                price: 8500,
                currency: 'INR',
                duration: null,
                taxRate: 12,
                isActive: true,
            },
        }),
        prisma.product.create({
            data: {
                tenantId: demoTenant.id,
                type: 'SERVICE',
                name: 'Home Tutor Visit',
                description: 'Single home tutor session (1 hour).',
                price: 1500,
                currency: 'INR',
                duration: '1 hour',
                taxRate: 18,
                isActive: true,
            },
        }),
    ]);
    console.log(`✅ ${products.length} demo products created`);

    // ── 4. Demo Leads ──────────────────────────────────────────
    const leads = await Promise.all([
        prisma.lead.create({
            data: {
                tenantId: demoTenant.id,
                name: 'Amit Kumar',
                phone: '+91-9876543210',
                email: 'amit@example.com',
                city: 'Mumbai',
                instrument: 'Guitar',
                courseInterest: 'Beginner Guitar',
                preferredTime: 'Weekday Evenings',
                message: 'Want to learn guitar from scratch.',
                status: 'NEW',
                source: 'WEBSITE',
                utm: { utm_source: 'google', utm_medium: 'cpc' },
            },
        }),
        prisma.lead.create({
            data: {
                tenantId: demoTenant.id,
                name: 'Sneha Patel',
                phone: '+91-9123456789',
                email: 'sneha@example.com',
                city: 'Delhi',
                instrument: 'Tabla',
                courseInterest: 'Intermediate Tabla',
                preferredTime: 'Weekends',
                status: 'CONTACTED',
                source: 'REFERRAL',
                assignedToId: staff.id,
            },
        }),
    ]);

    for (const lead of leads) {
        await prisma.leadActivity.create({
            data: { leadId: lead.id, action: 'CREATED', details: { source: lead.source } },
        });
    }
    console.log(`✅ ${leads.length} demo leads created`);

    // ── 5. Demo Client ─────────────────────────────────────────
    const client = await prisma.client.create({
        data: {
            tenantId: demoTenant.id,
            name: 'Neha Gupta',
            phone: '+91-9988776655',
            email: 'neha@example.com',
            city: 'Bangalore',
            instruments: ['Keyboard', 'Vocals'],
            preferences: { level: 'intermediate', preferOnline: true },
        },
    });
    console.log(`✅ Demo client: ${client.name} (${client.id})`);

    console.log('\n🎉 Seed complete!');
    console.log('\n── Quick Start ──');
    console.log('Platform admin login:   admin@swarshala.com / Admin@12345');
    console.log('SwarShala owner login:  owner@swarshala.com / SwarShala@12345 (X-Tenant-Slug: swarshala)');
    console.log('Tenant owner login:     owner@instatune.com / Owner@12345 (X-Tenant-Slug: instatune)');
    console.log('Tenant staff login:     staff@instatune.com / Staff@12345 (X-Tenant-Slug: instatune)');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
