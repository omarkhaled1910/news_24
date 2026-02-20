'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { useRouter } from 'next/navigation'
import { Search as SearchIcon } from 'lucide-react'

export const Search: React.FC<{
  locale?: string
  defaultValue?: string
}> = ({ locale = 'en', defaultValue = '' }) => {
  const [value, setValue] = useState(defaultValue)
  const router = useRouter()

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    router.push(`/search${debouncedValue ? `?q=${debouncedValue}` : ''}`)
  }, [debouncedValue, router])

  const placeholder = locale === 'ar' ? 'ابحث عن المقالات...' : 'Search articles...'

  return (
    <div className="relative">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Input
          id="search"
          type="search"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          value={value}
          placeholder={placeholder}
          className="pl-12 h-12 text-base bg-card border-border"
        />
        <button type="submit" className="sr-only">
          submit
        </button>
      </form>
    </div>
  )
}
