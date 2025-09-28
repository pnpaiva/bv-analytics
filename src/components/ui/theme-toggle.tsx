import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenuItem 
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="font-body">
        {theme === "light" ? "Dark Mode" : "Light Mode"}
      </span>
    </DropdownMenuItem>
  )
}