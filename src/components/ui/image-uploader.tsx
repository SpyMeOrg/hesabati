import { ChangeEvent, useState } from "react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  value?: string | null
  onChange: (value: string | null) => void
  onRemove: () => void
  className?: string
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
  className,
}: ImageUploaderProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      
      // تحويل الفاتورة إلى Base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        onChange(base64String)
        setIsLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading image:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("image-upload")?.click()}
          disabled={isLoading}
        >
          {isLoading ? "جاري التحميل..." : "اختر صورة"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="destructive"
            onClick={onRemove}
            disabled={isLoading}
          >
            حذف الفاتورة
          </Button>
        )}
      </div>

      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {value && (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border">
          <img
            src={value}
            alt="الفاتورة المحددة"
            className="h-full w-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
