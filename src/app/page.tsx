'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface VideoSegment {
  name: string
  url?: string
  data?: string
  size?: number
}

export default function VideoSplitter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [segmentLength, setSegmentLength] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [segments, setSegments] = useState<VideoSegment[]>([])
  const [error, setError] = useState<string>('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.size <= 2 * 1024 * 1024 * 1024) { // 2GB limit
      setSelectedFile(file)
      setError('')
      setSegments([])
      setProgress(0)
    } else if (file && file.size > 2 * 1024 * 1024 * 1024) {
      setError('File size exceeds 2GB limit')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'] },
    maxSize: 2 * 1024 * 1024 * 1024,
    multiple: false
  })

  async function pollProgress(jobId: string) {
    setProgress(5)
    await new Promise<void>((resolvePoll, rejectPoll) => {
      const t = setInterval(async () => {
        try {
          const r = await fetch(`/api/progress?jobId=${encodeURIComponent(jobId)}`)
          const j = await r.json()
          if (!j?.ok) return
          const p = typeof j.job?.progress === 'number' ? j.job.progress : 0
          setProgress(p)
          if (j.job?.status === 'done') {
            clearInterval(t)
            setSegments(j.job.files || [])
            setProgress(100)
            resolvePoll()
          }
          if (j.job?.status === 'error') {
            clearInterval(t)
            rejectPoll(new Error(j.job.error || 'Processing failed'))
          }
        } catch (e) {
          clearInterval(t)
          rejectPoll(e as Error)
        }
      }, 500)
    })
  }

  const handleSplit = async () => {
    if (!selectedFile) return
    setIsProcessing(true)
    setProgress(0)
    setError('')
    setSegments([])

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('segmentLength', String(segmentLength))

      const res = await fetch('/api/split-video', { method: 'POST', body: formData })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error((e as any)?.error || 'Failed to process video')
      }
      const result = await res.json()

      // NUEVO FLUJO (jobs + polling)
      if (result?.ok && result?.jobId) {
        await pollProgress(result.jobId)
        return
      }

      // FLUJO ANTIGUO (base64 en la respuesta)
      if (result?.success && Array.isArray(result.segments)) {
        setSegments(result.segments)
        setProgress(100)
        return
      }

      throw new Error(result?.error || 'Processing failed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setProgress(0)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadSegment = (segment: VideoSegment) => {
    if (segment.url) {
      const a = document.createElement('a')
      a.href = segment.url
      a.download = segment.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }
    if (segment.data) {
      const byteChars = atob(segment.data)
      const byteNums = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
      const blob = new Blob([new Uint8Array(byteNums)], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = segment.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen gap-6 bg-[#0b0b0c] text-white px-4">
      <div className="text-center flex gap-1 flex-col m-4 p-1">
        <h1 className="font-medium text-3xl">Eleven Creators Splitter</h1>
        <p className="max-w-2xl text-center">
          Advanced video splitter to cut your videos into precise intervals (2s, 3s, or more). Take your posts to the next level with fast, simple, and seamless video editing.
        </p>
      </div>

      <div className="max-w-sm p-1 my-2">
        <div
          {...getRootProps()}
          className={`flex justify-center w-full h-32 px-4 transition border-2 border-white transition-colors duration-500 border-dashed rounded-md appearance-none cursor-pointer hover:border-orange-500 focus:outline-none ${isDragActive ? 'border-orange-500' : ''}`}
        >
          <input {...getInputProps()} />
          <span className="flex items-center justify-center flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-center">
                Drop files to attach, or <span className="text-orange-500 underline font-bold">browse</span>
              </span>
            </div>
            <div><p className="text-xs">Maximum 2Gb file.</p></div>
            {selectedFile && <div className="mt-2"><p className="text-sm text-green-400 text-center">✓ {selectedFile.name}</p></div>}
          </span>
        </div>
      </div>

      {error && <div className="text-red-400 text-sm max-w-md text-center">{error}</div>}

      <div className="flex flex-col items-center justify-center gap-3">
        <label className="text-center">Time per clip:</label>
        <div className="flex flex-col items-center gap-2">
          <input
            type="range"
            min="1"
            max="60"
            value={segmentLength}
            onChange={(e) => setSegmentLength(Number(e.target.value))}
            className="w-48 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-orange"
          />
          <div className="text-xl p-2 border-2 border-dashed border-white bg-transparent text-center rounded-xl w-20 transition-colors duration-500 hover:border-orange-500">
            {segmentLength}s
          </div>
          <div className="flex gap-2 mt-2">
            {[2,3,5,10,15,30].map(sec => (
              <button
                key={sec}
                onClick={() => setSegmentLength(sec)}
                className={`px-3 py-1 rounded border text-sm transition-colors duration-300 ${segmentLength===sec ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-500 text-gray-300 hover:border-orange-500 hover:text-orange-500'}`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSplit}
        disabled={!selectedFile || isProcessing}
        className="text-xl p-2 border-2 border-dashed rounded-xl transition-colors duration-500 hover:text-orange-500 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Edit'}
      </button>

      <div className="flex w-[320px] flex-col justify-center items-center">
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="p-1 text-sm mt-1">{progress.toFixed(2)}%</p>
      </div>

      {segments.length > 0 && (
        <div className="flex flex-col items-center gap-4 mt-6">
          <h3 className="text-xl font-medium">Download Clips</h3>
          <div className="grid gap-2 max-w-md">
            {segments.map((segment, idx) => (
              <button
                key={idx}
                onClick={() => downloadSegment(segment)}
                className="p-3 border border-orange-500 rounded-lg hover:bg-orange-500/10 transition-colors flex justify-between items-center"
              >
                <span>{segment.name}</span>
                <span className="text-sm text-gray-400">{segment.size ? (segment.size/(1024*1024)).toFixed(2)+' MB' : 'ready'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
