"use client"

import * as React from "react"
import ReactDOM from "react-dom"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a Select')
  }
  return context
}

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

function Select({ value: controlledValue, onValueChange, disabled, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const setValue = onValueChange || setInternalValue

  return (
    <SelectContext.Provider value={{ value, onValueChange: setValue, open, setOpen, triggerRef }}>
      <div className={disabled ? "pointer-events-none opacity-50" : ""}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = useSelect()
  return <span className="line-clamp-1">{value || placeholder}</span>
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSelect()

  return (
    <button
      ref={(node) => {
        // Handle both refs
        triggerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      type="button"
      role="combobox"
      aria-expanded={open}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { position?: 'popper' | 'item-aligned' }
>(({ className, children, position = 'popper', ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSelect()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [contentPosition, setContentPosition] = React.useState({ top: 0, left: 0, width: 0 })

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setContentPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [open, triggerRef])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, setOpen, triggerRef])

  if (!open) return null

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(
        <div
          ref={contentRef}
          className={cn(
            "absolute z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-950 shadow-md animate-in fade-in-0 zoom-in-95",
            className
          )}
          style={{
            top: `${contentPosition.top + 4}px`,
            left: `${contentPosition.left}px`,
            width: position === 'popper' ? `${contentPosition.width}px` : 'auto'
          }}
          {...props}
        >
          <div className="p-1 overflow-y-auto max-h-96">
            {children}
          </div>
        </div>,
        document.body
      )
    : null
})
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value: itemValue, ...props }, ref) => {
  const { value, onValueChange, setOpen } = useSelect()
  const isSelected = value === itemValue

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-gray-100",
        className
      )}
      onClick={() => {
        onValueChange(itemValue)
        setOpen(false)
      }}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-100", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
