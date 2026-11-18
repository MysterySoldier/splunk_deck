import {
  corsHeaders,
  ensureSplunkTable,
  type DbSplunkAccountRow,
  type PagesEnv,
} from "../_shared";

interface GoogleAuthRequestBody {
  credential?: string;
  accessToken?: string;
  googleId?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  mastery?: Record<string, unknown>;
}

export const onRequestOptions = async ({ request }: { request: Request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin")),
  });
};

export const onRequestPost = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const headers = corsHeaders(request.headers.get("Origin"));
  let body: GoogleAuthRequestBody;
  try {
    body = (await request.json()) as GoogleAuthRequestBody;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
      status: 400,
      headers,
    });
  }

  let googleId = "";
  let displayName = body.displayName || "user";
  let email = body.email || "";
  let avatarUrl = body.avatarUrl || "";

  // 1. Verify Google Identity Services ID token if provided
  if (typeof body.credential === "string" && body.credential.trim()) {
    try {
      const tokenRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential.trim())}`,
      );
      if (tokenRes.ok) {
        const tokenInfo = (await tokenRes.json()) as {
          sub?: string;
          name?: string;
          given_name?: string;
          family_name?: string;
          email?: string;
          picture?: string;
        };
        googleId = (tokenInfo.sub || "").trim();
        displayName = tokenInfo.name || tokenInfo.given_name || displayName;
        email = tokenInfo.email || email;
        avatarUrl = tokenInfo.picture || avatarUrl;
      }
    } catch {
      // Fallback
    }
  } else if (typeof body.googleId === "string" && body.googleId.trim()) {
    googleId = body.googleId.trim().slice(0, 128);
  }

  if (!googleId) {
    return new Response(JSON.stringify({ ok: false, error: "Missing googleId or valid credential" }), {
      status: 400,
      headers,
    });
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        ok: true,
        account: {
          googleId,
          displayName,
          email,
          avatarUrl,
          mastery: body.mastery || { examMastered: {}, studyMastered: {}, updatedAt: Date.now() },
          updatedAt: Date.now(),
        },
      }),
      { status: 200, headers },
    );
  }

  try {
    await ensureSplunkTable(env.DB);
    const existing = await env.DB.prepare(
      "SELECT google_id, display_name, email, avatar_url, mastery_json, updated_at FROM splunk_deck_accounts WHERE google_id = ?",
    )
      .bind(googleId)
      .first<DbSplunkAccountRow>();

    let existingMastery: Record<string, unknown> = { examMastered: {}, studyMastered: {} };
    if (existing?.mastery_json) {
      try {
        existingMastery = JSON.parse(existing.mastery_json);
      } catch {
        // ignore
      }
    }

    // Merge mastery
    const incomingMastery = body.mastery || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergedExam = { ...(existingMastery.examMastered as any), ...((incomingMastery as any).examMastered || {}) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergedStudy = { ...(existingMastery.studyMastered as any), ...((incomingMastery as any).studyMastered || {}) };
    const mergedMastery = {
      examMastered: mergedExam,
      studyMastered: mergedStudy,
      updatedAt: Date.now(),
    };

    const finalDisplayName = displayName || existing?.display_name || "user";
    const finalEmail = email || existing?.email || "";
    const finalAvatar = avatarUrl || existing?.avatar_url || "";
    const updatedAt = Date.now();

    await env.DB.prepare(
      `INSERT INTO splunk_deck_accounts (google_id, display_name, email, avatar_url, mastery_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(google_id) DO UPDATE SET
         display_name = excluded.display_name,
         email = excluded.email,
         avatar_url = excluded.avatar_url,
         mastery_json = excluded.mastery_json,
         updated_at = excluded.updated_at`,
    )
      .bind(
        googleId,
        finalDisplayName,
        finalEmail,
        finalAvatar,
        JSON.stringify(mergedMastery),
        updatedAt,
      )
      .run();

    return new Response(
      JSON.stringify({
        ok: true,
        account: {
          googleId,
          displayName: finalDisplayName,
          email: finalEmail,
          avatarUrl: finalAvatar,
          mastery: mergedMastery,
          updatedAt,
        },
      }),
      { status: 200, headers },
    );
  } catch (err: unknown) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers,
    });
  }
};
