import type { Icon } from "@phosphor-icons/react"
import {
  HouseIcon,
  NotebookIcon,
  CalendarIcon,
  UsersThreeIcon,
  UserIcon,
} from "@phosphor-icons/react"

export type NavItem = {
  href: string
  label: string
  icon: Icon
  requiresAuth: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: HouseIcon, requiresAuth: true },
  { href: "/apuntes", label: "Mis apuntes", icon: NotebookIcon, requiresAuth: true },
  { href: "/calendario", label: "Calendario", icon: CalendarIcon, requiresAuth: true },
  { href: "/", label: "Comunidad", icon: UsersThreeIcon, requiresAuth: false },
  { href: "/perfil", label: "Perfil", icon: UserIcon, requiresAuth: true },
]
