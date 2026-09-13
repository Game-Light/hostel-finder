'use client'

import { useState, useRef, useEffect } from 'react'
import { NIGERIAN_UNIVERSITIES } from '@/lib/nigerianUniversities'

interface Props {
  value: string
  onChange: (v: string) => void
  required?: boolean
}

export default function SchoolSelect({ value, onChange, required }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen]   = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep the input text in sync if the parent resets value externally
  useEffect(() => setQuery(value), [value])

  // Close the dropdown on outside click
  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const filtered = query.trim()
    ? NIGERIAN_UNIVERSITIES.filter(u => u.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : NIGERIAN_UNIVERSITIES.slice(0, 8)

  const handleSelect = (school: string) => {
    onChange(school)
    setQuery(school)
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search for your school..."
        required={required}
        autoComplete="off"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
        style={{ borderColor: '#E8EDEB', backgroundColor: '#FFFFFF', color: '#0A2A23' }}
        onFocusCapture={e => (e.target as HTMLInputElement).style.borderColor = '#034338'}
        onBlurCapture={e => (e.target as HTMLInputElement).style.borderColor = '#E8EDEB'}
      />

      {open && (
        <div className="absolute z-20 top-full mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl shadow-xl border bg-white"
          style={{ borderColor: '#E8EDEB' }}>
          {filtered.length > 0 ? (
            filtered.map(school => (
              <button
                type="button"
                key={school}
                onClick={() => handleSelect(school)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ color: '#0A2A23' }}
              >
                {school}
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-xs font-medium" style={{ color: '#9CA3AF' }}>
              Not listed — keep typing your school name, it'll be saved as you've entered it.
            </p>
          )}
        </div>
      )}
    </div>
  )
}