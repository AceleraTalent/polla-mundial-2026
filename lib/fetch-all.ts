/**
 * Supabase/PostgREST caps a single request at 1000 rows (server-side
 * db-max-rows setting) regardless of any .limit() passed by the client.
 * Tables that can grow past that (e.g. predictions, now > 1000 rows with
 * the knockout stage added) must be paged with repeated .range() calls
 * or rows get silently dropped.
 */
export async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}
