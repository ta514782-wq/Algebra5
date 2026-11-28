export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawNonRepeatingSession<T extends { id: string }>(
  pool: T[],
  seenIds: Set<string>,
  count = 10
): {
  questions: T[];
  nextSeenIds: Set<string>;
  resetCycle: boolean;
  unseenRemainingBeforeDraw: number;
} {
  if (pool.length === 0) {
    return {
      questions: [],
      nextSeenIds: new Set(seenIds),
      resetCycle: false,
      unseenRemainingBeforeDraw: 0,
    };
  }
  const unseen = pool.filter((q) => !seenIds.has(q.id));
  if (unseen.length >= Math.min(count, pool.length)) {
    const drawn = shuffleArray(unseen).slice(0, count);
    const nextSeen = new Set(seenIds);
    drawn.forEach((q) => nextSeen.add(q.id));
    return {
      questions: drawn,
      nextSeenIds: nextSeen,
      resetCycle: false,
      unseenRemainingBeforeDraw: unseen.length,
    };
  }

  // Fewer unseen questions remain than needed: include remaining unseen first, then reshuffle pool excluding those
  const picked = shuffleArray(unseen);
  const pickedIds = new Set(picked.map((q) => q.id));
  const refill = shuffleArray(pool.filter((q) => !pickedIds.has(q.id))).slice(
    0,
    Math.max(0, count - picked.length)
  );
  const combined = [...picked, ...refill];
  const nextSeen = new Set<string>(combined.map((q) => q.id));
  return {
    questions: combined,
    nextSeenIds: nextSeen,
    resetCycle: unseen.length < pool.length,
    unseenRemainingBeforeDraw: unseen.length,
  };
}
