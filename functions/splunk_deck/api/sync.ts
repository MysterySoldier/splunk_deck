import {
  corsHeaders,
  ensureSplunkTable,
  type DbSplunkAccountRow,
  type PagesEnv,
} from "./_shared";

export const onRequestOptions = async ({ request }: { request: Request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin")),
  });
};

export const onRequestGet = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const headers = corsHeaders(request.headers.get("Origin"));
  const url = new URL(request.url);
  const googleId = (url.searchParams.get("googleId") || "").trim();

  if (!googleId) {
    return new Response(JSON.stringify({ ok: false, error: "Missing googleId" }), {
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
          displayName: "user",
          email: "",
          avatarUrl: "",
          mastery: { examMastered: {}, studyMastered: {}, updatedAt: 0 },
          updatedAt: 0,
        },
      }),
      { status: 200, headers },
    );
  }

  try {
    await ensureSplunkTable(env.DB);
    const row = await env.DB.prepare(
      "SELECT google_id, display_name, email, avatar_url, mastery_json, updated_at FROM splunk_deck_accounts WHERE google_id = ?",
    )
      .bind(googleId)
      .first<DbSplunkAccountRow>();

    if (!row) {
      return new Response(
        JSON.stringify({
          ok: true,
          account: {
            googleId,
            displayName: "user",
            email: "",
            avatarUrl: "",
            mastery: { examMastered: {}, studyMastered: {}, updatedAt: 0 },
            updatedAt: 0,
          },
        }),
        { status: 200, headers },
      );
    }

    let mastery = { examMastered: {}, studyMastered: {}, updatedAt: row.updated_at };
    try {
      mastery = JSON.parse(row.mastery_json);
    } catch {
      // ignore
    }

    return new Response(
      JSON.stringify({
        ok: true,
        account: {
          googleId: row.google_id,
          displayName: row.display_name,
          email: row.email,
          avatarUrl: row.avatar_url,
          mastery,
          updatedAt: row.updated_at,
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

export const onRequestPost = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const headers = corsHeaders(request.headers.get("Origin"));
  let body: {
    googleId?: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
    mastery?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
      status: 400,
      headers,
    });
  }

  const googleId = (body.googleId || "").trim().slice(0, 128);
  if (!googleId) {
    return new Response(JSON.stringify({ ok: false, error: "Missing googleId" }), {
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
          displayName: body.displayName || "user",
          email: body.email || "",
          avatarUrl: body.avatarUrl || "",
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

    const finalDisplayName = body.displayName || existing?.display_name || "user";
    const finalEmail = body.email || existing?.email || "";
    const finalAvatar = body.avatarUrl || existing?.avatar_url || "";
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
