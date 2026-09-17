import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="bg-white flex items-center justify-between">
      <div>
        <Heading level="h2" className="txt-xlarge">
          มีบัญชีอยู่แล้ว?
        </Heading>
        <Text className="txt-medium text-ui-fg-subtle mt-2">
          เข้าสู่ระบบเพื่อดูที่อยู่และคำสั่งซื้อเดิมได้สะดวกขึ้น
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10" data-testid="sign-in-button">
            เข้าสู่ระบบ
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
