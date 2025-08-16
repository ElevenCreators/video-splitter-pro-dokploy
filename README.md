# 🎬 Eleven Creators Splitter

**Advanced video splitter to cut your videos into precise intervals (2s, 3s, or more). Take your posts to the next level with fast, simple, and seamless video editing.**

## ✨ Features

- 🎯 **Precise time control** - Cut videos into exact intervals (1s to 60s)
- 🎛️ **Intuitive slider interface** - Easy time selection with quick presets
- 📱 **Creator-focused** - Perfect for social media content
- 🚀 **Fast processing** - Powered by FFmpeg
- 📂 **Drag & drop** - Simple file upload (up to 2GB)
- 🎨 **Modern UI** - Clean orange theme design
- 📱 **Responsive** - Works on all devices

## 🎬 Perfect for Content Creators

- **TikTok clips** - 2-3 second segments
- **Instagram reels** - 15-30 second clips
- **YouTube shorts** - Custom intervals
- **Social media** - Optimized for all platforms

## 🚀 Quick Start

### Option 1: Dokploy (Recommended)
```bash
# 1. Get Hostinger VPS (8GB RAM recommended)
# 2. Run setup script
./dokploy-setup.sh your-domain.com

# 3. Deploy from GitHub in Dokploy panel
# 4. Ready in 30 minutes!
```

### Option 2: Manual VPS Setup
```bash
./hostinger-setup.sh your-domain.com https://github.com/your-user/eleven-creators-splitter.git
```

### Option 3: Railway (Expensive but easy)
```bash
# Connect GitHub repo to Railway
# Auto-deploy enabled
```

## 💰 Deployment Costs

| Option | Monthly Cost | Features |
|--------|-------------|----------|
| **Dokploy VPS** | $12-15 | Modern panel, auto-deploy, SSL |
| **Basic VPS** | $12-15 | Full control, manual setup |
| **Railway** | $50-100 | Easiest but expensive |

## 🛠 Tech Stack

- **Frontend:** Next.js 15, React 18, Tailwind CSS
- **Backend:** Next.js API Routes, FFmpeg
- **Processing:** fluent-ffmpeg, ffmpeg-static
- **UI:** Custom orange theme, responsive design
- **Deploy:** Docker, Dokploy, or VPS ready

## 📋 Requirements

- **Server:** 4GB+ RAM, 2+ CPU cores
- **Storage:** 100GB+ for temporary files
- **Video formats:** MP4, AVI, MOV, MKV, WebM
- **Max file size:** 2GB (configurable to 4GB with 8GB RAM)

## 🔧 Configuration

Environment variables for optimization:
```env
NODE_ENV=production
MAX_FILE_SIZE=4294967296    # 4GB with 8GB RAM
FFMPEG_THREADS=4           # For 8GB RAM VPS
SEGMENT_TIMEOUT=900        # 15 minutes max
MAX_CONCURRENT_JOBS=3      # Process 3 videos simultaneously
```

## 📖 Documentation

- **[Dokploy Quick Start](DOKPLOY_QUICKSTART.md)** - 30-minute setup
- **[Dokploy Full Guide](DOKPLOY_DEPLOYMENT.md)** - Complete documentation
- **[VPS Setup](HOSTINGER_MIGRATION.md)** - Manual server setup
- **[Railway Guide](RAILWAY_DEPLOY.md)** - Easy but expensive option

## 🎨 Customization

All text and colors can be easily modified:

**Main content** - `src/app/page.tsx`:
- Title, description, button text
- Time presets (2s, 3s, 5s, etc.)
- UI colors and styling

**Global styles** - `src/app/globals.css`:
- Color scheme (currently orange theme)
- Slider appearance
- Progress bar styling

## 🚀 Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

## 📊 Performance

With recommended 8GB RAM VPS:
- **Video size:** Up to 4GB per file
- **Processing speed:** Real-time or faster
- **Concurrent users:** 10-20 simultaneous
- **Storage:** Auto-cleanup of temporary files

## 🔒 Security

- File type validation
- Size limits enforced
- Temporary file cleanup
- Firewall configuration included
- SSL certificate automation

## 📞 Support

For deployment help:
1. Check logs: `bun run logs`
2. Monitor status: `bun run status`
3. Restart if needed: `bun run restart`

---

**Built for content creators who need fast, precise video editing tools.** 🎬
