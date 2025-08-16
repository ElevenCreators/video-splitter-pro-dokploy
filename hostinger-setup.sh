#!/bin/bash

echo "🚀 Video Splitter - Hostinger VPS Setup Script"
echo "=============================================="

# Variables
DOMAIN=${1:-""}
GITHUB_REPO=${2:-""}

if [ -z "$DOMAIN" ] || [ -z "$GITHUB_REPO" ]; then
    echo "❌ Error: Faltan parámetros"
    echo "Usage: ./hostinger-setup.sh TU_DOMINIO.com https://github.com/TU_USUARIO/video-splitter-pro.git"
    exit 1
fi

echo "📋 Configurando para dominio: $DOMAIN"
echo "📋 Repositorio: $GITHUB_REPO"

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt update && apt upgrade -y

# Instalar herramientas básicas
echo "🛠 Instalando herramientas básicas..."
apt install -y curl wget git unzip htop nginx ufw

# Instalar Node.js 18
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar Bun
echo "📦 Instalando Bun..."
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
export PATH="$HOME/.bun/bin:$PATH"

# Instalar FFmpeg
echo "🎬 Instalando FFmpeg..."
apt install -y ffmpeg

# Verificar instalaciones
echo "✅ Verificando instalaciones..."
node --version
/root/.bun/bin/bun --version
ffmpeg -version | head -1

# Clonar proyecto
echo "📂 Clonando proyecto..."
cd /var/www
rm -rf video-splitter-pro
git clone $GITHUB_REPO video-splitter-pro
cd video-splitter-pro

# Instalar dependencias
echo "📦 Instalando dependencias..."
/root/.bun/bin/bun install

# Crear archivo de variables de entorno
echo "⚙️ Configurando variables de entorno..."
cat > .env.local << EOF
NODE_ENV=production
PORT=3000
MAX_FILE_SIZE=2147483648
FFMPEG_THREADS=2
SEGMENT_TIMEOUT=600
TEMP_CLEANUP_INTERVAL=300
EOF

# Construir proyecto
echo "🔨 Construyendo proyecto..."
/root/.bun/bin/bun run build

# Crear directorio temporal
echo "📁 Creando directorio temporal..."
mkdir -p temp
chmod 755 temp

# Configurar Nginx
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/video-splitter << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 2G;
    client_body_timeout 300s;
    proxy_read_timeout 300s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Activar configuración de Nginx
ln -sf /etc/nginx/sites-available/video-splitter /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Probar configuración de Nginx
nginx -t

# Crear servicio systemd
echo "⚙️ Configurando servicio systemd..."
cat > /etc/systemd/system/video-splitter.service << EOF
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
EOF

# Activar y iniciar servicios
systemctl daemon-reload
systemctl enable video-splitter
systemctl start video-splitter
systemctl restart nginx

# Configurar firewall
echo "🔒 Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Crear script de limpieza temporal
echo "🧹 Configurando limpieza automática..."
cat > /usr/local/bin/cleanup-temp.sh << 'EOF'
#!/bin/bash
find /var/www/video-splitter-pro/temp -type f -mmin +60 -delete
EOF

chmod +x /usr/local/bin/cleanup-temp.sh

# Agregar crontab para limpieza
(crontab -l 2>/dev/null; echo "*/30 * * * * /usr/local/bin/cleanup-temp.sh") | crontab -

# Instalar Certbot para SSL
echo "🔐 Instalando Certbot para SSL..."
apt install -y certbot python3-certbot-nginx

echo ""
echo "🎉 ¡Instalación completada!"
echo "================================"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura tu DNS para apuntar $DOMAIN a esta IP: $(curl -s ifconfig.me)"
echo "2. Espera propagación DNS (5-30 minutos)"
echo "3. Ejecuta SSL: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "4. Visita: https://$DOMAIN"
echo ""
echo "📊 Comandos útiles:"
echo "- Ver logs: journalctl -u video-splitter -f"
echo "- Estado: systemctl status video-splitter"
echo "- Reiniciar: systemctl restart video-splitter"
echo ""
echo "🌐 Tu Video Splitter estará disponible en: http://$DOMAIN"
echo "💰 Costo: ~$12-15/mes vs Railway $50-100/mes"
echo ""

# Mostrar estado final
echo "📊 Estado de servicios:"
systemctl is-active video-splitter nginx

echo "🎯 ¡Setup completado exitosamente!"
