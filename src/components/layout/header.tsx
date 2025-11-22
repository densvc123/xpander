"use client"

import { Bell, Menu, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  title?: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {title && (
          <h1 className="text-lg font-semibold text-gray-900 md:text-xl">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search projects..."
            className="w-64 pl-9"
          />
        </div>

        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-5 w-5 text-gray-500" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500" />
        </Button>

        {/* User menu */}
        <Button variant="ghost" size="icon">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
            <User className="h-4 w-4 text-gray-600" />
          </div>
        </Button>
      </div>
    </header>
  )
}
