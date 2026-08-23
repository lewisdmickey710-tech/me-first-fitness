import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/confirm",
  "/auth/reset-password",
  "/request-assessment",
];

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
    const homeFor = (r: string) =>
      r === "coach"
        ? "/coach/roster"
        : r === "lead"
          ? "/lead/dashboard"
          : "/client/dashboard";

    if (path === "/login" || path === "/") {
      const url = request.nextUrl.clone();
      url.pathname = homeFor(role);
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/coach") && role !== "coach") {
      const url = request.nextUrl.clone();
      url.pathname = homeFor(role);
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/client") && role !== "client") {
      const url = request.nextUrl.clone();
      url.pathname = homeFor(role);
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/lead") && role !== "lead") {
      const url = request.nextUrl.clone();
      url.pathname = homeFor(role);
      return NextResponse.redirect(url);
    }

    // Mandatory onboarding gates: contact-info profile first (both leads
    // and clients, on first sign-in), then -- once accepted as a client --
    // the full intake questionnaire before anything else on the client
    // side. Skip the check entirely on the destination page itself, or a
    // redirect loop follows.
    if (role === "lead" && path.startsWith("/lead") && path !== "/lead/profile") {
      const { data: lead } = await supabase
        .from("leads")
        .select("id, profile_completed_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (lead && !lead.profile_completed_at) {
        const url = request.nextUrl.clone();
        url.pathname = "/lead/profile";
        return NextResponse.redirect(url);
      }

      // Same reasoning as the client-side intake gate below: the free
      // assessment is meant to start from the pre-assessment questionnaire
      // already filled out, not something asked about after the fact.
      if (lead?.profile_completed_at && path !== "/lead/intake") {
        const { data: leadIntake } = await supabase
          .from("lead_intake")
          .select("submitted_at")
          .eq("lead_id", lead.id)
          .maybeSingle();
        if (!leadIntake?.submitted_at) {
          const url = request.nextUrl.clone();
          url.pathname = "/lead/intake";
          return NextResponse.redirect(url);
        }
      }
    }

    if (role === "client" && path.startsWith("/client")) {
      const { data: client } = await supabase
        .from("clients")
        .select("id, profile_completed_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (client && !client.profile_completed_at && path !== "/client/profile") {
        const url = request.nextUrl.clone();
        url.pathname = "/client/profile";
        return NextResponse.redirect(url);
      }

      if (
        client?.profile_completed_at &&
        path !== "/client/profile" &&
        path !== "/client/intake"
      ) {
        const { data: intake } = await supabase
          .from("client_intake")
          .select("submitted_at")
          .eq("client_id", client.id)
          .maybeSingle();
        if (!intake?.submitted_at) {
          const url = request.nextUrl.clone();
          url.pathname = "/client/intake";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return response;
}
