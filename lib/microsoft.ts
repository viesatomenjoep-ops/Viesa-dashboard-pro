import "server-only";
import {
  ConfidentialClientApplication,
  type ICachePlugin,
  type TokenCacheContext,
} from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import { createClient } from "@/lib/supabase/server";
import { versleutel, ontsleutel } from "@/lib/crypto";

/** Graph-scopes (gedelegeerd). offline_access wordt door MSAL automatisch toegevoegd. */
export const MS_SCOPES = ["User.Read", "Mail.Send", "Mail.ReadWrite"];

export type MsConfig = {
  clientId: string;
  tenantId: string;
  clientSecret: string;
  redirectUri: string;
};

export function msConfig(): MsConfig | null {
  const clientId = process.env.MS_CLIENT_ID;
  const tenantId = process.env.MS_TENANT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const redirectUri = process.env.MS_REDIRECT_URI;
  if (!clientId || !tenantId || !clientSecret || !redirectUri) return null;
  return { clientId, tenantId, clientSecret, redirectUri };
}

/** Maakt een MSAL-app met een in-memory cache die uit `startCache` wordt geladen. */
function maakApp(cfg: MsConfig, startCache = "") {
  let huidige = startCache;
  const cachePlugin: ICachePlugin = {
    async beforeCacheAccess(ctx: TokenCacheContext) {
      if (huidige) ctx.tokenCache.deserialize(huidige);
    },
    async afterCacheAccess(ctx: TokenCacheContext) {
      if (ctx.cacheHasChanged) huidige = ctx.tokenCache.serialize();
    },
  };
  const app = new ConfidentialClientApplication({
    auth: {
      clientId: cfg.clientId,
      authority: `https://login.microsoftonline.com/${cfg.tenantId}`,
      clientSecret: cfg.clientSecret,
    },
    cache: { cachePlugin },
  });
  return { app, getCache: () => huidige };
}

/** URL naar het Microsoft-consentscherm. */
export async function authUrl(cfg: MsConfig, state: string): Promise<string> {
  const { app } = maakApp(cfg);
  return app.getAuthCodeUrl({
    scopes: MS_SCOPES,
    redirectUri: cfg.redirectUri,
    state,
    prompt: "select_account",
  });
}

/** Wisselt de code in voor tokens en bewaart de versleutelde cache in ms_tokens. */
export async function bewaarUitCode(cfg: MsConfig, code: string): Promise<void> {
  const { app, getCache } = maakApp(cfg);
  const res = await app.acquireTokenByCode({
    code,
    scopes: MS_SCOPES,
    redirectUri: cfg.redirectUri,
  });

  const supabase = createClient();
  await supabase.from("ms_tokens").upsert(
    {
      token_cache: versleutel(getCache()),
      account: {
        naam: res.account?.name ?? null,
        email: res.account?.username ?? null,
      },
      expires_at: res.expiresOn ? res.expiresOn.toISOString() : null,
    },
    { onConflict: "owner_id" },
  );
}

/** Verbindingsstatus voor de koppelingenpagina. */
export async function outlookStatus(): Promise<{ verbonden: boolean; email?: string }> {
  const supabase = createClient();
  const { data } = await supabase.from("ms_tokens").select("account").maybeSingle();
  if (!data) return { verbonden: false };
  const account = (data.account ?? {}) as { email?: string };
  return { verbonden: true, email: account.email };
}

export async function outlookOntkoppel(): Promise<void> {
  const supabase = createClient();
  await supabase.from("ms_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

/**
 * Geeft een geauthenticeerde Microsoft Graph-client voor de ingelogde gebruiker.
 * Ververst het token automatisch via het refresh-token (MSAL acquireTokenSilent)
 * en slaat de bijgewerkte cache versleuteld terug op. Geeft null als er geen
 * koppeling is of de config ontbreekt.
 */
export async function getGraphClient(): Promise<Client | null> {
  const cfg = msConfig();
  if (!cfg) return null;

  const supabase = createClient();
  const { data } = await supabase.from("ms_tokens").select("token_cache").maybeSingle();
  if (!data?.token_cache) return null;

  const { app, getCache } = maakApp(cfg, ontsleutel(data.token_cache));
  const accounts = await app.getTokenCache().getAllAccounts();
  if (accounts.length === 0) return null;

  const res = await app.acquireTokenSilent({ account: accounts[0], scopes: MS_SCOPES });

  // Bijgewerkte cache (mogelijk ververst) terugschrijven.
  await supabase
    .from("ms_tokens")
    .update({
      token_cache: versleutel(getCache()),
      expires_at: res.expiresOn ? res.expiresOn.toISOString() : null,
    })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const token = res.accessToken;
  return Client.init({
    authProvider: (done) => done(null, token),
  });
}
