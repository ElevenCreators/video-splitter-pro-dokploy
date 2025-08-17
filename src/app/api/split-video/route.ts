import { NextRequest, NextResponse } from 'next/server'
import { ffmpeg } from "@/lib/ffmpeg";
import fs from 'fs'
import path from 'path'

// Force system FFmpeg usage with environment variables
function setupFFmpegPath() {
  console.log('🔍 Setting up FFmpeg path...')

  // Try environment variable first (set in Dockerfile)
  if (process.env.FFMPEG_PATH) {
    console.log('📝 Environment FFMPEG_PATH:', process.env.FFMPEG_PATH)
    if (fs.existsSync(process.env.FFMPEG_PATH)) {
      ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH)
      console.log('✅ Using environment FFmpeg:', process.env.FFMPEG_PATH)
      return true
    } else {
      console.log('❌ Environment FFmpeg path does not exist:', process.env.FFMPEG_PATH)
    }
  }

  // Try standard system paths
  const systemPaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/bin/ffmpeg']

  console.log('🔍 Checking system paths:', systemPaths)

  for (const ffmpegPath of systemPaths) {
    console.log(`📍 Checking: ${ffmpegPath}`)
    if (fs.existsSync(ffmpegPath)) {
      ffmpeg.setFfmpegPath(ffmpegPath)
      console.log('✅ Found system FFmpeg:', ffmpegPath)
      return true
    }
  }

  console.log('❌ No FFmpeg found in any location')
  console.log('📂 Available files in /usr/bin:')
  try {
    const files = fs.readdirSync('/usr/bin').filter(f => f.includes('ffmpeg'))
    console.log(files.length > 0 ? files : 'No ffmpeg files found')
  } catch (err) {
    console.log('Cannot read /usr/bin directory')
  }

  return false
}

// Setup FFmpeg path on module load
const ffmpegAvailable = setupFFmpegPath()

// Disable the default body parser for this route
export const dynamic = 'force-dynamic'

interface VideoSegment {
  name: string
  data: string
  size: number
}

interface ProcessingResult {
  success: boolean
  segments: VideoSegment[]
  message: string
}

// Simulation mode for when FFmpeg is not available
function simulateVideoProcessing(fileName: string, segmentLength: number): Promise<ProcessingResult> {
  return new Promise((resolve) => {
    console.log('🎬 DEMO: Simulating video processing for:', fileName)

    setTimeout(() => {
      const numSegments = Math.ceil(60 / segmentLength)
      const segments = Array.from({ length: Math.min(numSegments, 6) }, (_, i) => ({
        name: `${fileName.replace(/\.[^/.]+$/, '')}_segment_${String(i + 1).padStart(3, '0')}.mp4`,
        data: btoa(`demo-video-data-${i + 1}-${Date.now()}`),
        size: Math.floor(Math.random() * 1000000) + 500000
      }))

      resolve({
        success: true,
        segments,
        message: `Video split into ${segments.length} segments (DEMO MODE - Real FFmpeg not available)`
      })
    }, 3000)
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('video') as File
    const segmentLength = parseInt(formData.get('segmentLength') as string) || 10

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`🎬 Processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) - ${segmentLength}s segments`)

    // Check if system FFmpeg is available
    if (!ffmpegAvailable) {
      console.log('🚧 System FFmpeg not available - using DEMO mode')
      const result = await simulateVideoProcessing(file.name, segmentLength)
      return NextResponse.json(result)
    }

    console.log('✅ Using REAL FFmpeg processing')

    // Create temporary directory
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const timestamp = Date.now()
    const inputPath = path.join(tempDir, `input_${timestamp}_${file.name}`)
    const outputDir = path.join(tempDir, `output_${timestamp}`)
    fs.mkdirSync(outputDir, { recursive: true })

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(inputPath, buffer)
    console.log(`📁 Saved: ${inputPath}`)

    // Process with FFmpeg
    const outputPattern = path.join(outputDir, 'segment_%03d.mp4')

    return new Promise<NextResponse>((resolve) => {
      ffmpeg(inputPath)
        .output(outputPattern)
        .outputOptions([
          '-c copy',
          '-map 0',
          '-f segment',
          `-segment_time ${segmentLength}`,
          '-reset_timestamps 1'
        ])
        .on('start', (commandLine) => {
          console.log('🎬 FFmpeg started:', commandLine)
        })
        .on('progress', (progress) => {
          console.log(`⏳ Progress: ${Math.round(progress.percent || 0)}%`)
        })
        .on('end', () => {
          try {
            console.log('✅ FFmpeg completed')

            const segments = fs.readdirSync(outputDir)
              .filter(file => file.endsWith('.mp4'))
              .sort()
              .map(filename => {
                const filePath = path.join(outputDir, filename)
                const fileBuffer = fs.readFileSync(filePath)
                return {
                  name: filename,
                  data: fileBuffer.toString('base64'),
                  size: fileBuffer.length
                }
              })

            console.log(`🎉 Generated ${segments.length} segments`)

            // Cleanup
            fs.rmSync(inputPath)
            fs.rmSync(outputDir, { recursive: true })

            resolve(NextResponse.json({
              success: true,
              segments,
              message: `Video split into ${segments.length} segments`
            }))
          } catch (err) {
            console.error('❌ Post-processing error:', err)
            resolve(NextResponse.json({
              error: 'Error processing results',
              details: err instanceof Error ? err.message : 'Unknown error'
            }, { status: 500 }))
          }
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg error:', err)

          // Cleanup
          try {
            if (fs.existsSync(inputPath)) fs.rmSync(inputPath)
            if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
          } catch (cleanupErr) {
            console.error('❌ Cleanup error:', cleanupErr)
          }

          resolve(NextResponse.json({
            error: 'Video processing failed',
            details: err.message
          }, { status: 500 }))
        })
        .run()
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
