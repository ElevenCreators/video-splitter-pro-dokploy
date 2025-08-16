# 🚀 Video Splitter - Deploy con Dokploy

## **🎯 ¿Por qué Dokploy es PERFECTO para Video Splitter?**

- ✅ **Interface moderna** - Panel web intuitivo
- ✅ **Next.js nativo** - Deploy automático optimizado
- ✅ **Docker integrado** - Contenedores automáticos
- ✅ **GitHub sync** - Push → Deploy automático
- ✅ **SSL automático** - HTTPS sin configuración
- ✅ **Monitoreo incluido** - Logs y métricas en vivo
- ✅ **Variables de entorno** - Configuración fácil
- ✅ **Backup automático** - Configuraciones seguras

---

## **Paso 1: Contratar Hostinger VPS** ⏱️ 5 minutos

### **Configuración recomendada:**
1. **Ve a:** [hostinger.com/vps-hosting](https://hostinger.com/vps-hosting)
2. **Selecciona:** VPS 2 (4GB RAM, 2 vCPU) - ~$12-15/mes
3. **Sistema:** **Ubuntu 22.04 LTS** (sistema básico)
4. **Panel:** **Ninguno** (instalaremos Dokploy después)
5. **Ubicación:** Más cercana a tus usuarios
6. **Configurar:** Usuario root + contraseña fuerte
7. **Anotar:** IP del servidor (ej: 123.45.67.89)

---

## **Paso 2: Configurar Dominio** ⏱️ 2 minutos

**DNS Records que necesitas:**
```
A Record: @ → IP_DEL_VPS
A Record: www → IP_DEL_VPS
A Record: dokploy → IP_DEL_VPS (para panel admin)
```

---

## **Paso 3: Instalar Dokploy** ⏱️ 10 minutos

### **3.1 Conectar al VPS:**
```bash
# Windows PowerShell / Mac Terminal
ssh root@TU_IP_DEL_VPS
# Introducir contraseña
```

### **3.2 Actualizar sistema:**
```bash
# Actualizar paquetes
apt update && apt upgrade -y

# Instalar dependencias
apt install -y curl wget git
```

### **3.3 Instalar Docker:**
```bash
# Instalar Docker (requerido por Dokploy)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Iniciar Docker
systemctl start docker
systemctl enable docker
```

### **3.4 Instalar Dokploy:**
```bash
# Instalar Dokploy con un comando
curl -sSL https://dokploy.com/install.sh | sh
```

**El instalador hará automáticamente:**
- ✅ Configurar Docker Swarm
- ✅ Crear base de datos PostgreSQL
- ✅ Instalar Traefik (proxy reverso)
- ✅ Configurar SSL automático
- ✅ Crear panel de administración

---

## **Paso 4: Configurar Dokploy** ⏱️ 5 minutos

### **4.1 Acceder al panel:**
```
URL: https://TU_IP_DEL_VPS:3000
# O si configuraste DNS: https://dokploy.TU_DOMINIO.com
```

### **4.2 Setup inicial:**
1. **Crear cuenta admin** - Email + contraseña
2. **Configurar servidor** - Verificar que Docker funciona
3. **Conectar GitHub** - Autorizar acceso a repositorios

---

## **Paso 5: Deploy Video Splitter** ⏱️ 10 minutos

### **5.1 Crear nueva aplicación:**
1. **Dashboard** → **Create Application**
2. **Nombre:** `video-splitter-pro`
3. **Tipo:** **GitHub Repository**
4. **Repositorio:** Tu repo `video-splitter-pro`
5. **Branch:** `main`

### **5.2 Configurar aplicación:**

**Build Settings:**
```
Build Command: bun run build
Start Command: bun start
Port: 3000
```

**Environment Variables:**
```
NODE_ENV=production
MAX_FILE_SIZE=2147483648
FFMPEG_THREADS=2
SEGMENT_TIMEOUT=600
TEMP_CLEANUP_INTERVAL=300
```

**Docker Configuration:**
```dockerfile
# Dokploy detectará automáticamente el Dockerfile del proyecto
# Usará el Dockerfile que ya tienes optimizado
```

### **5.3 Configurar dominio:**
1. **Domains** tab
2. **Add Domain:** `TU_DOMINIO.com`
3. **Add Domain:** `www.TU_DOMINIO.com`
4. **SSL:** Activar "Auto SSL" ✅

### **5.4 Deploy:**
1. **Click "Deploy"**
2. **Ver logs en tiempo real**
3. **Esperar build completo** (~5-10 minutos)

---

## **Paso 6: Optimizaciones para Video Processing** ⏱️ 5 minutos

### **6.1 Recursos de contenedor:**
```
Memory Limit: 3GB
CPU Limit: 2 cores
Restart Policy: Always
```

### **6.2 Volúmenes (para archivos temporales):**
```
Mount: /tmp/video-processing → /app/temp
Type: Named Volume
Size: 10GB
```

### **6.3 Health Check:**
```
HTTP Path: /
Interval: 30s
Timeout: 10s
Retries: 3
```

---

## **🎉 ¡LISTO! Tu Video Splitter está funcionando**

### **URLs de acceso:**
- **Aplicación:** `https://TU_DOMINIO.com`
- **Panel Dokploy:** `https://dokploy.TU_DOMINIO.com`

### **Funcionalidades activas:**
- ✅ **Auto-deploy** desde GitHub
- ✅ **SSL automático** y renovación
- ✅ **Monitoreo en tiempo real**
- ✅ **Logs centralizados**
- ✅ **Backup automático**
- ✅ **Escalado si necesario**

---

## **📊 Gestión Post-Deploy**

### **Dashboard de Dokploy:**
- 📈 **Métricas:** CPU, RAM, Disk usage
- 📋 **Logs:** En tiempo real y históricos
- 🔄 **Deployments:** Historial y rollbacks
- ⚙️ **Settings:** Variables y configuraciones

### **Auto-Deploy desde GitHub:**
```bash
# Cada vez que hagas push a main:
git add .
git commit -m "Update video splitter"
git push origin main

# Dokploy automáticamente:
# 1. Detecta el push
# 2. Hace pull del código
# 3. Rebuild la aplicación
# 4. Deploy sin downtime
```

### **Comandos útiles del panel:**
- **Restart App:** Reiniciar aplicación
- **View Logs:** Ver logs en tiempo real
- **Rollback:** Volver a deploy anterior
- **Scale:** Aumentar recursos si necesario

---

## **💰 Costo Total Mensual:**

| Concepto | Costo |
|----------|-------|
| Hostinger VPS 2 | $12-15 |
| Dokploy | Gratis (open source) |
| **TOTAL** | **$12-15/mes** |

**vs Railway Pro:** $50-100/mes
**⭐ Ahorro:** $420-1020/año

---

## **🔧 Troubleshooting**

### **Si el deploy falla:**
1. **Ver logs** en Dokploy Dashboard
2. **Verificar variables** de entorno
3. **Check Dockerfile** en el repo
4. **Restart application**

### **Si hay problemas con videos:**
1. **Logs** → Buscar errores de ffmpeg
2. **Resources** → Verificar memoria disponible
3. **Volumes** → Check espacio en disco

### **Para updates del sistema:**
```bash
# SSH al servidor
ssh root@TU_IP_DEL_VPS

# Actualizar sistema
apt update && apt upgrade -y

# Reiniciar si necesario
reboot
```

---

## **🎯 Próximos pasos opcionales:**

### **Monitoreo avanzado:**
- **Grafana + Prometheus** via Dokploy
- **Alertas por email/Discord**
- **Métricas de uso de video**

### **Escalabilidad:**
- **Load balancer** para múltiples instancias
- **Redis** para cache de sesiones
- **PostgreSQL** para tracking de jobs

### **Backup automático:**
- **Configurar backup** de volumes
- **Backup de configuraciones** Dokploy
- **Sync con cloud storage**

---

**¡Con Dokploy tienes el mejor de ambos mundos: potencia de VPS + facilidad de uso!** 🚀
