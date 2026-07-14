import { PrismaClient } from '@prisma/client'

/**
 * Cache-busting version key for the shared PrismaClient singleton.
 *
 * Next.js dev (Turbopack) keeps `globalThis` alive across HMR reloads, so a
 * naive `globalThis.prisma ?? new PrismaClient()` will keep reusing a client
 * that was constructed from a *previously* generated `@prisma/client` — even
 * after `prisma generate` regenerates the engine for a different datasource
 * provider (e.g. postgresql → sqlite).
 *
 * By keying the singleton with a version string, we can force a fresh
 * `PrismaClient` to be constructed whenever the schema/engine changes: just
 * bump `PRISMA_CLIENT_VERSION` and HMR will recreate the client in place.
 */
const PRISMA_CLIENT_VERSION = 'sqlite-1'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaVersion?: string
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

// Reuse the cached client ONLY when it was built with the current version.
// Otherwise discard the stale instance and build a fresh one.
export const db =
  globalForPrisma.prisma && globalForPrisma.prismaVersion === PRISMA_CLIENT_VERSION
    ? globalForPrisma.prisma
    : createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION
}
