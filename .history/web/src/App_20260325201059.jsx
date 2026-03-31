import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"
import React from "react"
export default function App() {
  const [tasks,setTasks] = React.useState(localStorage.getItem("tasks"));
  const [username,setUsername] = React.useState(localStorage.getItem("username"));
  return (
    <>
    <div className="px-3 py-3 max-w-[1280px] w-full border-b border-b-[#0001]">
      <Button className={`w-[36px]`} variant={'ghost'}>
        <MenuIcon className="size-6.5" />
      </Button>
    </div>
    {tasks??
    <div className="px-3 py-3 max-w-[1280px] w-full">
    <span className="text-[22px]">Assalomu alaykum {username==null?"Hojam":username}</span>  
    </div>}
    </>
  )
}
