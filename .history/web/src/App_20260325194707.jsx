import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"
export default function App() {
  return (
    <>
    <div className="px-3 py-3 max-w-[1280px] w-full border-b border-b-[#0001]">
      <Button className={`w-[36px]`} variant={'ghost'}>
        <MenuIcon className="size-6.5" />
      </Button>
    </div>
    </>
  )
}
