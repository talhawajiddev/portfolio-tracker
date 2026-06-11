import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
  const isAuthCallback = path.startsWith("/auth/callback");
  const isApi = path.startsWith("/api/");

  const env = getSupabaseEnv();
  if (!env) {
    if (isAuthPage || isAuthCallback || isApi) {
      return NextResponse.next({ request });
    }
    return new NextResponse(
      "Server misconfigured: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isAuthPage && !isAuthCallback && !isApi) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Session update failed:", error);
    if (isAuthPage || isAuthCallback || isApi) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}
