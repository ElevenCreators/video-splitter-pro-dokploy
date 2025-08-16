# ✅ Railway Pro - Checklist de Deploy

## 📋 Lista de Verificación Paso a Paso

### Fase 1: Preparación
- [ ] ✅ **Tengo Railway Pro activo**
- [ ] 📁 **Proyecto descargado localmente**
- [ ] 🐙 **Cuenta de GitHub lista**
- [ ] 💻 **Terminal/CLI disponible**

### Fase 2: GitHub Setup
- [ ] 📂 **Crear repositorio en GitHub**
  ```
  Nombre sugerido: video-splitter-pro
  Descripción: Professional Video Splitter Tool
  Público o Privado: Tu elección
  ```

- [ ] 📤 **Subir código a GitHub**
  ```bash
  git init
  git add .
  git commit -m "Initial: Video Splitter Pro for Railway"
  git remote add origin https://github.com/TU_USUARIO/video-splitter-pro.git
  git push -u origin main
  ```

### Fase 3: Railway Deploy
- [ ] 🌐 **Ir a [railway.app](https://railway.app)**
- [ ] ➕ **Click "New Project"**
- [ ] 🐙 **Seleccionar "Deploy from GitHub repo"**
- [ ] 🔗 **Autorizar GitHub (si es necesario)**
- [ ] 📁 **Seleccionar repositorio `video-splitter-pro`**
- [ ] ⚡ **Railway detecta Next.js automáticamente**
- [ ] 🚀 **Click "Deploy"**

### Fase 4: Configuración Pro
- [ ] 🏠 **Ir al Dashboard del proyecto**
- [ ] ⚙️ **Settings > Resources**
  - Memory: **2GB** ✅
  - CPU: **2 vCPU** ✅
  - Storage: **10GB** ✅

- [ ] 🌍 **Variables de Entorno** (Settings > Variables)
  ```
  MAX_FILE_SIZE=2147483648
  FFMPEG_THREADS=2
  SEGMENT_TIMEOUT=600
  TEMP_CLEANUP_INTERVAL=300
  ```

- [ ] 🏥 **Health Check** (Settings > Health Check)
  - Path: `/`
  - Timeout: `300` segundos
  - Interval: `30` segundos

### Fase 5: Dominio Personalizado (Opcional)
- [ ] 🌐 **Settings > Domains**
- [ ] ➕ **Add Custom Domain**
- [ ] 📝 **Escribir: `video-splitter.tudominio.com`**
- [ ] 🔧 **Configurar DNS CNAME**
- [ ] ✅ **Verificar SSL automático**

### Fase 6: Monitoreo Pro
- [ ] 📊 **Activar Metrics** (Dashboard > Metrics)
- [ ] 🔔 **Configurar Alerts** (Settings > Alerts)
  - CPU > 80%
  - Memory > 90%
  - Response time > 5s
- [ ] 📱 **Conectar Discord/Email** para notificaciones

### Fase 7: Testing & Verificación
- [ ] 🌐 **Abrir URL de Railway**
- [ ] 🎬 **Probar con video pequeño** (< 50MB)
- [ ] 📊 **Verificar métricas en tiempo real**
- [ ] 📋 **Ver logs** (Dashboard > Logs)
- [ ] 🎯 **Probar con video más grande** (< 500MB)
- [ ] ✅ **Verificar descarga de segmentos**

### Fase 8: Optimización Final
- [ ] 🔄 **Auto Deploy activado** (Settings > GitHub)
- [ ] 📈 **Scaling configurado** (Settings > Scaling)
- [ ] 🛡️ **Backup automático** verificado
- [ ] 👥 **Team access** configurado (si necesario)

## 🎯 URLs Importantes

- **Dashboard**: `https://railway.app/project/TU_PROJECT_ID`
- **Logs**: `https://railway.app/project/TU_PROJECT_ID/logs`
- **Metrics**: `https://railway.app/project/TU_PROJECT_ID/metrics`
- **App Live**: `https://video-splitter-production-xxxx.up.railway.app`

## 🚨 Troubleshooting Pro

### Si el build falla:
- [ ] 📋 **Ver Build Logs**
- [ ] 🔧 **Verificar Dockerfile**
- [ ] 💾 **Aumentar Build Memory** (Settings > Build)

### Si el procesamiento es lento:
- [ ] 🚀 **Aumentar Memory a 4GB**
- [ ] ⚡ **Aumentar CPU a 4 vCPU**
- [ ] 🔧 **Verificar FFMPEG_THREADS=4**

### Si hay timeouts:
- [ ] ⏱️ **Aumentar SEGMENT_TIMEOUT a 900**
- [ ] 🏥 **Aumentar Health Check timeout**
- [ ] 🔄 **Verificar Auto-restart policy**

## 💡 Pro Tips

🎯 **Con Railway Pro puedes**:
- Procesar videos hasta 2GB sin problemas
- Múltiples videos simultáneos
- Dominios personalizados con SSL
- Métricas avanzadas en tiempo real
- Zero-downtime deployments
- Team collaboration
- Automatic backups

## 🎉 ¡Éxito!

Una vez completado el checklist:
✅ Tu Video Splitter estará ejecutándose profesionalmente
✅ Con recursos dedicados para videos grandes
✅ Monitoreo y alertas configuradas
✅ Listo para producción real

---

**¿Necesitas ayuda?** Ponte en contacto y te ayudo con cualquier paso específico 🚀
