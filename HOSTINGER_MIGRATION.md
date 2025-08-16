# 🚀 Video Splitter - Migración a Hostinger VPS

## 💰 **Ventajas de Hostinger VPS**
- ✅ **$12-15/mes** vs Railway $50-100/mes
- ✅ **Control total** del servidor
- ✅ **Recursos dedicados** 4GB RAM, 2 vCPU
- ✅ **Sin límites** de procesamiento
- ✅ **Panel de control** fácil de usar

---

## **Paso 1: Contratar Hostinger VPS**

### **Plan Recomendado:**
- **VPS 2:** 4GB RAM, 2 vCPU, 80GB SSD
- **Precio:** ~$12-15/mes
- **Sistema:** Ubuntu 22.04 LTS

### **Configuración inicial:**
1. Ve a [hostinger.com/vps-hosting](https://hostinger.com/vps-hosting)
2. Selecciona **VPS 2** (4GB RAM, 2 vCPU)
3. Elige **Ubuntu 22.04 LTS**
4. Configura usuario root y contraseña
5. **Anota la IP del servidor**

---

## **Paso 2: Conexión al VPS**

### **Desde Windows (PowerShell):**
```powershell
# Conectar al VPS via SSH
ssh root@TU_IP_DEL_VPS
# Introducir contraseña cuando te la pida
```

### **Desde Mac/Linux:**
```bash
# Conectar al VPS via SSH
ssh root@TU_IP_DEL_VPS
```

---

## **Paso 3: Configuración del Servidor**

### **Actualizar sistema:**
```bash
# Actualizar paquetes
apt update && apt upgrade -y

# Instalar herramientas básicas
apt install -y curl wget git unzip htop nginx
```

### **Instalar Node.js y Bun:**
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Verificar instalaciones
node --version
bun --version
```

### **Instalar FFmpeg:**
```bash
# Instalar FFmpeg para procesamiento de video
apt install -y ffmpeg

# Verificar instalación
ffmpeg -version
```

### **Instalar Docker (opcional pero recomendado):**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Iniciar Docker
systemctl start docker
systemctl enable docker
```

---

## **Paso 4: Clonar el Proyecto**

```bash
# Ir al directorio web
cd /var/www

# Clonar tu repositorio
git clone https://github.com/TU_USUARIO/video-splitter-pro.git

# Ir al directorio del proyecto
cd video-splitter-pro

# Instalar dependencias
bun install

# Construir para producción
bun run build
```

---

## **Paso 5: Configurar Variables de Entorno**

```bash
# Crear archivo de variables
nano .env.local
```

**Contenido del archivo:**
```env
NODE_ENV=production
PORT=3000
MAX_FILE_SIZE=2147483648
FFMPEG_THREADS=2
SEGMENT_TIMEOUT=600
TEMP_CLEANUP_INTERVAL=300
```

---

## **Paso 6: Configurar Nginx**

```bash
# Crear configuración de Nginx
nano /etc/nginx/sites-available/video-splitter
```

**Contenido del archivo:**
```nginx
server {
    listen 80;
    server_name TU_DOMINIO.com www.TU_DOMINIO.com;

    client_max_body_size 2G;
    client_body_timeout 300s;
    proxy_read_timeout 300s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar configuración
ln -s /etc/nginx/sites-available/video-splitter /etc/nginx/sites-enabled/

# Eliminar configuración default
rm /etc/nginx/sites-enabled/default

# Probar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

---

## **Paso 7: Configurar SSL con Let's Encrypt**

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
certbot --nginx -d TU_DOMINIO.com -d www.TU_DOMINIO.com

# Verificar renovación automática
certbot renew --dry-run
```

---

## **Paso 8: Crear Servicio Systemd**

```bash
# Crear archivo de servicio
nano /etc/systemd/system/video-splitter.service
```

**Contenido del archivo:**
```ini
[Unit]
Description=Video Splitter App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/video-splitter-pro
ExecStart=/root/.bun/bin/bun start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Activar y iniciar servicio
systemctl daemon-reload
systemctl enable video-splitter
systemctl start video-splitter

# Verificar estado
systemctl status video-splitter
```

---

## **Paso 9: Configurar Firewall**

```bash
# Instalar UFW
apt install -y ufw

# Configurar reglas básicas
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'

# Activar firewall
ufw enable

# Verificar estado
ufw status
```

---

## **Paso 10: Optimizaciones para Video**

### **Crear directorio temporal:**
```bash
# Crear directorio para videos temporales
mkdir -p /var/www/video-splitter-pro/temp
chmod 755 /var/www/video-splitter-pro/temp
```

### **Configurar limpieza automática:**
```bash
# Crear script de limpieza
nano /usr/local/bin/cleanup-temp.sh
```

**Contenido del script:**
```bash
#!/bin/bash
# Limpiar archivos temporales mayores a 1 hora
find /var/www/video-splitter-pro/temp -type f -mmin +60 -delete
```

```bash
# Hacer ejecutable
chmod +x /usr/local/bin/cleanup-temp.sh

# Agregar a crontab
(crontab -l ; echo "*/30 * * * * /usr/local/bin/cleanup-temp.sh") | crontab -
```

---

## **Paso 11: Verificación Final**

### **Verificar servicios:**
```bash
# Estado de los servicios
systemctl status video-splitter
systemctl status nginx

# Logs de la aplicación
journalctl -u video-splitter -f
```

### **Probar la aplicación:**
1. **Ve a:** `https://TU_DOMINIO.com`
2. **Sube un video pequeño** para probar
3. **Verifica logs** si hay errores

---

## **🎉 ¡Migración Completada!**

Tu Video Splitter ahora está corriendo en Hostinger VPS:
- ✅ **Costo:** $12-15/mes fijo
- ✅ **SSL:** Certificado gratuito
- ✅ **Performance:** Recursos dedicados
- ✅ **Control:** Acceso root completo

---

## **📊 Monitoreo y Mantenimiento**

### **Comandos útiles:**
```bash
# Ver uso de recursos
htop

# Logs de la app
journalctl -u video-splitter -f

# Reiniciar servicios
systemctl restart video-splitter nginx

# Actualizar código
cd /var/www/video-splitter-pro
git pull
bun install
bun run build
systemctl restart video-splitter
```

### **Backups automáticos:**
```bash
# Script de backup
nano /usr/local/bin/backup-app.sh
```

```bash
#!/bin/bash
tar -czf /root/backup-$(date +%Y%m%d).tar.gz /var/www/video-splitter-pro
# Mantener solo últimos 7 backups
find /root/backup-*.tar.gz -mtime +7 -delete
```

---

**¡Tu Video Splitter ahora es 3-4x más barato y con mejor control!** 🚀
