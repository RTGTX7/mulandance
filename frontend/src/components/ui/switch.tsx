"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  const isChecked = props.checked === true

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full border-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-5 data-[size=sm]:w-9",
        isChecked ? "border-primary bg-primary" : "border-slate-300 bg-slate-200",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-sm transition-transform",
          size === "sm" ? "size-3.5" : "size-4",
          isChecked
            ? size === "sm"
              ? "translate-x-4"
              : "translate-x-5"
            : "translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
