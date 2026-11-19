import { createClient } from "@/lib/supabase/server";
import { HeaderClient } from "./header-client";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <HeaderClient signedIn={Boolean(data?.claims)} />;
}
