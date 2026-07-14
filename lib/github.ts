import "server-only";

/**
 * Minimale GitHub Contents-API helper voor de design-editor.
 * De gedeployde app gebruikt een eigen PAT met `contents:write` (env GITHUB_TOKEN).
 */

const API = "https://api.github.com";

export type GithubConfig = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
};

export type GithubFile = {
  naam: string;
  pad: string;
  sha: string;
};

/** Leest de config uit env; geeft null als GitHub-sync niet is ingesteld. */
export function githubConfig(): GithubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/repo"
  if (!token || !repo || !repo.includes("/")) return null;
  const [owner, naam] = repo.split("/");
  return {
    owner,
    repo: naam,
    branch: process.env.GITHUB_BRANCH || "main",
    token,
  };
}

function headers(cfg: GithubConfig) {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** Lijst de markdown-bestanden in een map. */
export async function lijstMap(
  cfg: GithubConfig,
  pad: string,
): Promise<GithubFile[]> {
  const res = await fetch(
    `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${pad}?ref=${cfg.branch}`,
    { headers: headers(cfg), cache: "no-store" },
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}: map lezen mislukt`);
  const data = (await res.json()) as {
    name: string;
    path: string;
    sha: string;
    type: string;
  }[];
  return data
    .filter((f) => f.type === "file" && f.name.endsWith(".md"))
    .map((f) => ({ naam: f.name, pad: f.path, sha: f.sha }));
}

/** Leest één bestand; geeft inhoud (utf8) en sha terug. */
export async function leesBestand(
  cfg: GithubConfig,
  pad: string,
): Promise<{ inhoud: string; sha: string }> {
  const res = await fetch(
    `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${pad}?ref=${cfg.branch}`,
    { headers: headers(cfg), cache: "no-store" },
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}: bestand lezen mislukt`);
  const data = (await res.json()) as { content: string; sha: string };
  const inhoud = Buffer.from(data.content, "base64").toString("utf8");
  return { inhoud, sha: data.sha };
}

/** Schrijft een bestand terug (commit). Vereist de huidige sha. */
export async function schrijfBestand(
  cfg: GithubConfig,
  pad: string,
  inhoud: string,
  sha: string,
  bericht: string,
): Promise<{ sha: string }> {
  const res = await fetch(
    `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${pad}`,
    {
      method: "PUT",
      headers: headers(cfg),
      body: JSON.stringify({
        message: bericht,
        content: Buffer.from(inhoud, "utf8").toString("base64"),
        sha,
        branch: cfg.branch,
      }),
    },
  );
  if (!res.ok) {
    const tekst = await res.text();
    throw new Error(`GitHub ${res.status}: opslaan mislukt — ${tekst}`);
  }
  const data = (await res.json()) as { content: { sha: string } };
  return { sha: data.content.sha };
}
