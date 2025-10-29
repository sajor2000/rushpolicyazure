"use client"

import {
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-rush-black group-[.toaster]:border-rush-gray/20 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-rush-black/70",
          actionButton:
            "group-[.toast]:bg-legacy group-[.toast]:text-white group-[.toast]:hover:bg-growth",
          cancelButton:
            "group-[.toast]:bg-sage group-[.toast]:text-legacy group-[.toast]:hover:bg-sage/80",
        },
      }}
      icons={{
        success: <CheckCircle2 className="size-4 text-growth" />,
        info: <Info className="size-4 text-sky-blue" />,
        warning: <AlertTriangle className="size-4 text-gold" />,
        error: <XCircle className="size-4 text-red-600" />,
        loading: <Loader2 className="size-4 animate-spin text-legacy" />,
      }}
      style={
        {
          "--normal-bg": "hsl(0 0% 100%)",
          "--normal-text": "hsl(0 0% 37%)",
          "--normal-border": "hsl(0 0% 69%)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
