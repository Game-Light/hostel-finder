'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

const FACILITIES = [
  'Running water', '24hr electricity', 'Prepaid meter',
  'Security', 'Parking', 'Wi-Fi', 'Fence/gate', 'Borehole',
]

const ROOM_TYPES = [
  { value: 'self_contain', label: 'Self-contain' },
  { value: 'single',       label: 'Single Room' },
  { value: 'shared',       label: 'Shared Room' },
  { value: 'mini_flat',    label: 'Mini Flat' },
]

const DISTANCE_OPTIONS = [
  'Walking distance',
  '5 mins walk',
  '10 mins walk',
  '15+ mins walk',
]

const FUOYE_AREAS = [
  'Oye Town', 'School Road', 'Behind Campus',
  'Ikole Road', 'New Site', 'Other',
]

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

export default function NewListingPage() {
  const router = useRouter()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Auth check
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentPhone, setAgentPhone] = useState('')

  // Form fields
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice]             = useState('')
  const [roomType, setRoomType]       = useState('self_contain')
  const [rooms, setRooms]             = useState('1')
  const [area, setArea]               = useState('Oye Town')
  const [customArea, setCustomArea]   = useState('')
  const [distance, setDistance]       = useState('5 mins walk')
  const [facilities, setFacilities]   = useState<string[]>([])
  const [whatsapp, setWhatsapp]       = useState('')

  // Media
  const [photos, setPhotos]           = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [video, setVideo]             = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  // State
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('role, phone')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'agent') { router.push('/listings'); return }

      setAgentId(user.id)
      setWhatsapp(profile?.phone || '')
    }
    init()
  }, [router])

  // Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 6 - photos.length
    const toAdd = files.slice(0, remaining)

    const newPhotos = [...photos, ...toAdd]
    setPhotos(newPhotos)

    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        setPhotoPreviews(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })

    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Video selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideo(file)
    setVideoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const removeVideo = () => {
    setVideo(null)
    setVideoPreview(null)
  }

  // Facilities toggle
  const toggleFacility = (f: string) => {
    setFacilities(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (photos.length === 0) {
      setError('Please upload at least one photo of the hostel.')
      return
    }

    if (!agentId) return

    setLoading(true)

    try {
      const slug = generateSlug(name)
      const finalArea = area === 'Other' ? customArea : area

      // 1. Upload photos
      setUploadProgress('Uploading photos...')
      const photoUrls: string[] = []

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split('.').pop()
        const path = `${agentId}/${slug}/photo-${i + 1}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, file, { upsert: true })

        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(path)

        photoUrls.push(publicUrl)
      }

      // 2. Upload video (if any)
      let videoUrl: string | null = null

      if (video) {
        setUploadProgress('Uploading video...')
        const ext = video.name.split('.').pop()
        const path = `${agentId}/${slug}/video.${ext}`

        const { error: videoError } = await supabase.storage
          .from('listing-videos')
          .upload(path, video, { upsert: true })

        if (videoError) throw new Error(`Video upload failed: ${videoError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('listing-videos')
          .getPublicUrl(path)

        videoUrl = publicUrl
      }

      // 3. Insert listing
      setUploadProgress('Saving listing...')

      const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert({
          agent_id:        agentId,
          name,
          description,
          price:           parseInt(price),
          room_type:       roomType,
          rooms_available: parseInt(rooms),
          area:            finalArea,
          distance_tag:    distance,
          facilities,
          whatsapp_number: whatsapp,
          video_url:       videoUrl,
          status:          'pending',
          slug,
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      // 4. Insert photos
      const photoRecords = photoUrls.map((url, i) => ({
        listing_id: listing.id,
        photo_url:  url,
        is_cover:   i === 0,
        sort_order: i,
      }))

      await supabase.from('listing_photos').insert(photoRecords)

      router.push('/agent/dashboard?created=true')

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />

      {/* Page header */}
      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-semibold mb-4 hover:underline"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Add new listing</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Fill in your hostel details. Your listing will be reviewed before going live.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          {/* ── Section 1: Basic info ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-5" style={{ color: '#0A2A23' }}>Basic information</h2>

            <div className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                  Hostel name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sunview Hostel"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                  Description <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the hostel — location highlights, room details, what makes it good for students..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors resize-none"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                />
              </div>

              {/* Price + Room type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                    Price per room / year (₦) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="e.g. 120000"
                    required
                    min={1000}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                    style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                    onFocus={e => e.target.style.borderColor = '#034338'}
                    onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                    Room type <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={roomType}
                    onChange={e => setRoomType(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors cursor-pointer"
                    style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                    onFocus={e => e.target.style.borderColor = '#034338'}
                    onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                  >
                    {ROOM_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rooms available */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                  Rooms currently available <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  value={rooms}
                  onChange={e => setRooms(e.target.value)}
                  min={0}
                  max={100}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                />
                <p className="text-xs font-medium mt-1" style={{ color: '#4B6B62' }}>
                  Set to 0 to mark the hostel as fully occupied (no vacancy).
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 2: Location ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-5" style={{ color: '#0A2A23' }}>Location</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                  Area / Street <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors cursor-pointer"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                >
                  {FUOYE_AREAS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {area === 'Other' && (
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                    Specify area <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={customArea}
                    onChange={e => setCustomArea(e.target.value)}
                    placeholder="Enter the street or area name"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                    style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                    onFocus={e => e.target.style.borderColor = '#034338'}
                    onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                  Distance from FUOYE main gate <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors cursor-pointer"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                >
                  {DISTANCE_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Section 3: Facilities ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-2" style={{ color: '#0A2A23' }}>Facilities</h2>
            <p className="text-xs font-medium mb-4" style={{ color: '#4B6B62' }}>Select all that apply</p>

            <div className="grid grid-cols-2 gap-2">
              {FACILITIES.map(f => (
                <button
                  type="button"
                  key={f}
                  onClick={() => toggleFacility(f)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border"
                  style={{
                    borderColor: facilities.includes(f) ? '#034338' : '#E8EDEB',
                    backgroundColor: facilities.includes(f) ? '#F0FAF4' : '#FFFFFF',
                    color: facilities.includes(f) ? '#034338' : '#4B6B62',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 border"
                    style={{
                      borderColor: facilities.includes(f) ? '#034338' : '#D1D5DB',
                      backgroundColor: facilities.includes(f) ? '#034338' : 'transparent',
                    }}
                  >
                    {facilities.includes(f) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── Section 4: Photos ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-1" style={{ color: '#0A2A23' }}>Photos</h2>
            <p className="text-xs font-medium mb-4" style={{ color: '#4B6B62' }}>
              Upload up to 6 photos. First photo is the cover. Min 1 required. Max 5MB each (JPG, PNG, WebP).
            </p>

            {/* Preview grid */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1.5 left-1.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#37D76A', color: '#034338' }}>
                          Cover
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {photos.length < 6 && (
              <>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full py-4 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:border-[#034338] hover:bg-[#F0FAF4]"
                  style={{ borderColor: '#E8EDEB', color: '#4B6B62' }}
                >
                  + Add photos ({photos.length}/6)
                </button>
              </>
            )}
          </div>

          {/* ── Section 5: Video ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-1" style={{ color: '#0A2A23' }}>Video tour <span className="text-xs font-medium" style={{ color: '#4B6B62' }}>(optional)</span></h2>
            <p className="text-xs font-medium mb-4" style={{ color: '#4B6B62' }}>
              Upload one short video walkthrough. Max 50MB (MP4, WebM, MOV).
            </p>

            {videoPreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <video src={videoPreview} controls className="w-full rounded-xl" style={{ maxHeight: '200px' }} />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="mt-2 text-xs font-bold hover:underline"
                  style={{ color: '#DC2626' }}
                >
                  Remove video
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handleVideoSelect}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full py-4 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:border-[#034338] hover:bg-[#F0FAF4]"
                  style={{ borderColor: '#E8EDEB', color: '#4B6B62' }}
                >
                  + Upload video tour
                </button>
              </>
            )}
          </div>

          {/* ── Section 6: Contact ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-1" style={{ color: '#0A2A23' }}>Contact</h2>
            <p className="text-xs font-medium mb-4" style={{ color: '#4B6B62' }}>
              Students will use this number to reach you on WhatsApp.
            </p>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                WhatsApp number <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="080XXXXXXXX"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                onFocus={e => e.target.style.borderColor = '#034338'}
                onBlur={e => e.target.style.borderColor = '#E8EDEB'}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-black text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#034338' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {uploadProgress || 'Submitting...'}
              </span>
            ) : (
              'Submit listing for review'
            )}
          </button>

          <p className="text-center text-xs font-medium pb-4" style={{ color: '#4B6B62' }}>
            Your listing will be reviewed and activated within 24 hours.
          </p>
        </form>
      </div>
    </div>
  )
}
