/**
 * Two questions the shell cannot answer, asked of the database directly.
 *
 *   node erawan-boot.mjs wait     — block until Postgres accepts a connection
 *   node erawan-boot.mjs seeded   — exit 0 if this shop has already been seeded
 *
 * `seeded` reads **our own marker** (`store.metadata.erawan_seeded`, written
 * last by src/scripts/seed.ts) rather than asking whether a store row exists.
 * A store row exists from the first migration; a half-finished seed leaves one
 * behind with no region, no shipping option and no publishable key, and a
 * guard that asked "is there a store" would skip the retry for ever — the
 * failure shape CLAUDE.md's "a check that asks 'is there something'" section
 * is about.
 */
import pg from "pg"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set.")
  process.exit(2)
}

const connect = async () => {
  const client = new pg.Client({ connectionString: url, ssl: false })
  await client.connect()
  return client
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const wait = async () => {
  const deadline = Date.now() + 180_000
  let lastError
  while (Date.now() < deadline) {
    try {
      const client = await connect()
      await client.query("select 1")
      await client.end()
      return
    } catch (error) {
      lastError = error
      // kube-router programs a new pod's network rules shortly after it
      // starts, so the first attempts against a perfectly healthy database
      // come back "Connection refused" (CLAUDE.md, db_migrate).
      await sleep(2000)
    }
  }
  console.error(`Postgres did not answer in 180s: ${lastError}`)
  process.exit(1)
}

const seeded = async () => {
  const client = await connect()
  try {
    const { rows } = await client.query(
      "select metadata from store order by created_at asc limit 1"
    )
    const marker = rows[0]?.metadata?.erawan_seeded
    process.exit(marker ? 0 : 1)
  } catch {
    // No store table yet means nothing has been seeded, which is not an error.
    process.exit(1)
  } finally {
    await client.end().catch(() => {})
  }
}

const command = process.argv[2]
if (command === "wait") await wait()
else if (command === "seeded") await seeded()
else {
  console.error(`Unknown command: ${command}`)
  process.exit(2)
}
