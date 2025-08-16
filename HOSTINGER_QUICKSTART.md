# 🚀 Video Splitter → Hostinger VPS - Guía Rápida

## **💰 Costo Final: ~$12-15/mes vs Railway $50-100/mes**

---

## **Paso 1: Contratar Hostinger VPS** ⏱️ 5 minutos

1. **Ve a:** [hostinger.com/vps-hosting](https://hostinger.com/vps-hosting)
2. **Selecciona:** VPS 2 (4GB RAM, 2 vCPU) - ~$12-15/mes
3. **Sistema:** Ubuntu 22.04 LTS
4. **Configurar:** Usuario root + contraseña fuerte
5. **Anotar:** IP del servidor (ej: 123.45.67.89)

---

## **Paso 2: Configurar Dominio** ⏱️ 2 minutos

**Si tienes dominio:**
- DNS A Record: `@` → IP del VPS
- DNS A Record: `www` → IP del VPS

**Si NO tienes dominio:**
- Puedes usar la IP directamente por ahora
- O comprar dominio en Hostinger/Namecheap

---

## **Paso 3: Setup Automático** ⏱️ 15 minutos

### **3.1 Conectar al VPS:**
```bash
# Windows PowerShell / Mac Terminal
ssh root@TU_IP_DEL_VPS
# Introducir contraseña
```

### **3.2 Descargar y ejecutar script:**
```bash
# Descargar script de instalación
wget https://raw.githubusercontent.com/TU_USUARIO/video-splitter-pro/main/hostinger-setup.sh

# Hacer ejecutable
chmod +x hostinger-setup.sh

# Ejecutar setup automático
./hostinger-setup.sh TU_DOMINIO.com https://github.com/TU_USUARIO/video-splitter-pro.git
```

**El script hace TODO automáticamente:**
- ✅ Instala Node.js, Bun, FFmpeg
- ✅ Clona tu proyecto desde GitHub
- ✅ Configura Nginx
- ✅ Crea servicio systemd
- ✅ Configura firewall
- ✅ Setup limpieza automática

---

## **Paso 4: SSL Certificado** ⏱️ 2 minutos

**Esperar 5-30 minutos** para propagación DNS, luego:

```bash
# Instalar SSL gratuito
certbot --nginx -d TU_DOMINIO.com -d www.TU_DOMINIO.com
```

---

## **🎉 ¡LISTO! Tu Video Splitter está funcionando**

- **URL:** `https://TU_DOMINIO.com`
- **Costo:** $12-15/mes fijo
- **Performance:** Recursos dedicados
- **Control:** Total

---

## **📊 Comandos Útiles Post-Instalación**

### **Ver logs en tiempo real:**
```bash
journalctl -u video-splitter -f
```

### **Estado de servicios:**
```bash
systemctl status video-splitter nginx
```

### **Reiniciar aplicación:**
```bash
systemctl restart video-splitter
```

### **Actualizar código:**
```bash
cd /var/www/video-splitter-pro
git pull
bun install
bun run build
systemctl restart video-splitter
```

### **Ver uso de recursos:**
```bash
htop
```

---

## **🔧 Troubleshooting**

### **Si la app no arranca:**
```bash
# Ver logs detallados
journalctl -u video-splitter -n 50

# Verificar permisos
cd /var/www/video-splitter-pro
ls -la

# Reconstruir proyecto
bun install
bun run build
systemctl restart video-splitter
```

### **Si Nginx da error:**
```bash
# Probar configuración
nginx -t

# Ver logs de Nginx
tail -f /var/log/nginx/error.log
```

### **Si hay problemas con SSL:**
```bash
# Verificar DNS
dig TU_DOMINIO.com

# Renovar certificado
certbot renew --dry-run
```

---

## **📈 Optimizaciones Adicionales**

### **Monitoreo:**
```bash
# Instalar herramientas de monitoreo
apt install -y netdata

# Acceder en: http://TU_IP:19999
```

### **Backup automático:**
```bash
# Script de backup diario
echo '0 2 * * * tar -czf /root/backup-$(date +\%Y\%m\%d).tar.gz /var/www/video-splitter-pro' | crontab -
```

### **Actualizaciones automáticas:**
```bash
# Configurar actualizaciones automáticas
apt install -y unattended-upgrades
dpkg-reconfigure unattended-upgrades
```

---

## **🎯 Resultados Finales**

| Aspecto | Railway Pro | Hostinger VPS |
|---------|-------------|---------------|
| **Costo** | $50-100/mes | $12-15/mes |
| **Control** | Limitado | Total |
| **Performance** | Variable | Dedicado |
| **Escalabilidad** | Automática | Manual |
| **Setup** | Fácil | Script automatizado |

**💰 Ahorro: ~$35-85/mes ($420-1020/año)**

---

## **📞 Soporte**

**Si necesitas ayuda:**
1. **Logs:** Siempre revisa `journalctl -u video-splitter -f`
2. **Estado:** `systemctl status video-splitter nginx`
3. **Recursos:** `htop` para ver CPU/RAM
4. **Networking:** `ufw status` para firewall

---

**¡Tu Video Splitter ahora es 3-4x más económico con el mismo rendimiento!** 🚀
