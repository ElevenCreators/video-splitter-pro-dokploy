# 🚀 Video Splitter - Railway Deployment Guide

## 📋 Resumen del Proyecto
Video Splitter es un clon exacto de freemediatools.com/videosplitter/ que permite dividir videos en segmentos más pequeños usando ffmpeg en el backend.

## ✨ Características Implementadas
- ✅ Diseño pixel-perfect del sitio original
- ✅ Drag & drop para archivos de video (hasta 2GB)
- ✅ Configuración de duración de segmentos
- ✅ Procesamiento real con ffmpeg
- ✅ Descarga automática de segmentos procesados
- ✅ Manejo de errores y feedback al usuario
- ✅ Responsive design

## 🛠 Stack Tecnológico
- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Procesamiento**: FFmpeg (ffmpeg-static)
- **Manejo de archivos**: react-dropzone, formidable
- **Deployment**: Railway ready

## 📂 Estructura del Proyecto
```
video-splitter/
├── src/
│   ├── app/
│   │   ├── api/split-video/route.ts    # API endpoint para procesamiento
│   │   ├── page.tsx                    # Página principal
│   │   ├── globals.css                 # Estilos globales
│   │   └── layout.tsx                  # Layout principal
│   └── lib/
│       └── utils.ts                    # Utilidades
├── Dockerfile                          # Configuración Docker
├── railway.toml                        # Configuración Railway
├── package.json                        # Dependencias y scripts
└── RAILWAY_DEPLOY.md                   # Esta guía
```

## 🚂 Deploy en Railway

### Opción 1: Deploy desde GitHub (Recomendado)

1. **Pushea el código a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Video Splitter clone"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Conecta con Railway**:
   - Ve a [railway.app](https://railway.app)
   - Haz clic en "Start a New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza Railway para acceder a tu GitHub
   - Selecciona tu repositorio

3. **Configuración automática**:
   - Railway detectará automáticamente que es un proyecto Next.js
   - Usará el `railway.toml` y `Dockerfile` incluidos
   - Instalará ffmpeg automáticamente

### Opción 2: Deploy directo con Railway CLI

1. **Instala Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login y deploy**:
   ```bash
   railway login
   cd video-splitter
   railway init
   railway up
   ```

## ⚙️ Variables de Entorno

Railway configurará automáticamente:
- `NODE_ENV=production`
- `PORT=3000` (o el puerto asignado por Railway)

No necesitas configurar variables adicionales.

## 🐳 Configuración Docker

El proyecto incluye un `Dockerfile` optimizado que:
- Usa Node.js 18 Alpine para menor tamaño
- Instala ffmpeg automáticamente
- Configura el directorio de trabajo
- Instala dependencias con Bun
- Crea directorio temporal para procesamiento
- Expone el puerto 3000

## 📝 Railway Configuration

El archivo `railway.toml` incluye:
- Builder: nixpacks
- Health check en "/"
- Timeout de 300 segundos para procesamiento de video
- Variables de entorno necesarias

## 🎯 Funcionalidades Post-Deploy

Una vez desplegado, la aplicación tendrá:

1. **Upload de Videos**:
   - Soporte para formatos: MP4, AVI, MOV, MKV, WebM
   - Límite de 2GB por archivo
   - Drag & drop interface

2. **Procesamiento**:
   - Configuración de duración de segmentos (1-3600 segundos)
   - Procesamiento en tiempo real con ffmpeg
   - Barra de progreso visual

3. **Descarga**:
   - Descarga automática de segmentos procesados
   - Información de tamaño de cada segmento
   - Nombres de archivo secuenciales

## 🔧 Troubleshooting

### Si el deploy falla:

1. **Memoria insuficiente**:
   - En Railway, ve a Settings > Resources
   - Aumenta la memoria a 1GB o más

2. **Timeout en builds**:
   - El ffmpeg puede tardar en instalarse
   - Espera hasta 10 minutos en el primer deploy

3. **Errores de procesamiento**:
   - Verifica que el archivo de video esté correctamente formateado
   - Tamaños muy grandes pueden causar timeouts

### Logs útiles:
```bash
railway logs
```

## 💡 Optimizaciones para Producción

1. **Límites de archivo**: Ajustables en el código
2. **Formatos soportados**: Configurables en react-dropzone
3. **Duración máxima**: Actualmente limitada a 1 hora
4. **Limpieza automática**: Los archivos temporales se eliminan automáticamente

## 🌐 URL de Acceso

Una vez desplegado, Railway te proporcionará una URL como:
```
https://video-splitter-production.railway.app
```

## 📱 Testing Post-Deploy

Para probar la aplicación:
1. Visita la URL proporcionada por Railway
2. Sube un video pequeño (< 50MB) para testing
3. Configura duración del segmento (ej: 5 segundos)
4. Haz clic en "Split!" y espera el procesamiento
5. Descarga los segmentos generados

## 🔐 Consideraciones de Seguridad

- Límites de tamaño de archivo implementados
- Limpieza automática de archivos temporales
- Validación de tipos de archivo
- Manejo seguro de errores

## 📈 Escalabilidad

Para mayor volumen:
- Considera usar Railway Pro para más recursos
- Implementa cola de trabajos para procesamiento asíncrono
- Agrega almacenamiento en la nube para archivos grandes

---

¡Tu Video Splitter está listo para Railway! 🎉
