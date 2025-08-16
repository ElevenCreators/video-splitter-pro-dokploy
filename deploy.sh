#!/bin/bash

echo "🚀 Video Splitter - Deploy Automático en Railway"
echo "================================================"

# Verificar si Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "📦 Instalando Railway CLI..."

    # Intentar con npm primero
    if command -v npm &> /dev/null; then
        npm install -g @railway/cli
    # Si npm falla, usar curl
    elif command -v curl &> /dev/null; then
        echo "📥 Usando instalador oficial..."
        curl -fsSL https://railway.app/install.sh | sh
    else
        echo "❌ Error: Necesitas npm o curl instalado"
        exit 1
    fi
fi

echo "🔐 Iniciando sesión en Railway..."
railway login

echo "🚀 Haciendo deploy..."
railway up

echo "✅ ¡Deploy completado!"
echo "🌐 Tu aplicación estará disponible en la URL que Railway te proporcionó"
echo "📱 Prueba subiendo un video pequeño para verificar que funciona"
