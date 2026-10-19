import { Hono } from "hono";
import type { AppContext, DB } from "../core/hono-types";
import { and, count, eq } from "drizzle-orm";
import type { FeedReactionCounts, FeedReactionsResponse, ReactionType } from "@rin/api";
import { REACTION_TYPES } from "@rin/api";
import { feedReactions, feeds } from "../db/schema";
import { profileAsync } from "../core/server-timing";

async function hashVisitor(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function getVisitorIp(c: AppContext): string {
    return c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || "UNK";
}

function emptyCounts(): FeedReactionCounts {
    return { like: 0, love: 0, haha: 0, wow: 0, sad: 0 };
}

async function loadReactionState(
    db: DB,
    feedId: number,
    visitorHash: string | null
): Promise<FeedReactionsResponse> {
    const rows = await db
        .select({ reaction: feedReactions.reaction, total: count() })
        .from(feedReactions)
        .where(eq(feedReactions.feedId, feedId))
        .groupBy(feedReactions.reaction);

    const counts = emptyCounts();
    for (const row of rows) {
        if (REACTION_TYPES.includes(row.reaction as ReactionType)) {
            counts[row.reaction as ReactionType] = row.total;
        }
    }

    let mine: ReactionType | null = null;
    if (visitorHash) {
        const existing = await db.query.feedReactions.findFirst({
            where: and(eq(feedReactions.feedId, feedId), eq(feedReactions.visitorHash, visitorHash)),
        });
        mine = (existing?.reaction as ReactionType) ?? null;
    }

    return { counts, mine };
}

export function ReactionService(): Hono {
    const app = new Hono();

    app.get('/:feed', async (c: AppContext) => {
        const db = c.get('db');
        const clientConfig = c.get('clientConfig');
        const feedId = parseInt(c.req.param('feed'));

        if (!Number.isInteger(feedId) || feedId <= 0) {
            return c.text('Invalid feed id', 400);
        }

        const exist = await profileAsync(c, 'reaction_get_feed', () => db.query.feeds.findFirst({ where: eq(feeds.id, feedId) }));
        if (!exist) {
            return c.text('Feed not found', 404);
        }

        const enabled = await profileAsync(c, 'reaction_get_flag', () => clientConfig.getOrDefault('reaction.enabled', true));
        if (!enabled) {
            return c.json({ counts: emptyCounts(), mine: null });
        }

        const visitorHash = await hashVisitor(getVisitorIp(c));
        return c.json(await loadReactionState(db, feedId, visitorHash));
    });

    app.post('/:feed', async (c: AppContext) => {
        const db = c.get('db');
        const clientConfig = c.get('clientConfig');
        const feedId = parseInt(c.req.param('feed'));

        if (!Number.isInteger(feedId) || feedId <= 0) {
            return c.text('Invalid feed id', 400);
        }

        const enabled = await profileAsync(c, 'reaction_toggle_flag', () => clientConfig.getOrDefault('reaction.enabled', true));
        if (!enabled) {
            return c.text('Reactions are disabled', 404);
        }

        let body: { reaction?: string };
        try {
            body = await c.req.json();
        } catch {
            return c.text('Invalid request body', 400);
        }

        const reaction = body?.reaction;
        if (!reaction || !REACTION_TYPES.includes(reaction as ReactionType)) {
            return c.text('Invalid reaction type', 400);
        }

        const exist = await profileAsync(c, 'reaction_toggle_feed', () => db.query.feeds.findFirst({ where: eq(feeds.id, feedId) }));
        if (!exist) {
            return c.text('Feed not found', 404);
        }

        const visitorHash = await hashVisitor(getVisitorIp(c));

        const existing = await db.query.feedReactions.findFirst({
            where: and(eq(feedReactions.feedId, feedId), eq(feedReactions.visitorHash, visitorHash)),
        });

        if (existing?.reaction === reaction) {
            // 再次点击同一表情 = 取消
            await profileAsync(c, 'reaction_toggle_delete', () => db.delete(feedReactions)
                .where(and(eq(feedReactions.feedId, feedId), eq(feedReactions.visitorHash, visitorHash))));
        } else if (existing) {
            // 切换到其它表情
            await profileAsync(c, 'reaction_toggle_update', () => db.update(feedReactions)
                .set({ reaction, updatedAt: new Date() })
                .where(and(eq(feedReactions.feedId, feedId), eq(feedReactions.visitorHash, visitorHash))));
        } else {
            await profileAsync(c, 'reaction_toggle_insert', () => db.insert(feedReactions)
                .values({ feedId, visitorHash, reaction })
                .onConflictDoNothing());
        }

        return c.json(await loadReactionState(db, feedId, visitorHash));
    });

    return app;
}
