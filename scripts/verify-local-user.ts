import { readLocalDevToken } from "./local-dev-token";
import { getDatabase } from "../server/database";

const LOCAL_VERIFY_PATH = "/api/v1/dev/local-verify-user";

function isLocalOrigin(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

async function verifyThroughLiveApi(email: string, apiBase: string) {
  const localDevToken=await readLocalDevToken();
  const response = await fetch(`${apiBase.replace(/\/$/, "")}${LOCAL_VERIFY_PATH}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-yaposan-local-dev": localDevToken,
    },
    body: JSON.stringify({ email }),
  });

  let payload: any = {};
  try { payload = await response.json(); } catch {}
  if (!response.ok) {
    throw new Error(String(payload?.error?.message ?? `Local verification API returned HTTP ${response.status}`));
  }
  console.log("Yaposan local customer email verified through the running API.");
  console.log(`Email: ${email}`);
  console.log(`Invalidated pending verification tokens: ${Number(payload.invalidatedVerificationTokens ?? 0)}`);
  console.log("You can now sign in to the local Yaposan web app without restarting the API.");
}

async function verifyThroughPersistentDatabase(email: string) {
  const db = await getDatabase();
  try {
    const matches = await db.find("users", (u) => u.email.trim().toLowerCase() === email);
    if (matches.length !== 1) {
      throw new Error(matches.length === 0
        ? `No Yaposan customer account found for ${email}.`
        : `Refusing to continue: multiple users matched ${email}.`);
    }
    const user = matches[0];
    if ((user.identityProvider ?? "local") !== "local") {
      throw new Error("This command is only for local-password customer accounts.");
    }
    const now = new Date().toISOString();
    const pending = await db.find("authTokens", (t) =>
      t.subjectType === "user" && t.subjectId === user.id &&
      t.purpose === "email_verification" && !t.usedAt
    );
    for (const token of pending) await db.update("authTokens", token.id, { usedAt: now });
    if (!user.emailVerified || !user.emailVerifiedAt) {
      await db.update("users", user.id, { emailVerified: true, emailVerifiedAt: user.emailVerifiedAt ?? now });
    }
    await db.insert("auditEvents", {
      actorUserId: user.id,
      action: "user.email.verified_local_development",
      target: user.id,
      metadata: { method: "local_cli", invalidatedVerificationTokens: pending.length },
    });
    console.log("Yaposan local customer email verified.");
    console.log(`Email: ${email}`);
    console.log(`Invalidated pending verification tokens: ${pending.length}`);
    console.log("You can now restart/sign in to the local Yaposan web app.");
  } finally {
    await db.close();
  }
}

async function main() {
  const email = String(process.argv[2] ?? "").trim().toLowerCase();
  const nodeEnv = String(process.env.NODE_ENV ?? "development").trim().toLowerCase();
  const publicOrigin = String(process.env.PUBLIC_WEB_URL ?? process.env.PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:8081");
  const apiBase = String(process.env.EXPO_PUBLIC_API_URL ?? process.env.PUBLIC_API_URL ?? "http://localhost:4100");

  if (nodeEnv === "production") {
    console.error("Refusing to verify a user locally while NODE_ENV=production.");
    process.exitCode = 2;
    return;
  }
  if (!isLocalOrigin(publicOrigin) || !isLocalOrigin(apiBase)) {
    console.error(`Refusing to run local verification because the configured web/API origin is not local: ${publicOrigin} / ${apiBase}`);
    process.exitCode = 2;
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error("Usage: npm run user:verify -- user@example.com");
    process.exitCode = 2;
    return;
  }

  if (!String(process.env.DATABASE_URL ?? "").trim()) {
    try {
      await verifyThroughLiveApi(email, apiBase);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      console.error(`Make sure \"npm run web\" is running at ${apiBase}; the local verification bridge uses the live API so it can coordinate safely with the local database.`);
      process.exitCode = 1;
    }
    return;
  }

  await verifyThroughPersistentDatabase(email);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
