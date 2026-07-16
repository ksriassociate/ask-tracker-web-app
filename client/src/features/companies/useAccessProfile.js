import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const initialState = { loading: true, user: null, profile: null, error: "" };

function withTimeout(promise, milliseconds, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(`${label} timed out. Check the Supabase URL, anon key, and internet connection.`)), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

export function useAccessProfile() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const { data: sessionData, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          6000,
          "Session check"
        );
        const user = sessionData?.session?.user ?? null;

        if (!mounted) return;
        if (sessionError || !user) {
          setState({ loading: false, user: null, profile: null, error: "" });
          return;
        }

        const { data: profile, error } = await withTimeout(
          supabase
            .from("user_profiles")
            .select("id, full_name, role, employee_id, is_active")
            .eq("id", user.id)
            .maybeSingle(),
          8000,
          "Access-profile check"
        );

        if (!mounted) return;

        if (error) {
          setState({
            loading: false,
            user,
            profile: null,
            error: `Could not load your access profile: ${error.message}`,
          });
          return;
        }

        if (!profile) {
          setState({
            loading: false,
            user,
            profile: null,
            error: "Your signed-in account has no access profile. Ask a Principal Admin to add your user_profiles record.",
          });
          return;
        }

        if (!profile.is_active) {
          setState({
            loading: false,
            user,
            profile: null,
            error: "Your account has been disabled. Contact your Principal Admin.",
          });
          return;
        }

        setState({ loading: false, user, profile, error: "" });
      } catch (error) {
        if (!mounted) return;
        // A failed initial session check must not trap the user on a loader.
        // They can sign in again once the connection/configuration is corrected.
        setState({ loading: false, user: null, profile: null, error: error instanceof Error ? error.message : "Unable to contact Supabase." });
      }
    };

    loadProfile();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      // Calling getSession immediately inside Supabase's auth callback can
      // wait on the same auth lock, especially just after sign-out.
      if (event === "SIGNED_OUT") {
        if (mounted) setState({ loading: false, user: null, profile: null, error: "" });
        return;
      }
      window.setTimeout(() => loadProfile(), 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
