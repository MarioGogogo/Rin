import type { FeedReactionCounts, ReactionType } from "@rin/api";
import { REACTION_TYPES } from "@rin/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { client } from "../app/runtime";

const REACTION_EMOJI: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  haha: "😄",
  wow: "😮",
  sad: "😢",
};

export function FeedReactions({ feedId }: { feedId: number }) {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<FeedReactionCounts>();
  const [mine, setMine] = useState<ReactionType | null>(null);
  const [pending, setPending] = useState<ReactionType | null>(null);

  useEffect(() => {
    let cancelled = false;
    client.reaction.get(feedId).then(({ data }) => {
      if (!cancelled && data) {
        setCounts(data.counts);
        setMine(data.mine);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [feedId]);

  async function handleToggle(type: ReactionType) {
    if (pending || !counts) return;
    const prev = { counts, mine };
    // 乐观更新：再点同款 = 取消，点其它 = 切换
    const nextMine = mine === type ? null : type;
    const nextCounts = { ...counts };
    if (mine) nextCounts[mine] = Math.max(0, nextCounts[mine] - 1);
    if (nextMine) nextCounts[nextMine] = nextCounts[nextMine] + 1;
    setCounts(nextCounts);
    setMine(nextMine);

    setPending(type);
    try {
      const { data, error } = await client.reaction.toggle(feedId, type);
      if (error || !data) {
        setCounts(prev.counts);
        setMine(prev.mine);
      } else {
        setCounts(data.counts);
        setMine(data.mine);
      }
    } catch {
      setCounts(prev.counts);
      setMine(prev.mine);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-4 flex flex-row flex-wrap gap-2" role="group" aria-label={t("reaction.title")}>
      {REACTION_TYPES.map((type) => {
        const selected = mine === type;
        return (
          <button
            key={type}
            onClick={() => handleToggle(type)}
            disabled={Boolean(pending)}
            aria-label={t(`reaction.type.${type}`)}
            aria-pressed={selected}
            title={t(`reaction.type.${type}`)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition duration-200 ${
              selected ? "bg-theme/10 text-theme" : "bg-secondary t-secondary hover:bg-theme/10 hover:text-theme"
            } ${pending === type ? "opacity-60" : ""}`}
          >
            <span className="inline-block transition-transform duration-200 active:scale-125">
              {REACTION_EMOJI[type]}
            </span>
            <span className="min-w-3 text-center tabular-nums">{counts ? counts[type] : 0}</span>
          </button>
        );
      })}
    </div>
  );
}
