#!/usr/bin/env python3
"""
Script para gerar ícones PWA a partir do logo APEX HUB
Redimensiona o logo para múltiplos tamanhos necessários para PWA
"""

from PIL import Image
import os

# Configuração de tamanhos de ícone
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
SOURCE_LOGO = "public/icons/apex-logo-source.png"
OUTPUT_DIR = "public/icons"

def generate_icons():
    """Gera ícones PWA em múltiplos tamanhos"""
    
    # Verificar se o logo fonte existe
    if not os.path.exists(SOURCE_LOGO):
        print(f"Erro: Logo fonte não encontrado em {SOURCE_LOGO}")
        return False
    
    try:
        # Abrir a imagem fonte
        img = Image.open(SOURCE_LOGO)
        
        # Converter para RGBA para garantir suporte a transparência
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        
        # Gerar ícones em cada tamanho
        for size in ICON_SIZES:
            # Redimensionar a imagem
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # Salvar como PNG
            output_path = os.path.join(OUTPUT_DIR, f"icon-{size}x{size}.png")
            resized.save(output_path, "PNG")
            print(f"✓ Gerado: {output_path} ({size}x{size}px)")
        
        # Gerar favicon.ico (32x32)
        favicon = img.resize((32, 32), Image.Resampling.LANCZOS)
        favicon.save(os.path.join(OUTPUT_DIR, "favicon.ico"), "ICO")
        print(f"✓ Gerado: {OUTPUT_DIR}/favicon.ico (32x32px)")
        
        print("\n✓ Todos os ícones PWA foram gerados com sucesso!")
        return True
        
    except Exception as e:
        print(f"Erro ao gerar ícones: {e}")
        return False

if __name__ == "__main__":
    generate_icons()
