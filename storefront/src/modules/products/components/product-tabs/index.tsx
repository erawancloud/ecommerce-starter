"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "รายละเอียดสินค้า",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "การจัดส่งและคืนสินค้า",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">วัสดุ / ส่วนประกอบ</span>
            <p>{product.material ? product.material : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">แหล่งผลิต</span>
            <p>{product.origin_country ? product.origin_country : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">ประเภท</span>
            <p>{product.type ? product.type.value : "-"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">น้ำหนัก</span>
            <p>{product.weight ? `${product.weight} g` : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">ขนาด</span>
            <p>
              {product.length && product.width && product.height
                ? `${product.length}L x ${product.width}W x ${product.height}H`
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">จัดส่งทั่วไทย</span>
            <p className="max-w-sm">
              ระยะเวลาและค่าจัดส่งจะแสดงตามที่ร้านกำหนดในขั้นตอนชำระเงิน
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">สินค้ามีปัญหา</span>
            <p className="max-w-sm">
              หากได้รับสินค้าไม่ตรงคำสั่งซื้อ กรุณาติดต่อร้านพร้อมรูปสินค้าและเลขคำสั่งซื้อ
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">การเปลี่ยนหรือคืนสินค้า</span>
            <p className="max-w-sm">
              เงื่อนไขขึ้นอยู่กับนโยบายของร้าน กรุณาติดต่อร้านก่อนส่งสินค้ากลับทุกครั้ง
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
