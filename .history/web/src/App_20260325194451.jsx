import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"
export default function App() {
  return (
    <>
    <div className="px-3.5 py-3.5 max-w-[1280px] w-full border-b border-b-[#0001]">
      <Button className={`w-[36px]`} variant={'ghost'}>
        <MenuIcon className="size-6" />
      </Button>
    </div>
    </>
  )
}
