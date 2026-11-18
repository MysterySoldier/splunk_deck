import { ALLOWED_AUTH_ORIGINS, corsHeaders, type PagesEnv } from "../_shared";

export const onRequestOptions = async ({ request }: { request: Request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin")),
  });
};

export const onRequestGet = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const googleClientId = (
    env.GOOGLE_CLIENT_ID ||
    env.VITE_GOOGLE_CLIENT_ID ||
    "878162796773-a8mdqnl3d5mco0dor0j1v93ftd9fjspi.apps.googleusercontent.com"
  ).trim();

  return new Response(
    JSON.stringify({
      ok: true,
      googleClientId,
      allowedOrigins: ALLOWED_AUTH_ORIGINS,
      cloudSyncEnabled: Boolean(env.DB),
    }),
    {
      status: 200,
      headers: corsHeaders(request.headers.get("Origin")),
    },
  );
};
