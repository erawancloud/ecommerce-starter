# ร้านค้าออนไลน์ Medusa — a Thai shop that does its own branding

**สั้น ๆ:** ร้านค้าออนไลน์เต็มรูปแบบ (Medusa 2) พร้อมหน้าร้านสามธีม รับเงินด้วย
**พร้อมเพย์ / โอนธนาคาร / เก็บเงินปลายทาง** และหน้า **แบรนด์และธีม** ที่เจ้าของร้าน
แก้สี โลโก้ ฟอนต์ ข้อความ และแท็กการตลาดได้เอง โดยไม่ต้องเรียกโปรแกรมเมอร์และ
ไม่ต้องขึ้นระบบใหม่.

**In one line:** a real commerce backend with a themed Thai storefront, paid by
PromptPay rather than by a gateway, whose whole look and marketing tags are
editable by the shop owner from the admin dashboard.

> **สถานะ: ยังไม่ได้ walk บนโปรดักชัน (2026-09-14).**
> ทุกอย่างในนี้ถูกสร้าง รัน และวัดจริงบนเครื่อง (ดู *What was measured*) แต่ยังไม่ได้
> ขึ้นระบบจริงสักครั้ง — ฉะนั้นยังไม่ขึ้นชั้นวางบนหน้าแรก และ README ยังไม่มีบรรทัด
> *Walked on production*. การ walk เป็นการตัดสินใจของผู้ก่อตั้ง ไม่ใช่ของ session.
>
> **Status: not walked on production yet (2026-09-14).** Everything here was
> built, run and measured locally, but the shelf's claim is that we ran it
> *here* first — so this README carries no `Walked on production` line and the
> template is not on the landing rail until it does.

---

## ขึ้นระบบ / Deploy

**ไม่ต้องใช้ AI agent** — คำสั่งพวกนี้เป็นคำสั่งจริงที่คนหรือสคริปต์พิมพ์เอง
ทุกอย่างที่ต้องรู้ (พอร์ต healthcheck add-on หน่วยความจำที่วัดแล้ว และชื่อ secret
ที่ขาดไม่ได้) เขียนอยู่ใน `erawan.yaml` แล้ว ไม่มีโมเดลอยู่ในเส้นทางนี้
(PRODUCT.md §77).

```sh
NAME=myshop

# The four values it cannot start without. They are declared in erawan.yaml,
# so the deploy stops until each one is set on the app's own page — no secret
# passes through an agent (PRODUCT.md §65).
erawan secrets set $NAME JWT_SECRET="$(openssl rand -base64 32)"
erawan secrets set $NAME COOKIE_SECRET="$(openssl rand -base64 32)"
erawan secrets set $NAME BOOTSTRAP_SECRET="$(openssl rand -base64 32)"
erawan secrets set $NAME ADMIN_PASSWORD="$(openssl rand -base64 18)"

erawan deploy --app medusa --name $NAME \
  --env STORE_URL=https://$NAME.erawan.app \
  --env ADMIN_URL=https://$NAME-backend.erawan.app \
  --env ADMIN_EMAIL=you@example.com
```

**หรือขึ้นจาก GitHub โดยตรง** — ซอร์สชุดเดียวกัน ไบต์ต่อไบต์ เหมาะกับคนที่ fork
ไปแก้เองแล้ว:

```sh
erawan deploy https://github.com/erawancloud/ecommerce-starter --name $NAME \
  --ref v1.0.0 \
  --env STORE_URL=https://$NAME.erawan.app \
  --env ADMIN_EMAIL=you@example.com
```

**`--ref` ไม่ใช่ของประดับ**: ถ้าไม่ระบุจะได้ default branch ณ วินาทีนั้น ซึ่งแปลว่า
สองคนที่กดคำสั่งเดียวกันคนละวันอาจได้คนละร้าน. tag คือสิ่งที่ทำให้ deploy นี้
deterministic เท่ากับ `--app medusa` — และ tag ที่นี่ย้ายไม่ได้:
`infra/publish-starter.sh` ปฏิเสธที่จะ publish ทับ tag เดิม รุ่นใหม่คือเลขใหม่
(`v1.0.1`, `v1.1.0`) ไม่ใช่ `v1` ที่ขยับไปเรื่อย ๆ.

แล้วจะได้:

| ที่อยู่ | คืออะไร |
|---|---|
| `https://NAME.erawan.app` | หน้าร้าน ลูกค้าเข้าที่นี่ |
| `https://NAME-backend.erawan.app/app` | หลังร้าน (Medusa Admin) เข้าด้วย `ADMIN_EMAIL` + `ADMIN_PASSWORD` |
| `https://NAME-backend.erawan.app/app` → **แบรนด์และธีม** | สี โลโก้ ฟอนต์ ธีม พร้อมเพย์ โซเชียล SEO แท็กการตลาด |

**`ADMIN_PASSWORD` ต้องยาวอย่างน้อย 8 ตัว** — Medusa ปฏิเสธที่สั้นกว่านั้น และ
ข้อความที่ได้จะอยู่ในล็อกของ container ไม่ใช่ที่หน้าจอที่คุณกดขึ้นระบบ.

## สองชื่อ สองส่วน / Two hostnames, two components

แบบเดียวกับที่ Medusa รันทุกที่: backend หนึ่งโฮสต์ หน้าร้านอีกโฮสต์

```
   https://NAME.erawan.app              https://NAME-backend.erawan.app
             │                                        │
   ┌─────────▼─────────┐                    ┌─────────▼─────────┐
   │  web (storefront) │                    │      backend      │
   │  Next.js          │───── in-cluster ──▶│  /store  /admin   │
   │  public: true     │   ERAWAN_COMPONENT │  /auth   /app     │
   └───────────────────┘   _BACKEND_URL     │  /static          │
                                            │  + postgres, disk │
                                            └───────────────────┘
```

`subdomain: auto` คือสิ่งที่ทำให้ backend มีชื่อของตัวเองได้ — ชื่อถูก derive มาจาก
`{app}-{component}` ไม่ได้เขียนตายตัว ฉะนั้นชนกับบัญชีอื่นไม่ได้ (ISSUES #283).

**เวอร์ชันแรกของ template นี้มีโฮสต์เดียว** แล้วให้หน้าร้าน proxy `/app` `/admin`
`/auth` `/static` กลับไปหา backend ที่ไม่มี ingress — เพราะตอนนั้นเขียนชื่อตายตัวได้
อย่างเดียว และ template ที่เขียนชื่อตายตัวจะขึ้นระบบได้ครั้งเดียวในโลก. นั่นคือการ
**ดัด Medusa ให้เข้ากับช่องว่างของแพลตฟอร์ม** แทนที่จะปิดช่องว่างนั้น — proxy ถูกลบ
ทิ้งทั้งก้อนเมื่อ `subdomain: auto` มีแล้ว.

หน้าร้านยังคุยกับ backend ผ่านเครือข่ายภายในคลัสเตอร์ (`ERAWAN_COMPONENT_BACKEND_URL`)
ไม่ได้วิ่งออกไปทางโฮสต์สาธารณะ.

## รับเงินยังไง / How the shop is paid

สามทาง ไม่มีตัวกลาง ไม่มีค่าธรรมเนียม ไม่ต้องมีสัญญากับใคร:

- **พร้อมเพย์** — หน้าร้านสร้าง QR แบบ EMVCo เองจากเลขพร้อมเพย์ที่เจ้าของกรอก
  ในหลังร้าน (`storefront/src/lib/promptpay.ts`) QR นี้คือ *ข้อความ* ไม่ใช่ API
  เงินวิ่งตรงจากบัญชีลูกค้าไปบัญชีร้าน
- **โอนผ่านธนาคาร** — แสดงเลขบัญชีที่กรอกไว้ พร้อมยอดที่ต้องโอน
- **เก็บเงินปลายทาง**

**สิ่งที่มันไม่ทำ และเขียนไว้บนการ์ดด้วย: มันไม่ได้ตรวจสอบกับธนาคารว่าเงินเข้าแล้ว.**
ลูกค้าแนบสลิปที่หน้าคำสั่งซื้อ เจ้าของร้านเปิดดูแล้วกด *Capture* ในหลังร้าน — นั่นคือ
จังหวะที่ Medusa บันทึกว่าได้เงินแล้ว. API ตรวจสลิปของธนาคารขายให้นิติบุคคลที่
จดทะเบียน ซึ่งเป็นสิ่งที่ร้านหนึ่งอาจมี แต่ template ไม่มีสิทธิ์สมมติว่ามี.

## ธีมและแบรนด์ / Themes and brand

**ธีมคือแบบอักษร จังหวะ และพื้นผิว — ไม่ใช่โค้ดคนละชุด** (`storefront/src/styles/brand.css`):

| ธีม | เหมาะกับ | ต่างตรงไหน |
|---|---|---|
| `siam` | ของฝาก งานคราฟต์ อาหาร | หัวเรื่องฟอนต์มีเชิง แถบ hero สีแบรนด์ มุมมน |
| `market` | ของกินของใช้ ราคาถูก ขายเยอะ | แน่น ไม่มี hero สูง ราคาหนา มุมเหลี่ยม |
| `studio` | แฟชั่น เครื่องประดับ เซรามิก | โปร่ง หัวเรื่องตัวพิมพ์ใหญ่ เว้นวรรคกว้าง |

สีทั้งหกและฟอนต์เก็บอยู่ใน record ของร้านเอง ส่งออกมาเป็น CSS custom property
ตอน render ทุกครั้ง — เจ้าของกด *บันทึก* แล้วรีเฟรชหน้าร้าน เห็นผลทันที ไม่ต้อง
build ไม่ต้องขึ้นระบบใหม่. เพราะ storefront ทั้งตัววาดสีจากตัวแปรของ
`@medusajs/ui` การเปลี่ยนหกค่านี้ทาสีใหม่ทั้งปุ่ม เส้นขอบ ราคา และแผงทุกอัน.

**มุมมนเป็นของเจ้าของ ไม่ใช่ของธีม.** บล็อกธีมใน CSS คือ `html[data-theme="…"]`
ซึ่งชนะ `:root` ตามหลัก specificity ฉะนั้นธีมจึงจงใจไม่ประกาศ `--brand-radius`;
หน้า admin เติมค่าที่แนะนำให้ตอนสลับธีม แล้ว **ค่าที่ถูกเก็บคือค่าที่ถูกวาด**.

**แท็กการตลาด** — GA4, GTM, Meta Pixel, TikTok Pixel: กรอกเฉพาะ *รหัส* หน้าร้าน
ติดตั้งสคริปต์ให้เอง และรหัสถูกกรองด้วย `[A-Za-z0-9_-]` ที่ฝั่ง server ก่อนเก็บ
เพราะมันจะไปจบอยู่ใน `<script>` (`backend/src/lib/brand.ts`).

**ฟอนต์โหลดมาไว้ที่ตัวเอง** ตอน build ด้วย `next/font` — เบราว์เซอร์ของลูกค้า
ไม่ยิงไปหา Google เลย. ภาษาไทยใช้ Noto Sans Thai เสมอ ไม่ว่าเจ้าของจะเลือกฟอนต์
ละตินอันไหน เพราะฟอนต์ละตินส่วนใหญ่ไม่มีกลีฟไทยและจะกลายเป็นสี่เหลี่ยมทั้งหน้า.

## What was measured (2026-09-14, this laptop)

| | |
|---|---|
| backend image | **140MB compressed** (1.02GB uncompressed) |
| storefront image | **79MB compressed** (329MB uncompressed) |
| backend memory, idle after migrate + seed + serve | **263MiB** |
| storefront memory, idle | **140MiB** |
| computed minimum plan | **hobby** — `services._minimum_plan` agrees |

Hobby is the floor and the reason is the **component count, not the size**:
Free allows one always-on workload and this is two. Everything else clears
Free comfortably.

## สิ่งที่พังระหว่างทาง / What went wrong building this

Six of them, and each is a comment in the file it bit:

1. **`next.config.js` rewrites are frozen at build time.** The first version
   proxied `/app` and `/admin` to the backend with `rewrites()`. With
   `output: "standalone"` that table is serialised into the build, so the
   address baked in was the `localhost:9000` fallback — the admin dashboard
   answered 500 and nothing said why. It is a route handler now
   (`storefront/src/lib/proxy.ts`), resolved per request. Same shape as
   CLAUDE.md's *"if it was stored when it was created, do not work it out
   again"*, facing the other way.
2. **Medusa bootstraps its own sales channel *and* a publishable key linked to
   it.** The seed made a second channel and linked the same key to that as
   well; the Store API then refused every product list with *"Inventory
   availability cannot be calculated in the given context"*, which reads like
   a stock problem and is not one. The seed reads the channel that already
   exists.
3. **`generateStaticParams` cannot work here.** Upstream prerenders every
   product by calling the Store API at build time. Both components of an
   Erawan release are built *before* either runs, so the build died with
   ECONNREFUSED naming a page rather than a cause. Removed — and it was the
   wrong shape anyway for a catalogue that changes in the admin all day.
4. **`revalidate: 60` on the brand made the whole page cacheable.** The owner
   changed the theme, the API returned the new one, and the shop kept serving
   the old look out of Next's full route cache. The tell was that the same URL
   with a cache-busting query came back correct. The brand is `no-store` now:
   a brand that updates "eventually" is indistinguishable from a save that did
   not work, and the person watching is the one who just pressed it.
5. **`backend_url` for the file provider must be an absolute URL.** It was
   written as `/static` — relative, same origin, no hostname to know at build
   time — and `LocalFileService` builds every upload's URL with `new URL(...)`,
   so the first slip upload answered 500 with `Invalid URL` from inside the
   file module and nothing in the message about a path. It is
   `${STORE_URL}/static` now, which is why the entrypoint requires STORE_URL
   rather than defaulting it.
6. **The directory files are written to and the directory Medusa serves are
   two different settings.** `file-local` writes where `upload_dir` says — the
   Erawan disk — and `express-loader.js` serves `/static` from `<cwd>/static`.
   With the two disagreeing, an upload answers 200 with a URL and that URL
   404s for ever: a photo the owner watched appear in the admin and could
   never see on the shop. The entrypoint links them.

## ทำไมคีย์ publishable ถึงถามเอาตอนรัน / The publishable key

`NEXT_PUBLIC_*` ถูกฝังตอน `next build` แต่คีย์ถูกสร้างโดย seed ตอน backend บูต
ครั้งแรก และทั้งสอง component ถูก build ก่อนที่อันไหนจะได้รัน — คีย์ที่ฝังตอน build
จึงเป็นคีย์ของ deploy ก่อนหน้าเสมอ และในการ deploy ครั้งแรกคือไม่มีคีย์เลย.
หน้าร้านจึง **ถาม** backend ที่ `/internal/bootstrap` ตอนรัน โดยยื่น
`BOOTSTRAP_SECRET` (เส้นทางนี้ไม่มี ingress สาธารณะ แต่ยังตรวจ secret อยู่ดี
เพราะ "ไม่มีใครเข้าถึงได้" เป็นคำกล่าวเกี่ยวกับ deployment หนึ่ง ๆ ส่วนไฟล์นี้อยู่ต่อ
ไปอีกนาน). ดู `storefront/src/lib/erawan.ts`.

## PDPA

ร้านนี้เก็บข้อมูลส่วนบุคคลของลูกค้า — ชื่อ เบอร์โทร ที่อยู่ ประวัติการสั่งซื้อ และรูปสลิป.
ตาม PRODUCT.md §30 **เจ้าของร้านคือผู้ควบคุมข้อมูล Erawan เป็นผู้ประมวลผล**:
ข้อมูลเป็นของร้าน ไม่ใช่ของเรา และคำขอตาม PDPA มาถึงเจ้าของร้าน. Medusa Admin
มีหน้า Customers ที่ดูและลบรายคนได้ ซึ่งเป็นรูปแบบที่คำขอ PDPA มาถึงจริง ๆ.

**รูปสลิปเป็นภาพถ่ายหน้าจอแอปธนาคารของลูกค้า** เก็บอยู่บนดิสก์ของแอป
(`/data/static`) เข้าถึงได้จาก `/static/…` ซึ่งเป็น URL ที่เดาไม่ได้แต่ไม่ได้ล็อก —
เหมือนกับรูปสินค้า. ถ้าร้านต้องการมากกว่านั้น นั่นคืองานที่ยังไม่ได้ทำ (ดูด้านล่าง).

## ยังไม่ได้ทำ / Not built yet

เขียนไว้ตรงนี้แทนที่จะให้คนถัดไปค้นพบเอง:

- **walk บนโปรดักชันจริง** — ข้อแรกและสำคัญที่สุด
- **แจ้งเตือน LINE เมื่อมีออเดอร์ใหม่** — `LINE_CHANNEL_ACCESS_TOKEN` + subscriber
  ตัวเดียว; เป็นสิ่งที่ร้านไทยถามหาเป็นอันดับแรกหลังเปิดร้าน
- **อ่านสลิปอัตโนมัติ** (ยอด เวลา เลขอ้างอิง) — คือ preset ของ starter
  `read-docs` ใน `design/business-starters.md` §3 ไม่ใช่ของ template นี้
- **ใบกำกับภาษี PDF ภาษาไทย** และ **ใบปะหน้าพัสดุ**
- **ที่อยู่แบบไทย** (ตำบล/อำเภอ/จังหวัด) — ตอนนี้ใช้ฟอร์มที่อยู่มาตรฐานของ Medusa
- **Redis** — ตอนนี้ event bus, cache, locking และ session เป็น in-memory ทั้งหมด
  ซึ่งถูกต้องสำหรับ pod เดียว แต่ express session store รั่วช้า ๆ และ Medusa เตือน
  เรื่องนี้ในล็อกทุกครั้งที่บูต. Redis add-on มีตั้งแต่ Hobby ขึ้นไป
- **ภาพสินค้าไม่ผ่าน optimiser** (`images.unoptimized`) — จงใจ เพราะ sharp ใน
  container 640Mi ที่ย่อรูป 6MB จากมือถือคือ OOM ที่รอเกิด; ถ้าจะเปิดต้องวัดก่อน
- **อัปโหลดรูปสินค้าใหญ่ ๆ ผ่าน proxy** ยังไม่ได้ทดสอบกับไฟล์หลายสิบเมกะไบต์

## แก้ไขต่อเอง / Making it yours

Template deploy commit ต้นไม้ทั้งหมดเข้า git repo ของแอปเหมือน deploy ปกติ
ฉะนั้น `erawan pull` ได้โค้ดทั้งชุดมาแก้ แล้ว `erawan deploy` ด้วยชื่อเดิมเพื่อส่งขึ้น.
ธีมที่สี่คือไฟล์ CSS บล็อกเดียวใน `storefront/src/styles/brand.css` บวกชื่อใน
`THEME_IDS` ของ `backend/src/lib/brand.ts` — แล้ว **คัดลอกไฟล์นั้นไปทับ**
`storefront/src/lib/brand-contract.ts` ด้วย เพราะมันคือไฟล์เดียวกันที่อยู่สองที่
และ `test_the_medusa_brand_contract_is_one_file_in_two_places` เทียบไบต์ต่อไบต์.

## รันบนเครื่องตัวเอง / Running it locally

```sh
docker run -d --name medusa-pg -e POSTGRES_PASSWORD=medusa -e POSTGRES_USER=medusa \
  -e POSTGRES_DB=medusa -p 55432:5432 postgres:16-alpine

# The Dockerfiles build FROM our in-cluster mirror, which a laptop cannot
# reach. Swap the tag for the public one to build here:
sed -i '' 's#erawan-registry.erawan.svc.cluster.local:5000/mirror/node-alpine:22-alpine#node:22-alpine#' \
  backend/Dockerfile storefront/Dockerfile

docker build -t medusa-backend backend && docker build -t medusa-web storefront

docker run -d --name medusa-api -p 9000:9000 \
  -e DATABASE_URL='postgres://medusa:medusa@host.docker.internal:55432/medusa' \
  -e JWT_SECRET=dev -e COOKIE_SECRET=dev -e BOOTSTRAP_SECRET=dev \
  -e STORE_URL=http://localhost:8000 \
  -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD=supersecret1 \
  -e DATA_DIR=/data medusa-backend

docker run -d --name medusa-web -p 8000:8000 \
  -e MEDUSA_BACKEND_URL=http://host.docker.internal:9000 \
  -e BOOTSTRAP_SECRET=dev -e NEXT_PUBLIC_BASE_URL=http://localhost:8000 medusa-web
```

`git checkout backend/Dockerfile storefront/Dockerfile` เมื่อเสร็จ — wheel ที่
ชี้ไป Docker Hub คือ build ที่ช้ากว่าและใช้โควตา anonymous ที่ทั้งแพลตฟอร์มแชร์กัน.

## ซอร์สอยู่ที่ไหน / Where this lives

ต้นฉบับอยู่ใน monorepo ของ Erawan ที่ `app_templates/medusa` — เป็นสิ่งที่
`erawan deploy --app medusa` ใช้ และเป็นที่ที่ test รัน. repo สาธารณะ
**https://github.com/erawancloud/ecommerce-starter** ถูก publish ออกไปจากที่นั่น
ด้วย `infra/publish-starter.sh` ซึ่งบันทึก digest ของสิ่งที่ push จริงไว้ใน
`app_templates/published.json`; เทสต์ฝั่ง monorepo คำนวณ digest ใหม่จากต้นไม้แล้ว
เทียบ — **ไบต์ไม่ตรงเมื่อไหร่ เทสต์แดงทันที** ไม่ต้องต่อเน็ต ไม่ต้องใช้ token.

สองก๊อปปี้ของ starter จะ drift เสมอ และ drift นี้มองไม่เห็นจากทั้งสองฝั่ง —
เหมือนสองภาษาบนหน้า landing และเหมือนเหตุผลที่ `render.mjs` เทียบ path ของโลโก้
ก่อน render. ก๊อปปี้ทำได้ ก๊อปปี้ที่ไม่มีใครตรวจทำไม่ได้.

## ที่มา / Provenance

- Medusa **2.21.0** (npm `latest`, 2026-09-11), pinned exactly. Upstream's
  starters pin `2.18.0` on the server and `latest` on half the storefront's
  dependencies; `latest` in a lockfile-less dependency is a build that differs
  from the one somebody tested.
- `backend/` is `medusajs/medusa-starter-default` with the Thai seed, the
  payment module, the brand routes and the admin page added; `storefront/` is
  `medusajs/nextjs-starter-medusa` with Stripe removed, the theme system and
  the Thai copy added. Both converted from yarn to npm with a committed
  lockfile.
