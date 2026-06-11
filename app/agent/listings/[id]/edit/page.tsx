'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

const DISTANCE_OPTIONS = ['Walking distance', '5 mins walk', '10 mins walk', '15+ mins walk']
const FUOYE_AREAS = ['Oye Town', 'School Road', 'Behind Campus', 'Ikole Road', 'New Site', 'Other']

interface ExistingPhoto {
  id: string
  photo_url: string
  is_cover: boolean
  sort_order: number
}

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Form state
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
  const [address, setAddress]         = useState('')

  // Existing media
  const [existingPhotos, setExistingPhotos]         = useState<ExistingPhoto[]>([])
  const [removedPhotoIds, setRemovedPhotoIds]       = useState<string[]>([])
  const [existingVideoUrl, setExistingVideoUrl]     = useState<string | null>(null)
  const [removeExistingVideo, setRemoveExistingVideo] = useState(false)

  // New media
  const [newPhotos, setNewPhotos]           = useState<File[]>([])
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([])
  const [newVideo, setNewVideo]             = useState<File | null>(null)
  const [newVideoPreview, setNewVideoPreview] = useState<string | null>(null)

  // Page state
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError]               = useState('')
  const [agentId, setAgentId]           = useState<string | null>(null)
  const [listingSlug, setListingSlug]   = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setAgentId(user.id)

      const { data } = await supabase
        .from('listings')
        .select('*, listing_photos(id, photo_url, is_cover, sort_order)')
        .eq('id', listingId)
        .eq('agent_id', user.id)
        .single()

      if (!data) { router.push('/agent/dashboard'); return }

      // Pre-fill form
      setName(data.name)
      setDescription(data.description || '')
      setPrice(String(data.price))
      setRoomType(data.room_type)
      setRooms(String(data.rooms_available))
      setDistance(data.distance_tag || '5 mins walk')
      setFacilities(data.facilities || [])
      setWhatsapp(data.whatsapp_number || '')
      setAddress(data.address || '')
      setListingSlug(data.slug)
      setExistingVideoUrl(data.video_url || null)

      // Area
      if (FUOYE_AREAS.includes(data.area)) {
        setArea(data.area)
      } else {
        setArea('Other')
        setCustomArea(data.area)
      }

      // Photos sorted
      const sorted = [...(data.listing_photos || [])].sort((a, b) => a.sort_order - b.sort_order)
      setExistingPhotos(sorted)
      setLoading(false)
    }
    init()
  }, [listingId, router])

  const handleNewPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const currentTotal = (existingPhotos.length - removedPhotoIds.length) + newPhotos.length
    const remaining = 6 - currentTotal
    const toAdd = files.slice(0, remaining)
    setNewPhotos(prev => [...prev, ...toAdd])
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setNewPhotoPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeExistingPhoto = (photoId: string) => {
    setRemovedPhotoIds(prev => [...prev, photoId])
  }

  const removeNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index))
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewVideo(file)
    setNewVideoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const toggleFacility = (f: string) => {
    setFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const activeExistingPhotos = existingPhotos.filter(p => !removedPhotoIds.includes(p.id))
  const totalPhotoCount = activeExistingPhotos.length + newPhotos.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (totalPhotoCount === 0) {
      setError('At least one photo is required.')
      return
    }

    if (!agentId) return
    setSaving(true)

    try {
      const finalArea = area === 'Other' ? customArea : area

      // 1. Delete removed photos from storage + DB
      for (const photoId of removedPhotoIds) {
        await supabase.from('listing_photos').delete().eq('id', photoId)
      }

      // 2. Upload new photos
      if (newPhotos.length > 0) {
        setUploadProgress('Uploading new photos...')
        for (let i = 0; i < newPhotos.length; i++) {
          const file = newPhotos[i]
          const ext = file.name.split('.').pop()
          const path = `${agentId}/${listingSlug}/photo-new-${Date.now()}-${i}.${ext}`
          const { error: upErr } = await supabase.storage.from('listing-photos').upload(path, file, { upsert: true })
          if (upErr) throw new Error(upErr.message)
          const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
          await supabase.from('listing_photos').insert({
            listing_id: listingId,
            photo_url: publicUrl,
            is_cover: totalPhotoCount === 1 && i === 0,
            sort_order: activeExistingPhotos.length + i,
          })
        }
      }

      // Ensure cover photo is set
      if (activeExistingPhotos.length > 0) {
        const hasCover = activeExistingPhotos.some(p => p.is_cover)
        if (!hasCover) {
          await supabase.from('listing_photos').update({ is_cover: true }).eq('id', activeExistingPhotos[0].id)
        }
      }

      // 3. Handle video
      let videoUrl = existingVideoUrl

      if (removeExistingVideo) {
        videoUrl = null
      }

      if (newVideo) {
        setUploadProgress('Uploading video...')
        const ext = newVideo.name.split('.').pop()
        const path = `${agentId}/${listingSlug}/video.${ext}`
        const { error: vidErr } = await supabase.storage.from('listing-videos').upload(path, newVideo, { upsert: true })
        if (vidErr) throw new Error(vidErr.message)
        const { data: { publicUrl } } = supabase.storage.from('listing-videos').getPublicUrl(path)
        videoUrl = publicUrl
      }

      // 4. Update listing
      setUploadProgress('Saving changes...')
      const { error: updateErr } = await supabase.from('listings').update({
        name, description,
        price: parseInt(price),
        room_type: roomType,
        rooms_available: parseInt(rooms),
        area: finalArea,
        distance_tag: distance,
        facilities,
        whatsapp_number: whatsapp,
        video_url: videoUrl,
        address: address || null,
        updated_at: new Date().toISOString(),
      }).eq('id', listingId)

      if (updateErr) throw new Error(updateErr.message)

      router.push('/agent/dashboard')

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSaving(false)
      setUploadProgress('')
    }
  }

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#034338', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F5' }}>
      <Navbar />

      <div style={{ backgroundColor: '#034338' }} className="px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-semibold mb-4 hover:underline cursor-pointer" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Edit listing</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Update your hostel details</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-5" style={{ color: '#0A2A23' }}>Basic information</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Hostel name <span style={{ color: '#DC2626' }}>*</span></label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Description <span style={{ color: '#DC2626' }}>*</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors resize-none"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Price / year (₦) <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} required min={1000}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                    style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                    onFocus={e => e.target.style.borderColor = '#034338'}
                    onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Room type <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={roomType} onChange={e => setRoomType(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors cursor-pointer"
                    style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                    onFocus={e => e.target.style.borderColor = '#034338'}
                    onBlur={e => e.target.style.borderColor = '#E8EDEB'}>
                    {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Rooms available <span style={{ color: '#DC2626' }}>*</span></label>
                <input type="number" value={rooms} onChange={e => setRooms(e.target.value)} required min={0} max={100}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
                <p className="text-xs font-medium mt-1" style={{ color: '#4B6B62' }}>Set to 0 to mark as fully occupied.</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-5" style={{ color: '#0A2A23' }}>Location</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Area / Street <span style={{ color: '#DC2626' }}>*</span></label>
                <select value={area} onChange={e => setArea(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors cursor-pointer"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'}>
                  {FUOYE_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {area === 'Other' && (
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Specify area <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="text" value={customArea} onChange={e => setCustomArea(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                    style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                    onFocus={e => e.target.style.borderColor = '#034338'}
                    onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>Distance from FUOYE gate <span style={{ color: '#DC2626' }}>*</span></label>
                <select value={distance} onChange={e => setDistance(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors cursor-pointer"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'}>
                  {DISTANCE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>
                  Exact address <span className="font-normal" style={{ color: '#4B6B62' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. No. 12 Adeyemi Street, behind First Bank"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                  style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                  onFocus={e => e.target.style.borderColor = '#034338'}
                  onBlur={e => e.target.style.borderColor = '#E8EDEB'}
                />
                <p className="text-xs font-medium mt-1" style={{ color: '#4B6B62' }}>
                  Helps students find the hostel more easily.
                </p>
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-2" style={{ color: '#0A2A23' }}>Facilities</h2>
            <p className="text-xs font-medium mb-4" style={{ color: '#4B6B62' }}>Select all that apply</p>
            <div className="grid grid-cols-2 gap-2">
              {FACILITIES.map(f => (
                <button type="button" key={f} onClick={() => toggleFacility(f)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border cursor-pointer"
                  style={{ borderColor: facilities.includes(f) ? '#034338' : '#E8EDEB', backgroundColor: facilities.includes(f) ? '#F0FAF4' : '#FFFFFF', color: facilities.includes(f) ? '#034338' : '#4B6B62' }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 border"
                    style={{ borderColor: facilities.includes(f) ? '#034338' : '#D1D5DB', backgroundColor: facilities.includes(f) ? '#034338' : 'transparent' }}>
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

          {/* Photos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-1" style={{ color: '#0A2A23' }}>Photos</h2>
            <p className="text-xs font-medium mb-4" style={{ color: '#4B6B62' }}>Up to 6 photos. First photo is the cover. Max 5MB each.</p>

            {/* Existing photos */}
            {activeExistingPhotos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-bold mb-2" style={{ color: '#4B6B62' }}>CURRENT PHOTOS</p>
                <div className="grid grid-cols-3 gap-2">
                  {activeExistingPhotos.map((photo, i) => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute top-1.5 left-1.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#37D76A', color: '#034338' }}>Cover</span>
                        </div>
                      )}
                      <button type="button" onClick={() => removeExistingPhoto(photo.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New photo previews */}
            {newPhotoPreviews.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-bold mb-2" style={{ color: '#4B6B62' }}>NEW PHOTOS</p>
                <div className="grid grid-cols-3 gap-2">
                  {newPhotoPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewPhoto(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalPhotoCount < 6 && (
              <>
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleNewPhotoSelect} />
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  className="w-full py-4 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:border-[#034338] hover:bg-[#F0FAF4] cursor-pointer"
                  style={{ borderColor: '#E8EDEB', color: '#4B6B62' }}>
                  + Add more photos ({totalPhotoCount}/6)
                </button>
              </>
            )}
          </div>

          {/* Video */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-1" style={{ color: '#0A2A23' }}>Video tour <span className="text-xs font-medium" style={{ color: '#4B6B62' }}>(optional)</span></h2>
            <p className="text-xs font-medium mb-4" style={{ color: '#4B6B62' }}>Max 50MB (MP4, WebM, MOV).</p>

            {existingVideoUrl && !removeExistingVideo && !newVideo && (
              <div className="mb-3">
                <p className="text-xs font-bold mb-2" style={{ color: '#4B6B62' }}>CURRENT VIDEO</p>
                <video src={existingVideoUrl} controls className="w-full rounded-xl" style={{ maxHeight: '200px' }} />
                <button type="button" onClick={() => setRemoveExistingVideo(true)}
                  className="mt-2 text-xs font-bold hover:underline cursor-pointer" style={{ color: '#DC2626' }}>
                  Remove video
                </button>
              </div>
            )}

            {(removeExistingVideo || !existingVideoUrl) && !newVideo && (
              <>
                <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoSelect} />
                <button type="button" onClick={() => videoInputRef.current?.click()}
                  className="w-full py-4 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:border-[#034338] hover:bg-[#F0FAF4] cursor-pointer"
                  style={{ borderColor: '#E8EDEB', color: '#4B6B62' }}>
                  + Upload video tour
                </button>
              </>
            )}

            {newVideo && newVideoPreview && (
              <div>
                <video src={newVideoPreview} controls className="w-full rounded-xl" style={{ maxHeight: '200px' }} />
                <button type="button" onClick={() => { setNewVideo(null); setNewVideoPreview(null) }}
                  className="mt-2 text-xs font-bold hover:underline cursor-pointer" style={{ color: '#DC2626' }}>
                  Remove new video
                </button>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black mb-4" style={{ color: '#0A2A23' }}>Contact</h2>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#0A2A23' }}>WhatsApp number <span style={{ color: '#DC2626' }}>*</span></label>
              <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors"
                style={{ borderColor: '#E8EDEB', color: '#0A2A23' }}
                onFocus={e => e.target.style.borderColor = '#034338'}
                onBlur={e => e.target.style.borderColor = '#E8EDEB'} />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving} className="w-full py-4 rounded-xl font-black text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
            style={{ backgroundColor: '#034338' }}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {uploadProgress || 'Saving...'}
              </span>
            ) : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
