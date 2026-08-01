import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getEmpresaId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("empresas").select("id").eq("owner_id", user.id).single();
  return data!.id as string;
}
