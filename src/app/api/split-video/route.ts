import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'

// Set ffmpeg path to the static binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

// Disable the default body parser for this route
export const dynamic = 'force-dynamic'

// Development mode simulation (when ffmpeg is not available)
function simulateVideoProcessing(fileName: string, segmentLength: number): Promise<any> {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Generate fake segments for testing
      const numSegments = Math.ceil(60 / segmentLength) // Assume 60-second video
      const segments = Array.from({ length: Math.min(numSegments, 6) }, (_, i) => ({
        name: `segment_${String(i + 1).padStart(3, '0')}.mp4`,
        data: btoa(`fake-video-data-segment-${i + 1}`), // Fake base64 data
        size: Math.floor(Math.random() * 1000000) + 100000 // Random size between 100KB-1MB
      }))

      resolve({
        success: true,
        segments,
        message: `Video split into ${segments.length} segments (DEMO MODE)`
      })
    }, 2000) // 2 second delay to simulate processing
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

    // Check if we're in development and ffmpeg is not available
    const isDevelopment = process.env.NODE_ENV === 'development'
    const ffmpegAvailable = ffmpegStatic && fs.existsSync(ffmpegStatic)

    if (isDevelopment && !ffmpegAvailable) {
      console.log('🚧 DEMO MODE: FFmpeg not available, simulating video processing...')
      const result = await simulateVideoProcessing(file.name, segmentLength)
      return NextResponse.json(result)
    }

    // Production mode with real ffmpeg processing
    // Create temporary directory
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Save uploaded file temporarily
    const inputPath = path.join(tempDir, `input_${Date.now()}_${file.name}`)
    const outputDir = path.join(tempDir, `output_${Date.now()}`)
    fs.mkdirSync(outputDir, { recursive: true })

    // Convert File to Buffer and save
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(inputPath, buffer)

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
          console.log('FFmpeg process started:', commandLine)
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent || 0}% done`)
        })
        .on('end', () => {
          try {
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

            // Cleanup
            fs.rmSync(inputPath)
            fs.rmSync(outputDir, { recursive: true })

            resolve(NextResponse.json({
              success: true,
              segments,
              message: `Video split into ${segments.length} segments`
            }))
          } catch (err) {
            console.error('Post-processing error:', err)
            resolve(NextResponse.json({
              error: 'Error processing results',
              details: err instanceof Error ? err.message : 'Unknown error'
            }, { status: 500 }))
          }
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err)

          // Cleanup on error
          try {
            if (fs.existsSync(inputPath)) fs.rmSync(inputPath)
            if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
          } catch (cleanupErr) {
            console.error('Cleanup error:', cleanupErr)
          }

          resolve(NextResponse.json({
            error: 'Video processing failed',
            details: err.message
          }, { status: 500 }))
        })
        .run()
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
