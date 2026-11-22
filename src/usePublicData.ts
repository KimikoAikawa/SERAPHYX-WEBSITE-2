import { useEffect, useMemo, useState } from "react";

type PublicRowsState<T> = {
  rows: T[];
  loading: boolean;
  error: string;
  reload: () => void;
};

export function usePublicRows<T>(
  table: string,
  columns: string,
  orderBy: string,
  filters: ReadonlyArray<readonly [string, string | number | boolean]> = [],
  ascending = true,
): PublicRowsState<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { supabase } = await import("./supabase");
        if (!supabase) {
          if (active) {
            setRows([]);
            setLoading(false);
            setError("The content database is not configured.");
          }
          return;
        }
        let query = supabase.from(table).select(columns).order(orderBy, { ascending });
        for (const [column, value] of JSON.parse(filterKey) as Array<[string, string | number | boolean]>) {
          query = query.eq(column, value);
        }
        const { data, error: queryError } = await query;
        if (!active) return;
        if (queryError) {
          setError("Published content could not be loaded.");
          setLoading(false);
          return;
        }
        setRows((data ?? []) as T[]);
        setError("");
        setLoading(false);
      } catch {
        if (!active) return;
        setError("Published content could not be loaded.");
        setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [table, columns, orderBy, filterKey, ascending, revision]);

  return { rows, loading, error, reload: () => setRevision((value) => value + 1) };
}

export function usePublicSetting<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { supabase } = await import("./supabase");
        if (!supabase) {
          if (active) {
            setError("The content database is not configured.");
            setLoading(false);
          }
          return;
        }
        const { data, error: queryError } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", key)
          .eq("is_public", true)
          .maybeSingle();
        if (!active) return;
        if (queryError) {
          setError("This setting could not be loaded.");
        } else if (data?.value !== undefined) {
          setValue(data.value as T);
        }
        setLoading(false);
      } catch {
        if (!active) return;
        setError("This setting could not be loaded.");
        setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [key]);

  return { value, loading, error };
}
