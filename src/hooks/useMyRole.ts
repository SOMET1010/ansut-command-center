import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyRole, type MyRoleResponse } from "@/lib/me.functions";

type State =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: MyRoleResponse; error: null }
  | { status: "error"; data: null; error: string };

export function useMyRole() {
  const fetchMyRole = useServerFn(getMyRole);
  const [state, setState] = useState<State>({
    status: "loading",
    data: null,
    error: null,
  });

  async function refresh() {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await fetchMyRole();
      setState({ status: "ready", data, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setState({ status: "error", data: null, error: msg });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { ...state, refresh };
}
