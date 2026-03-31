import { Toaster as Sonner } from "sonner"

function Toaster(props) {
  return (
    <Sonner
      theme="light"
      richColors
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group border border-border bg-background text-foreground shadow-lg",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
