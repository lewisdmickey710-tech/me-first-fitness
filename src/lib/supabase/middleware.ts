import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/reset-password"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "client";

    if (path === "/login" || path === "/") {
      const url = request.nextUrl.clone();
      url.pathname = role === "coach" ? "/coach/roster" : "/client/dashboard";
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/coach") && role !== "coach") {
      const url = request.nextUrl.clone();
      url.pathname = "/client/dashboard";
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/client") && role !== "client") {
      const url = request.nextUrl.clone();
      url.pathname = "/coach/roster";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
