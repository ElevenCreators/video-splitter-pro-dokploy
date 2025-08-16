import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'

// Set ffmpeg path - try multiple sources
function setupFFmpegPath() {
  // Try environment variable first (Docker containers)
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH)
    console.log('Using environment FFMPEG_PATH:', process.env.FFMPEG_PATH)
    return true
  }

  // Try ffmpeg-static (bundled binary)
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
    ffmpeg.setFfmpegPath(ffmpegStatic)
    console.log('Using ffmpeg-static:', ffmpegStatic)
    return true
  }

  // Try system ffmpeg (common in Docker containers)
  const systemPaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/bin/ffmpeg', 'ffmpeg']

  for (const ffmpegPath of systemPaths) {
    try {
      if (fs.existsSync(ffmpegPath)) {
        ffmpeg.setFfmpegPath(ffmpegPath)
        console.log('Using system ffmpeg:', ffmpegPath)
        return true
      }
    } catch (err) {
      console.log(`Path ${ffmpegPath} not accessible:`, err)
    }
  }

  // Last resort: try to run ffmpeg command to see if it's in PATH
  try {
    const { execSync } = require('child_process')
    const ffmpegPath = execSync('which ffmpeg', { encoding: 'utf8' }).trim()
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath)
      console.log('Using PATH ffmpeg:', ffmpegPath)
      return true
    }
  } catch (err) {
    console.log('FFmpeg not found in PATH:', err)
  }

  console.log('❌ FFmpeg not found in any location')
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

// Development mode simulation (when ffmpeg is not available)
function simulateVideoProcessing(fileName: string, segmentLength: number): Promise<ProcessingResult> {
  return new Promise((resolve) => {
    console.log('🎬 Simulating video processing for:', fileName)

    // Simulate processing time
    setTimeout(() => {
      // Generate fake segments for testing
      const numSegments = Math.ceil(60 / segmentLength) // Assume 60-second video
      const segments = Array.from({ length: Math.min(numSegments, 6) }, (_, i) => ({
        name: `${fileName.replace(/\.[^/.]+$/, '')}_segment_${String(i + 1).padStart(3, '0')}.mp4`,
        data: btoa(`fake-video-data-segment-${i + 1}-${Date.now()}`), // Fake base64 data
        size: Math.floor(Math.random() * 1000000) + 500000 // Random size between 500KB-1.5MB
      }))

      resolve({
        success: true,
        segments,
        message: `Video split into ${segments.length} segments (DEMO MODE - FFmpeg not available)`
      })
    }, 3000) // 3 second delay to simulate processing
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

    console.log(`🎬 Processing video: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB, segments: ${segmentLength}s`)

    // Check if ffmpeg is available
    if (!ffmpegAvailable) {
      console.log('🚧 FFmpeg not available, using simulation mode')
      const result = await simulateVideoProcessing(file.name, segmentLength)
      return NextResponse.json(result)
    }

    // Production mode with real ffmpeg processing
    console.log('✅ Using real FFmpeg processing')

    // Create temporary directory
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Save uploaded file temporarily
    const timestamp = Date.now()
    const inputPath = path.join(tempDir, `input_${timestamp}_${file.name}`)
    const outputDir = path.join(tempDir, `output_${timestamp}`)
    fs.mkdirSync(outputDir, { recursive: true })

    // Convert File to Buffer and save
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(inputPath, buffer)

    console.log(`📁 File saved to: ${inputPath}`)

    // Process video with ffmpeg
    const outputPattern = path.join(outputDir, 'segment_%03d.mp4')

    return new Promise<NextResponse>((resolve) => {
      ffmpeg(inputPath)
        .output(outputPattern)
        .outputOptions([
          '-c copy',  // Copy streams without re-encoding for speed
          '-map 0',   // Map all streams
          '-f segment',
          `-segment_time ${segmentLength}`,
          '-reset_timestamps 1'
        ])
        .on('start', (commandLine) => {
          console.log('🎬 FFmpeg command:', commandLine)
        })
        .on('progress', (progress) => {
          console.log(`⏳ Processing: ${Math.round(progress.percent || 0)}% done`)
        })
        .on('end', () => {
          try {
            console.log('✅ FFmpeg processing completed')

            // Read generated segments
            const segments = fs.readdirSync(outputDir)
              .filter(file => file.endsWith('.mp4'))
              .sort() // Ensure proper ordering
              .map(filename => {
                const filePath = path.join(outputDir, filename)
                const fileBuffer = fs.readFileSync(filePath)
                return {
                  name: filename,
                  data: fileBuffer.toString('base64'),
                  size: fileBuffer.length
                }
              })

            console.log(`🎉 Generated ${segments.length} segments successfully`)

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

          // Cleanup on error
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
