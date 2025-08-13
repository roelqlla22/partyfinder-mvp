import type { AppProps } from "next/app";
import "../styles/globals.css";
import NavBar from "../components/NavBar";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase-browser";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const uid = session.user.id;
        const { data } = await supabase.from("user_profiles").select("id").eq("id", uid).maybeSingle();
        if (!data) { await supabase.from("user_profiles").insert({ id: uid, name: session.user.user_metadata?.name ?? null }); }
        if (!location.pathname.startsWith("/profile")) router.replace("/profile");
      }
    });
    return () => { sub?.subscription.unsubscribe(); };
  }, [router]);

  return (
    <>
      <NavBar />
      <main className="max-w-6xl mx-auto px-3 py-6">
        <Component {...pageProps} />
      </main>
    </>
  );
}