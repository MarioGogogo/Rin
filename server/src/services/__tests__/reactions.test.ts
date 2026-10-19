import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ReactionService } from '../reactions';
import { Hono } from "hono";
import type { Variables } from "../../core/hono-types";
import { setupTestApp, cleanupTestDB } from '../../../tests/fixtures';
import type { Database } from 'bun:sqlite';

describe('ReactionService', () => {
    let db: any;
    let sqlite: Database;
    let env: Env;
    let app: Hono<{ Bindings: Env; Variables: Variables }>;
    let clientConfig: any;

    beforeEach(async () => {
        const ctx = await setupTestApp(ReactionService);
        db = ctx.db;
        sqlite = ctx.sqlite;
        env = ctx.env;
        app = ctx.app;
        clientConfig = ctx.clientConfig;

        sqlite.exec(`
            INSERT INTO users (id, username, avatar, permission, openid) VALUES
                (1, 'user1', 'avatar1.png', 0, 'gh_1')
        `);
        sqlite.exec(`
            INSERT INTO feeds (id, title, content, uid, draft, listed) VALUES
                (1, 'Feed 1', 'Content 1', 1, 0, 1),
                (2, 'Feed 2', 'Content 2', 1, 0, 1)
        `);
    });

    afterEach(() => {
        cleanupTestDB(sqlite);
    });

    function post(path: string, body: unknown, ip?: string) {
        return app.request(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(ip ? { 'cf-connecting-ip': ip } : {}),
            },
            body: JSON.stringify(body),
        }, env);
    }

    function get(path: string, ip?: string) {
        return app.request(path, {
            method: 'GET',
            headers: ip ? { 'cf-connecting-ip': ip } : {},
        }, env);
    }

    it('GET returns zero counts and null mine when no reactions exist', async () => {
        const res = await get('/1', '1.1.1.1');
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.counts).toEqual({ like: 0, love: 0, haha: 0, wow: 0, sad: 0 });
        expect(data.mine).toBeNull();
    });

    it('POST adds a reaction and returns counts with mine', async () => {
        const res = await post('/1', { reaction: 'like' }, '1.1.1.1');
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.counts.like).toBe(1);
        expect(data.mine).toBe('like');

        const rows = sqlite.prepare(`SELECT * FROM feed_reactions WHERE feed_id = 1`).all();
        expect(rows.length).toBe(1);
    });

    it('POST same reaction again cancels it', async () => {
        await post('/1', { reaction: 'like' }, '1.1.1.1');
        const res = await post('/1', { reaction: 'like' }, '1.1.1.1');
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.counts.like).toBe(0);
        expect(data.mine).toBeNull();

        const rows = sqlite.prepare(`SELECT * FROM feed_reactions WHERE feed_id = 1`).all();
        expect(rows.length).toBe(0);
    });

    it('POST a different reaction switches it', async () => {
        await post('/1', { reaction: 'like' }, '1.1.1.1');
        const res = await post('/1', { reaction: 'love' }, '1.1.1.1');
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.counts.like).toBe(0);
        expect(data.counts.love).toBe(1);
        expect(data.mine).toBe('love');

        const rows = sqlite.prepare(`SELECT * FROM feed_reactions WHERE feed_id = 1`).all();
        expect(rows.length).toBe(1);
        expect((rows[0] as any).reaction).toBe('love');
    });

    it('different visitors are counted independently', async () => {
        await post('/1', { reaction: 'like' }, '1.1.1.1');
        await post('/1', { reaction: 'like' }, '2.2.2.2');
        const res = await get('/1', '3.3.3.3');
        const data = await res.json() as any;
        expect(data.counts.like).toBe(2);
        expect(data.mine).toBeNull();

        const rows = sqlite.prepare(`SELECT * FROM feed_reactions WHERE feed_id = 1`).all();
        expect(rows.length).toBe(2);
    });

    it('rejects invalid reaction type and missing feed', async () => {
        const invalid = await post('/1', { reaction: 'angry' }, '1.1.1.1');
        expect(invalid.status).toBe(400);

        const missing = await post('/999', { reaction: 'like' }, '1.1.1.1');
        expect(missing.status).toBe(404);

        const missingGet = await get('/999', '1.1.1.1');
        expect(missingGet.status).toBe(404);
    });

    it('falls back to UNK visitor identity when no ip headers', async () => {
        const res = await post('/1', { reaction: 'wow' });
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.counts.wow).toBe(1);
        expect(data.mine).toBe('wow');

        // 同一 UNK 身份再点击同表情 = 取消
        const res2 = await post('/1', { reaction: 'wow' });
        const data2 = await res2.json() as any;
        expect(data2.counts.wow).toBe(0);
        expect(data2.mine).toBeNull();
    });

    it('POST returns 404 when reaction.enabled is false', async () => {
        await clientConfig.set('reaction.enabled', false);

        const res = await post('/1', { reaction: 'like' }, '1.1.1.1');
        expect(res.status).toBe(404);

        const rows = sqlite.prepare(`SELECT * FROM feed_reactions`).all();
        expect(rows.length).toBe(0);
    });
});
