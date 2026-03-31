import { Button } from "@/components/ui/button"
import { MenuIcon, MoonIcon, SunIcon} from "lucide-react"
import React from "react"
export default function App() {
  const [tasks,setTasks] = React.useState(JSON.parse(localStorage.getItem("tasks")));
  const [username,setUsername] = React.useState(localStorage.getItem("username"));
  const [isLight,setIsLight] = React.useState(localStorage.getItem("theme")=="light");
  return (
    <>
    <div className="px-3 py-3 max-w-[1280px] w-full border-b border-b-[#eee] flex justify-between">
      <Button className={`w-[36px]`} variant={'ghost'}>
        <MenuIcon className="size-6.5" />
      </Button>
      <Button className={`w-[36px]`} variant={'ghost'}>
        {isLight?<SunIcon className="size-6.5" />:<MoonIcon className="size-6.5 rotate-270" />}
      </Button>
    </div>
    {(tasks==null||tasks.lenght==1)&&
    <div className="px-3 py-3 max-w-[1280px] w-full flex flex-col items-center my-6 text-center gap-2">
    <span className="text-[22px] leading-none">Assalomu alaykum <b className="font-[550]">
      {username==null?"Hojam":username}
    </b></span>
    <span className="leading-none">Hozircha topshiriqlar mavjud emas</span>  
    </div>}
    <div className="px-3 py-3 max-w-[1280px] w-full flex justify-center">
      
    </div>
    </>
  )
}
