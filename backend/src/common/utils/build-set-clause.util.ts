export function buildSetClause(
  data: Record<string, unknown>,
  startIndex = 1,
): { setClause: string; values: unknown[] } {
  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined,
  );

  if (entries.length === 0) {
    return {
      setClause: '',
      values: [],
    };
  }

  const values = entries.map(([, value]) => value);
  const setClause = entries
    .map(([column], index) => `${column} = $${startIndex + index}`)
    .join(', ');

  return {
    setClause,
    values,
  };
}
