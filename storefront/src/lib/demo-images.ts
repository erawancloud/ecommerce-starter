/**
 * The first public shop was seeded before it had real art direction, so its
 * rows still name the old lightweight SVG placeholders. Resolve only those
 * four exact sample paths at render time: a real merchant's upload or product
 * image is never rewritten, and the live demo improves without a data edit.
 */
const KRUAKHUNYAI_SAMPLE_IMAGES: Record<string, string> = {
  "/placeholder/coffee.svg": "/demo/krua-khunyai/coffee.webp",
  "/placeholder/jar.svg": "/demo/krua-khunyai/chilli-paste.webp",
  "/placeholder/cloth.svg": "/demo/krua-khunyai/pha-khao-ma.webp",
  "/placeholder/soap.svg": "/demo/krua-khunyai/herbal-soap.webp",
}

export const resolveDemoImage = (image?: string | null) =>
  image ? (KRUAKHUNYAI_SAMPLE_IMAGES[image] ?? image) : undefined
