import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"
export default function App() {
  return (
    <>
    <div className="px-4 py-3 max-w-[1280px] w-full">
      <Button className={`px-[12px] rounded-full`} variant={'outline'}>
        <MenuIcon />
      </Button>
    </div>
    </>
  )
}
