import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildClientExportText } from "@/lib/client-export";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "coach") {
    return NextResponse.json({ error: "Coach access only." }, { status: 403 });
  }

  const { id } = await params;
  const text = await buildClientExportText(supabase, id);
  if (!text) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const nameMatch = text.match(/^MeFirstFitness — Data Export for (.+)$/m);
  const filenameBase = (nameMatch?.[1] ?? "client").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}-mefirstfitness-data.txt"`,
    },
  });
}
