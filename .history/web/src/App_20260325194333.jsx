import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"
export default function App() {
  return (
    <>
    <div className="px-3.5 py-4 max-w-[1280px] w-full ">
      <Button className={`w-[36px]`} variant={'outline'}>
        <MenuIcon />
      </Button>
    </div>
    </>
  )
}
