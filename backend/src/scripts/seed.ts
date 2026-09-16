import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { DEFAULT_BRAND } from "../lib/brand"

/**
 * A Thai shop on its first boot: baht, one country, three ways to be paid,
 * three ways to be delivered, and four products somebody can actually press.
 *
 * **Run once, by `erawan-entrypoint.sh`, and guarded by a marker we write
 * ourselves** (`store.metadata.erawan_seeded`). The guard is deliberately not
 * "are there any regions" — that question answers yes for ever after the first
 * half-finished run, which is exactly the shape CLAUDE.md's "a check that asks
 * 'is there something'" section is about. This marker is written *last*, so a
 * run that dies half way is retried on the next boot rather than skipped.
 */
export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  const [store] = await storeModuleService.listStores()

  logger.info("ตั้งค่าร้าน / seeding store…")
  // **The one Medusa already made, not a new one.** A fresh install bootstraps
  // a "Default Sales Channel" *and* a publishable key linked to it. Creating a
  // second channel and linking the same key to that as well gives the key two
  // channels — and the Store API then refuses every product list with
  // "Inventory availability cannot be calculated in the given context", which
  // reads like a stock problem and is not one. Read the stored value
  // (CLAUDE.md, "If it was stored when it was created…").
  let [salesChannel] = await salesChannelModuleService.listSalesChannels(
    {},
    { order: { created_at: "ASC" }, take: 1 }
  )
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "หน้าร้านออนไลน์" }] },
    })
    salesChannel = result[0]
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        // Baht only. A second currency is a decision a shop makes when it
        // starts shipping abroad, and adding one here would put a currency
        // switcher in front of every customer who will never use it.
        supported_currencies: [{ currency_code: "thb", is_default: true }],
        default_sales_channel_id: salesChannel.id,
      },
    },
  })

  logger.info("เขตการขาย / seeding region…")
  const { result: regions } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "ไทย",
          currency_code: "thb",
          countries: ["th"],
          // The three from src/modules/thai-payments, in the order a Thai
          // shopper expects to see them. `th` is the module id set in
          // medusa-config.ts — change it there and these change with it.
          payment_providers: [
            "pp_promptpay_th",
            "pp_banktransfer_th",
            "pp_cod_th",
          ],
        },
      ],
    },
  })
  const region = regions[0]

  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "th", provider_id: "tp_system" }],
  })

  logger.info("คลังสินค้า / seeding stock location…")
  const { result: locations } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        { name: "หน้าร้าน", address: { city: "กรุงเทพมหานคร", country_code: "TH", address_1: "" } },
      ],
    },
  })
  const stockLocation = locations[0]

  await updateStoresWorkflow(container).run({
    input: { selector: { id: store.id }, update: { default_location_id: stockLocation.id } },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  let [shippingProfile] = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "ค่าส่งมาตรฐาน", type: "default" }] },
    })
    shippingProfile = result[0]
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "จัดส่งในประเทศไทย",
    type: "shipping",
    service_zones: [
      { name: "ทั่วประเทศ", geo_zones: [{ country_code: "th", type: "country" }] },
    ],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  const rules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]
  const shippingOption = (
    name: string,
    label: string,
    description: string,
    code: string,
    amount: number
  ) => ({
    name,
    price_type: "flat" as const,
    provider_id: "manual_manual",
    service_zone_id: fulfillmentSet.service_zones[0].id,
    shipping_profile_id: shippingProfile.id,
    type: { label, description, code },
    // Both a plain currency price and a region price: the currency one is what
    // a cart with no region resolved falls back to, and losing it is a
    // checkout that shows no delivery option at all.
    prices: [
      { currency_code: "thb", amount },
      { region_id: region.id, amount },
    ],
    rules,
  })

  await createShippingOptionsWorkflow(container).run({
    input: [
      shippingOption("ส่งธรรมดา", "ธรรมดา", "ถึงภายใน 2–4 วันทำการ", "standard", 50),
      shippingOption("ส่งด่วน", "ด่วน", "ถึงภายใน 1–2 วันทำการ", "express", 90),
      shippingOption("รับที่ร้าน", "รับเอง", "นัดรับที่ร้าน ไม่มีค่าส่ง", "pickup", 0),
    ],
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [salesChannel.id] },
  })

  logger.info("คีย์หน้าร้าน / seeding publishable key…")
  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "sales_channels.id"],
    filters: { type: "publishable" },
  })
  let publishableKey = existingKeys?.[0]
  if (!publishableKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{ title: "หน้าร้าน", type: "publishable", created_by: "seed" }],
      },
    })
    publishableKey = result[0] as any
  }
  // Exactly one channel on the key, stated rather than added to. The Store API
  // cannot resolve inventory for a key that names two, and the failure arrives
  // as a 400 on every product list rather than anywhere near this line.
  const linked: string[] = (publishableKey.sales_channels ?? []).map(
    (c: any) => c.id
  )
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableKey.id,
      add: linked.includes(salesChannel.id) ? [] : [salesChannel.id],
      remove: linked.filter((id) => id !== salesChannel.id),
    },
  })

  logger.info("สินค้าตัวอย่าง / seeding sample products…")
  const { result: categories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "สินค้าขายดี", is_active: true },
        { name: "ของฝาก", is_active: true },
        { name: "ของใช้ในบ้าน", is_active: true },
      ],
    },
  })
  const category = (name: string) => categories.find((c) => c.name === name)!.id

  // A collection as well as categories, because the home page's shelf is fed
  // by collections: a shop seeded with categories only has a home page with a
  // hero and nothing under it, which is the first thing anybody sees.
  const { result: collections } = await createCollectionsWorkflow(container).run({
    input: { collections: [{ title: "สินค้าแนะนำ", handle: "featured" }] },
  })
  const featured = collections[0].id

  const salesChannels = [{ id: salesChannel.id }]
  const simple = (
    title: string,
    handle: string,
    description: string,
    image: string,
    categoryName: string,
    price: number,
    sku: string
  ) => ({
    title,
    handle,
    description,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfile.id,
    category_ids: [category(categoryName)],
    collection_id: featured,
    // Served by the storefront out of its own `public/`, so the demo begins
    // with an art-directed sample shelf before an owner has uploaded photos.
    // These are small local WebPs, never a third-party image host.
    images: [{ url: image }],
    thumbnail: image,
    options: [{ title: "แบบ", values: ["มาตรฐาน"] }],
    variants: [
      {
        title: "มาตรฐาน",
        sku,
        options: { แบบ: "มาตรฐาน" },
        prices: [{ amount: price, currency_code: "thb" }],
      },
    ],
    sales_channels: salesChannels,
  })

  await createProductsWorkflow(container).run({
    input: {
      products: [
        simple(
          "กาแฟดริปคั่วกลาง 200 กรัม",
          "drip-coffee-200g",
          "เมล็ดอาราบิก้าจากดอยช้าง คั่วกลาง บดสดทุกสัปดาห์ ชงง่ายด้วยดริปเปอร์ที่บ้าน",
          "/demo/krua-khunyai/coffee.webp",
          "สินค้าขายดี",
          320,
          "COFFEE-200"
        ),
        simple(
          "น้ำพริกเผาสูตรคุณยาย",
          "chilli-paste",
          "สูตรดั้งเดิม ไม่ใส่วัตถุกันเสีย ขวดแก้ว 200 กรัม ส่งได้ทั่วประเทศ",
          "/demo/krua-khunyai/chilli-paste.webp",
          "ของฝาก",
          150,
          "CHILLI-200"
        ),
        simple(
          "ผ้าขาวม้าทอมือ",
          "handwoven-cloth",
          "ทอมือจากฝ้ายแท้ ลายดั้งเดิม ขนาด 90 x 180 ซม. ซักได้ ยิ่งใช้ยิ่งนุ่ม",
          "/demo/krua-khunyai/pha-khao-ma.webp",
          "ของฝาก",
          450,
          "CLOTH-01"
        ),
        simple(
          "สบู่สมุนไพร 3 ก้อน",
          "herbal-soap-3",
          "ขมิ้นชัน ว่านหางจระเข้ และมะขาม ก้อนละ 100 กรัม ทำมือทีละรอบเล็ก",
          "/demo/krua-khunyai/herbal-soap.webp",
          "ของใช้ในบ้าน",
          199,
          "SOAP-3"
        ),
      ],
    },
  })

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })
  const inventoryLevels: CreateInventoryLevelInput[] = inventoryItems.map(
    (item) => ({
      location_id: stockLocation.id,
      stocked_quantity: 100,
      inventory_item_id: item.id,
    })
  )
  if (inventoryLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: inventoryLevels },
    })
  }

  // Last, and only now: the brand the storefront reads, and the marker that
  // says this finished. Written together so a shop can never be marked seeded
  // without the brand the storefront needs to render anything at all.
  await storeModuleService.updateStores(store.id, {
    name: DEFAULT_BRAND.shop_name.th,
    metadata: {
      ...(store.metadata ?? {}),
      brand: DEFAULT_BRAND,
      erawan_seeded: new Date().toISOString(),
    },
  })

  logger.info("เสร็จแล้ว / seed finished.")
}
