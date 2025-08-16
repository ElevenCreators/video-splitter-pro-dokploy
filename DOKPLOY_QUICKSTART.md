# 🚀 Video Splitter → Dokploy - Guía Rápida

## **🎯 ¿Por qué Dokploy es PERFECTO?**
- ✅ **Interface moderna** - Panel web como Vercel
- ✅ **Next.js nativo** - Deploy optimizado automático
- ✅ **GitHub sync** - Push → Deploy automático
- ✅ **SSL automático** - HTTPS sin configuración
- ✅ **Docker integrado** - Contenedores automáticos
- ✅ **Monitoreo incluido** - Logs y métricas

## **💰 Costo Final: ~$12-15/mes vs Railway $50-100/mes**

---

## **⚡ Setup Completo en 30 Minutos**

### **Paso 1: Contratar Hostinger VPS** ⏱️ 5 minutos

1. **Ve a:** [hostinger.com/vps-hosting](https://hostinger.com/vps-hosting)
2. **Selecciona:** VPS 2 (4GB RAM, 2 vCPU) - ~$12-15/mes
3. **Sistema:** **Ubuntu 22.04 LTS** (básico, sin panel)
4. **Configurar:** Usuario root + contraseña fuerte
5. **Anotar:** IP del servidor (ej: 123.45.67.89)

### **Paso 2: Configurar DNS** ⏱️ 2 minutos

**En tu proveedor de dominio, agrega:**
```
A Record: @ → IP_DEL_VPS
A Record: www → IP_DEL_VPS
A Record: dokploy → IP_DEL_VPS
```

### **Paso 3: Instalar Dokploy** ⏱️ 15 minutos

**3.1 Conectar al VPS:**
```bash
ssh root@TU_IP_DEL_VPS
# Introducir contraseña
```

**3.2 Descargar y ejecutar script:**
```bash
# Descargar script
wget https://raw.githubusercontent.com/TU_USUARIO/video-splitter-pro/main/dokploy-setup.sh

# Hacer ejecutable
chmod +x dokploy-setup.sh

# Ejecutar instalación
./dokploy-setup.sh TU_DOMINIO.com
```

**El script instala TODO automáticamente:**
- ✅ Docker + Docker Compose
- ✅ Dokploy panel de administración
- ✅ Firewall y seguridad
- ✅ FFmpeg para video processing
- ✅ Backup automático
- ✅ Monitoreo y limpieza

### **Paso 4: Configurar Dokploy** ⏱️ 5 minutos

**4.1 Acceder al panel:**
```
URL: https://TU_IP_DEL_VPS:3000
```

**4.2 Setup inicial:**
1. **Crear cuenta admin** (email + contraseña)
2. **Conectar GitHub** (autorizar repositorios)
3. **Verificar servidor** (Docker funcionando)

### **Paso 5: Deploy Video Splitter** ⏱️ 3 minutos

**5.1 Crear aplicación:**
- **New Application** → **GitHub Repository**
- **Nombre:** `video-splitter-pro`
- **Repo:** Tu repositorio
- **Branch:** `main`

**5.2 Configurar variables:**
```
NODE_ENV=production
MAX_FILE_SIZE=2147483648
FFMPEG_THREADS=2
SEGMENT_TIMEOUT=600
```

**5.3 Configurar dominio:**
- **Domains** → Add `TU_DOMINIO.com` y `www.TU_DOMINIO.com`
- **SSL:** Activar "Auto SSL"

**5.4 Deploy:**
- **Click "Deploy"**
- **Ver logs en tiempo real**
- **Esperar build (~5 minutos)**

---

## **🎉 ¡LISTO! URLs de acceso:**

- **🌐 Video Splitter:** `https://TU_DOMINIO.com`
- **⚙️ Panel Dokploy:** `https://dokploy.TU_DOMINIO.com`

---

## **📱 Gestión diaria super fácil:**

### **Dashboard Dokploy:**
- 📊 **Métricas:** CPU, RAM, tráfico en tiempo real
- 📋 **Logs:** Ver logs de la aplicación en vivo
- 🔄 **Deployments:** Historial y rollbacks con 1 click
- ⚙️ **Settings:** Cambiar variables sin reiniciar

### **Auto-Deploy desde GitHub:**
```bash
# Solo haz push y Dokploy se encarga del resto:
git add .
git commit -m "Mejoras al video splitter"
git push

# Dokploy automáticamente:
# ✅ Detecta el cambio
# ✅ Hace build nuevo
# ✅ Deploy sin downtime
# ✅ Mantiene SSL funcionando
```

### **Panel web súper intuitivo:**
- **Restart:** Reiniciar app con 1 click
- **Scale:** Aumentar recursos si necesario
- **Backup:** Backup manual instantáneo
- **Rollback:** Volver a versión anterior

---

## **🔧 Comandos útiles en VPS:**

### **Ver estado general:**
```bash
# Conectar al VPS
ssh root@TU_IP_DEL_VPS

# Ver contenedores corriendo
docker ps

# Ver logs de Dokploy
docker logs dokploy

# Uso de recursos
htop
```

### **Mantenimiento básico:**
```bash
# Backup manual
/usr/local/bin/backup-dokploy.sh

# Limpiar Docker
docker system prune -f

# Actualizar sistema
apt update && apt upgrade -y
```

---

## **📊 Ventajas vs otras opciones:**

| Aspecto | Railway Pro | Dokploy VPS | cPanel VPS |
|---------|-------------|-------------|------------|
| **Costo mensual** | $50-100 | $12-15 | $20-30 |
| **Interface** | Básica | Moderna | Antigua |
| **Auto-deploy** | ✅ | ✅ | ❌ |
| **Next.js nativo** | ✅ | ✅ | ❌ |
| **Recursos** | Compartidos | Dedicados | Dedicados |
| **Control** | Limitado | Total | Total |
| **SSL automático** | ✅ | ✅ | Manual |
| **Monitoreo** | Básico | Completo | Básico |

---

## **🎯 Casos de uso perfectos para tu Video Splitter:**

### **Uso personal/pequeño:**
- **Perfect!** - Cuesta $12-15/mes
- Procesar videos hasta 2GB sin problemas
- Interface súper fácil de usar

### **Uso comercial/medio:**
- **Scale fácil** - Aumentar recursos en panel
- Auto-backup y monitoreo incluido
- Deploy automático para updates

### **Uso intensivo:**
- **Múltiples instancias** - Load balancer integrado
- **Métricas avanzadas** - Grafana opcional
- **Alertas** - Email/Discord cuando hay problemas

---

## **🚨 Troubleshooting rápido:**

### **Si no puede acceder al panel:**
```bash
# Verificar que Dokploy está corriendo
docker ps | grep dokploy

# Reiniciar si necesario
docker restart dokploy

# Verificar firewall
ufw status
```

### **Si el deploy falla:**
1. **Ver logs** en Dashboard → Logs
2. **Verificar variables** de entorno
3. **Check GitHub** - repo accessible
4. **Restart** aplicación

### **Si videos no procesan:**
1. **Logs** → Buscar errores ffmpeg
2. **Resources** → Verificar RAM disponible
3. **Scale** → Aumentar memoria si necesario

---

## **💡 Tips Pro:**

### **Optimizar rendimiento:**
- **Memory:** 3GB mínimo para videos grandes
- **CPU:** 2 cores suficiente para uso normal
- **Storage:** Monitor espacio, limpia archivos temp

### **Seguridad:**
- **Updates:** Sistema se actualiza automáticamente
- **Backup:** Diario automático configurado
- **SSL:** Renovación automática

### **Monitoreo:**
- **Dashboard** siempre abierto para ver uso
- **Alerts** configurar para notificaciones
- **Logs** revisar semanalmente

---

## **🎉 Resultado Final:**

✅ **Video Splitter funcionando** profesionalmente
✅ **Panel moderno** tipo Vercel/Railway
✅ **Auto-deploy** desde GitHub
✅ **SSL automático** y renovación
✅ **Monitoreo completo** incluido
✅ **Backup automático** configurado
✅ **$420-1020 ahorro anual** vs Railway

**¡La mejor experiencia de desarrollo con máximo ahorro!** 🚀
