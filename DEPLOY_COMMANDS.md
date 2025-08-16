# 🚀 Comandos para Deploy en Railway

## Paso 1: Descargar el proyecto
```bash
# Si ya tienes el código, ve al directorio
cd video-splitter

# Si necesitas descargar desde here, usa git clone de tu repo
```

## Paso 2: Instalar Railway CLI
```bash
# Opción 1: Con npm
npm install -g @railway/cli

# Opción 2: Con curl (si npm falla)
curl -fsSL https://railway.app/install.sh | sh
```

## Paso 3: Deploy en Railway (UN SOLO COMANDO)
```bash
# Login en Railway (se abrirá tu navegador)
railway login

# Inicializar y hacer deploy automáticamente
railway up
```

## 🎯 ¡Eso es todo!

Con `railway up` Railway:
1. ✅ Detectará automáticamente que es un proyecto Next.js
2. ✅ Usará el `Dockerfile` incluido
3. ✅ Instalará ffmpeg automáticamente
4. ✅ Configurará las variables de entorno
5. ✅ Te dará una URL de acceso
6. ✅ Configurará HTTPS automáticamente

## 📱 Resultado esperado:
```
✅ Connected to Railway
🚀 Deploying project...
🔨 Building with Docker...
📦 Installing dependencies...
🎬 Installing ffmpeg...
✨ Build complete!
🌐 Deployed to: https://video-splitter-production-xxxx.up.railway.app
```

## 🔧 Si algo sale mal:

**Si el login falla:**
```bash
railway logout
railway login
```

**Si quieres más control:**
```bash
railway init  # Solo inicializar
railway up    # Hacer deploy
```

**Ver logs:**
```bash
railway logs
```

## 💡 Tip Pro:
Railway detectará automáticamente el `railway.toml` y `Dockerfile` que ya están configurados, así que el deploy será completamente automático.
