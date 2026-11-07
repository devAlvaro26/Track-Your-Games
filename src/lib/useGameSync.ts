import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "../types";
import { saveGameToDb, deleteGameFromDb } from "./database";

export type SyncOp = { kind: "upsert"; game: Game } | { kind: "delete"; id: string };

const DEBOUNCE_MS = 600;
const BASE_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 30000;

const storageKey = (userId: string) => `tyg_pending_sync_${userId}`;

export function readPendingOps(userId: string): Map<string, SyncOp> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return new Map(Object.entries(JSON.parse(raw)) as [string, SyncOp][]);
  } catch (e) {
    console.warn("Could not read pending sync operations:", e);
  }
  return new Map();
}

function writePendingOps(userId: string, ops: Map<string, SyncOp>) {
  try {
    if (ops.size === 0) localStorage.removeItem(storageKey(userId));
    else localStorage.setItem(storageKey(userId), JSON.stringify(Object.fromEntries(ops)));
  } catch (e) {
    console.warn("Could not persist pending sync operations:", e);
  }
}

/** Overlays operations that have not reached the server yet onto a freshly fetched library. */
export function applyPendingOps(games: Game[], ops: Map<string, SyncOp>): Game[] {
  if (ops.size === 0) return games;

  const result = games
    .filter((g) => ops.get(g.id)?.kind !== "delete")
    .map((g) => {
      const op = ops.get(g.id);
      return op?.kind === "upsert" ? op.game : g;
    });

  const known = new Set(games.map((g) => g.id));
  for (const op of ops.values()) {
    if (op.kind === "upsert" && !known.has(op.game.id)) result.unshift(op.game);
  }
  return result;
}

/**
 * Debounced, persisted, retrying write queue for the games table.
 * Operations are coalesced per game id and survive reloads and offline periods.
 */
export function useGameSync(userId: string | null) {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  const opsRef = useRef<Map<string, SyncOp>>(new Map());
  const userIdRef = useRef<string | null>(userId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flushingRef = useRef(false);
  const attemptsRef = useRef(0);
  const flushRef = useRef<() => Promise<void>>(async () => {});

  const schedule = useCallback((delay: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushRef.current();
    }, delay);
  }, []);

  flushRef.current = async () => {
    const uid = userIdRef.current;
    if (!uid || flushingRef.current) return;

    flushingRef.current = true;
    let failed = false;

    try {
      for (const [id, op] of Array.from(opsRef.current.entries())) {
        try {
          if (op.kind === "upsert") await saveGameToDb(op.game, uid);
          else await deleteGameFromDb(op.id, uid);
          // A newer op for the same game may have replaced this one while it was in flight.
          if (opsRef.current.get(id) === op) opsRef.current.delete(id);
        } catch (err: any) {
          failed = true;
          setSyncError(err?.message || "sync failed");
          break;
        }
      }
    } finally {
      flushingRef.current = false;
      if (userIdRef.current === uid) {
        writePendingOps(uid, opsRef.current);
        setPendingCount(opsRef.current.size);
      }
    }

    if (userIdRef.current !== uid) return;

    if (failed) {
      attemptsRef.current += 1;
      schedule(Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** (attemptsRef.current - 1)));
    } else {
      attemptsRef.current = 0;
      setSyncError(null);
      if (opsRef.current.size > 0) schedule(DEBOUNCE_MS);
    }
  };

  useEffect(() => {
    userIdRef.current = userId;
    if (timerRef.current) clearTimeout(timerRef.current);
    attemptsRef.current = 0;
    setSyncError(null);
    opsRef.current = userId ? readPendingOps(userId) : new Map();
    setPendingCount(opsRef.current.size);
    if (userId && opsRef.current.size > 0) schedule(0);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userId, schedule]);

  useEffect(() => {
    const onOnline = () => {
      attemptsRef.current = 0;
      schedule(0);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [schedule]);

  const enqueue = useCallback(
    (op: SyncOp) => {
      const uid = userIdRef.current;
      if (!uid) return;
      const id = op.kind === "upsert" ? op.game.id : op.id;
      opsRef.current.set(id, op);
      writePendingOps(uid, opsRef.current);
      setPendingCount(opsRef.current.size);
      schedule(DEBOUNCE_MS);
    },
    [schedule]
  );

  const enqueueUpsert = useCallback((game: Game) => enqueue({ kind: "upsert", game }), [enqueue]);
  const enqueueDelete = useCallback((id: string) => enqueue({ kind: "delete", id }), [enqueue]);

  const retryNow = useCallback(() => {
    attemptsRef.current = 0;
    schedule(0);
  }, [schedule]);

  return { enqueueUpsert, enqueueDelete, retryNow, pendingCount, syncError };
}
