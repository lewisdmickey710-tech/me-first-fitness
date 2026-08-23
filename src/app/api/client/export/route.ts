import { NextResponse } from "next/server";
import { getMyClient } from "@/lib/current-client";
import { createClient } from "@/lib/supabase/server";
import { buildClientExportText } from "@/lib/client-export";

export async function GET() {
  const me = await getMyClient();
  if (!me) {
    return NextResponse.json({ error: "No linked client profile found." }, { status: 404 });
  }

  const supabase = await createClient();
  const text = await buildClientExportText(supabase, me.id);
  if (!text) {
    return NextResponse.json({ error: "Nothing to export." }, { status: 404 });
  }

  const filename = `${me.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-mefirstfitness-data.txt`;
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
