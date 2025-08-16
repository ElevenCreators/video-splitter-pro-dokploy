# 🚀 Video Splitter - Guía Completa Railway Pro

## 🎯 Ventajas con Railway Pro
- ✅ Más memoria RAM para videos grandes
- ✅ Procesamiento más rápido
- ✅ Sin límites de tiempo de build
- ✅ Mejor rendimiento para ffmpeg
- ✅ Dominios personalizados
- ✅ Métricas avanzadas

## 📋 Paso a Paso Completo

### 1. 📁 Preparar el código en GitHub

**Opción A: Desde este proyecto**
```bash
# En tu terminal local:
cd ruta/donde/quieres/el/proyecto
# Descarga el proyecto completo desde Same.new
```

**Opción B: Si ya tienes el código**
```bash
cd video-splitter
git init
git add .
git commit -m "Initial commit: Video Splitter for Railway Pro"
```

### 2. 🔗 Subir a GitHub
```bash
# Crea un nuevo repositorio en GitHub.com
# Luego:
git remote add origin https://github.com/TU_USUARIO/video-splitter.git
git branch -M main
git push -u origin main
```

### 3. 🚂 Deploy en Railway

#### Método 1: Desde Dashboard (Recomendado)

1. **Ve a [railway.app](https://railway.app)**
2. **Click "New Project"**
3. **Selecciona "Deploy from GitHub repo"**
4. **Autoriza Railway** si es la primera vez
5. **Selecciona tu repositorio** `video-splitter`
6. **Railway detectará automáticamente** que es Next.js

#### Método 2: Con Railway CLI

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# En el directorio del proyecto
cd video-splitter
railway init
railway up
```

### 4. ⚙️ Configuración Avanzada para Pro

Una vez desplegado, ve a tu proyecto en Railway:

#### **Memory & CPU**
- Ve a **Settings > Resources**
- **Memory**: Cambia a **2GB o más** (importante para videos grandes)
- **CPU**: Deja en automático o sube a **2 vCPU**

#### **Variables de Entorno**
Railway configura automáticamente:
- `NODE_ENV=production`
- `PORT=$PORT` (automático)

Opcionalmente puedes agregar:
- `MAX_FILE_SIZE=2147483648` (2GB en bytes)
- `SEGMENT_TIMEOUT=600` (10 minutos máximo por segmento)

#### **Healthcheck**
- **Path**: `/` (ya configurado en railway.toml)
- **Timeout**: `300` segundos
- **Interval**: `30` segundos

### 5. 🌐 Dominio Personalizado (Pro Feature)

1. Ve a **Settings > Domains**
2. Click **Custom Domain**
3. Agrega tu dominio: `video-splitter.tudominio.com`
4. Configura tu DNS:
   ```
   CNAME video-splitter tuproyecto.up.railway.app
   ```

### 6. 📊 Monitoreo Avanzado

Con Railway Pro tienes acceso a:
- **Metrics**: CPU, Memory, Request volume
- **Logs**: Streaming en tiempo real
- **Alerts**: Notificaciones por email/Discord

### 7. 🎬 Optimizaciones para Video

#### En Railway Settings:
- **Restart Policy**: `never` (evita reinicios durante procesamiento)
- **Deploy Triggers**: Solo en `main` branch
- **Build Command**: `bun run build` (ya configurado)

#### Variables adicionales recomendadas:
```env
FFMPEG_THREADS=2
TEMP_CLEANUP_INTERVAL=300
MAX_CONCURRENT_JOBS=3
```

### 8. 🔧 Troubleshooting Pro

#### Si necesitas más recursos:
```bash
# Ver métricas actuales
railway status

# Ver logs en tiempo real
railway logs --follow
```

#### Para videos muy grandes:
- Aumenta Memory a **4GB**
- Aumenta Timeout a **600 segundos**
- Considera usar **Railway Volume** para almacenamiento temporal

### 9. 🎯 Testing Post-Deploy

1. **Ve a tu URL de Railway**
2. **Prueba con video pequeño** primero (< 100MB)
3. **Verifica logs** para asegurar que ffmpeg funciona
4. **Prueba con video más grande** (< 1GB)
5. **Monitorea métricas** durante procesamiento

### 10. 📈 Escalabilidad Pro

Para mayor volumen:

1. **Multiple Environments**:
   - `production` para usuarios
   - `staging` para testing

2. **Database** (si necesitas tracking):
   ```bash
   railway add postgresql
   ```

3. **Redis** para colas (opcional):
   ```bash
   railway add redis
   ```

## 🎉 Resultado Final

Tu Video Splitter estará en:
- **URL Railway**: `https://video-splitter-production-xxxx.up.railway.app`
- **URL Personalizada**: `https://video-splitter.tudominio.com`

## 💡 Pro Tips

- **Build Cache**: Railway Pro mantiene cache entre builds
- **Auto-scaling**: Se escala automáticamente con tráfico
- **Zero-downtime**: Deploys sin interrupciones
- **Backup**: Automatic backups con Pro
- **Team Access**: Invita colaboradores

## 🔐 Seguridad Adicional

Con Pro puedes agregar:
- **Environment Variables** secretas
- **Private Networking**
- **Access Controls**
- **Audit Logs**

---

¡Con Railway Pro tu Video Splitter tendrá rendimiento profesional! 🚀
