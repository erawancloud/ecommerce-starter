import { proxy } from "@lib/proxy"

// Never cached, never prerendered: this is somebody's admin session.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const GET = proxy
export const HEAD = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
