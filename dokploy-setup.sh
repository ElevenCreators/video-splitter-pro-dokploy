#!/bin/bash

echo "🚀 Video Splitter - Dokploy VPS Setup Script"
echo "============================================"

# Variables
DOMAIN=${1:-""}

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Falta dominio"
    echo "Usage: ./dokploy-setup.sh TU_DOMINIO.com"
    echo "Ejemplo: ./dokploy-setup.sh videosplitter.com"
    exit 1
fi

echo "📋 Configurando para dominio: $DOMAIN"
echo "📋 Panel estará en: dokploy.$DOMAIN"

# Verificar que estamos como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: Este script debe ejecutarse como root"
    echo "Usa: sudo ./dokploy-setup.sh $DOMAIN"
    exit 1
fi

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt update && apt upgrade -y

# Instalar herramientas básicas
echo "🛠 Instalando herramientas básicas..."
apt install -y curl wget git unzip htop ufw

# Configurar firewall básico
echo "🔒 Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Iniciar y habilitar Docker
systemctl start docker
systemctl enable docker

# Verificar Docker
echo "✅ Verificando Docker..."
docker --version

# Agregar usuario al grupo docker (si no es root)
if [ "$USER" != "root" ]; then
    usermod -aG docker $USER
fi

# Instalar Docker Compose (por si acaso)
echo "📦 Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar Docker Compose
docker-compose --version

# Configurar límites del sistema para video processing
echo "⚙️ Optimizando sistema para video processing..."

# Aumentar límites de archivos abiertos
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

# Configurar memoria virtual
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
sysctl -p

# Instalar ffmpeg globalmente (backup)
echo "🎬 Instalando FFmpeg..."
apt install -y ffmpeg

# Verificar ffmpeg
ffmpeg -version | head -1

# Crear directorio para datos de Dokploy
echo "📁 Preparando directorios..."
mkdir -p /etc/dokploy
mkdir -p /var/lib/dokploy

# Instalar Dokploy
echo "🚀 Instalando Dokploy..."
curl -sSL https://dokploy.com/install.sh | sh

# Esperar a que Dokploy esté listo
echo "⏳ Esperando a que Dokploy inicie..."
sleep 30

# Verificar que Dokploy está corriendo
if docker ps | grep -q dokploy; then
    echo "✅ Dokploy instalado correctamente"
else
    echo "❌ Error: Dokploy no está corriendo"
    echo "Verificando logs..."
    docker logs dokploy 2>/dev/null || echo "No se pueden obtener logs"
    exit 1
fi

# Configurar backup automático
echo "💾 Configurando backup automático..."
cat > /usr/local/bin/backup-dokploy.sh << 'EOF'
#!/bin/bash
# Backup de configuraciones de Dokploy
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de datos de Dokploy
docker exec dokploy_postgres pg_dumpall -U postgres > $BACKUP_DIR/dokploy_db_$DATE.sql

# Backup de configuraciones
tar -czf $BACKUP_DIR/dokploy_config_$DATE.tar.gz /etc/dokploy /var/lib/dokploy

# Mantener solo últimos 7 backups
find $BACKUP_DIR -name "dokploy_*" -mtime +7 -delete

echo "Backup completado: $DATE"
EOF

chmod +x /usr/local/bin/backup-dokploy.sh

# Agregar backup al crontab (diario a las 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-dokploy.sh") | crontab -

# Crear script de monitoreo
echo "📊 Configurando monitoreo..."
cat > /usr/local/bin/check-dokploy.sh << 'EOF'
#!/bin/bash
# Verificar que Dokploy está funcionando

if ! docker ps | grep -q dokploy; then
    echo "🔄 Dokploy no está corriendo, reiniciando..."
    docker start dokploy
    sleep 10
fi

# Verificar espacio en disco
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "⚠️ Advertencia: Uso de disco al $DISK_USAGE%"
fi

# Limpiar archivos temporales de Docker
docker system prune -f > /dev/null 2>&1
EOF

chmod +x /usr/local/bin/check-dokploy.sh

# Agregar monitoreo al crontab (cada 5 minutos)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/check-dokploy.sh") | crontab -

# Configurar limpieza de logs
echo "🧹 Configurando limpieza de logs..."
cat > /etc/logrotate.d/dokploy << EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size 10M
    missingok
    delaycompress
    copytruncate
}
EOF

# Obtener IP pública
PUBLIC_IP=$(curl -s ifconfig.me)

echo ""
echo "🎉 ¡Instalación de Dokploy completada!"
echo "====================================="
echo ""
echo "📋 Información importante:"
echo "🌐 IP del servidor: $PUBLIC_IP"
echo "🔗 Panel Dokploy: https://$PUBLIC_IP:3000"
echo "🔗 Con dominio: https://dokploy.$DOMAIN (después de configurar DNS)"
echo ""
echo "📋 Configuración DNS necesaria:"
echo "A Record: @ → $PUBLIC_IP"
echo "A Record: www → $PUBLIC_IP"
echo "A Record: dokploy → $PUBLIC_IP"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura DNS para $DOMAIN → $PUBLIC_IP"
echo "2. Espera propagación DNS (5-30 minutos)"
echo "3. Accede a https://$PUBLIC_IP:3000"
echo "4. Crea cuenta admin en Dokploy"
echo "5. Conecta GitHub repository"
echo "6. Deploy Video Splitter"
echo ""
echo "📊 Comandos útiles:"
echo "- Ver contenedores: docker ps"
echo "- Logs Dokploy: docker logs dokploy"
echo "- Reiniciar Dokploy: docker restart dokploy"
echo "- Estado sistema: htop"
echo ""
echo "🔐 Información de acceso:"
echo "- SSH: ssh root@$PUBLIC_IP"
echo "- Panel: https://$PUBLIC_IP:3000"
echo ""
echo "💰 Costo estimado: $12-15/mes"
echo "🎯 Tu Video Splitter estará disponible en: https://$DOMAIN"
echo ""

# Mostrar estado final
echo "📊 Estado de servicios:"
systemctl is-active docker
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🎯 ¡Setup completado exitosamente!"
echo "🚀 Accede a https://$PUBLIC_IP:3000 para configurar Dokploy"
