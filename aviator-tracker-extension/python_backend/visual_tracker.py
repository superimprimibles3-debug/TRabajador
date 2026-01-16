import pyautogui
import pytesseract
import time
import re
import os
import sys

# INTENTO DE CONFIGURACIÓN AUTOMÁTICA DE TESSERACT
# Si el usuario no lo tiene en el PATH, buscamos en rutas comunes de Windows
TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
else:
    # Intento en AppData (instalación de usuario)
    user_tesseract = os.path.join(os.environ['LOCALAPPDATA'], 'Programs', 'Tesseract-OCR', 'tesseract.exe')
    if os.path.exists(user_tesseract):
        pytesseract.pytesseract.tesseract_cmd = user_tesseract

import json

CONFIG_FILE = 'tracker_config.json'

def save_config(region):
    with open(CONFIG_FILE, 'w') as f:
        json.dump({'region': region}, f)
    print("Configuracion guardada.")

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f).get('region')
        except:
            return None
    return None

def calibrate_region():
    print("\n--- CALIBRACIÓN DE REGIÓN ---")
    print("Para que el OCR sea rápido, necesitamos saber dónde está el número.")
    print("Sigue estos pasos:")
    
    input("1. Coloca el mouse en la ESQUINA SUPERIOR IZQUIERDA del número y presiona ENTER...")
    x1, y1 = pyautogui.position()
    print(f"   -> Capturado: ({x1}, {y1})")
    
    input("2. Coloca el mouse en la ESQUINA INFERIOR DERECHA del número y presiona ENTER...")
    x2, y2 = pyautogui.position()
    print(f"   -> Capturado: ({x2}, {y2})")
    
    # Calcular width/height
    left = min(x1, x2)
    top = min(y1, y2)
    width = abs(x2 - x1)
    height = abs(y2 - y1)
    
    region = (left, top, width, height)
    print(f"✅ Región definida: {region}")
    save_config(region)
    return region

def find_multiplier_on_screen(region=None):
    """
    Captura la pantalla y busca un texto con formato de multiplicador (ej: 1.50x)
    """
    try:
        # Captura de pantalla (region=None captura todo)
        screenshot = pyautogui.screenshot(region=region)
        
        # OCR para convertir imagen a texto
        # --psm 7: Tratar la imagen como una sola línea de texto (mejor para números cortos)
        config_ocr = '--psm 7' if region else '--psm 6'
        text = pytesseract.image_to_string(screenshot, config=config_ocr)
        
        # DEBUG: Ver qué está leyendo (descomentar si hay problemas)
        # print(f"DEBUG OCR: '{text.strip()}'")
        
        # Buscar patrones de multiplicador
        matches = re.findall(r'(\d+[.,]\d+)\s*x|x\s*(\d+[.,]\d+)|^(\d+[.,]\d+)$', text, re.IGNORECASE)
        
        for match in matches:
            # Encontrar el grupo no vacío
            val_str = next((m for m in match if m), None)
            
            if val_str:
                val_str = val_str.replace(',', '.')
                try:
                    value = float(val_str)
                    return value
                except ValueError:
                    continue
                
        return None
        
    except pytesseract.TesseractNotFoundError:
        print("\nERROR CRITICO: Tesseract-OCR no encontrado.")
        sys.exit(1)
    except Exception as e:
        print(f"Error en lectura visual: {e}")
        return None

def main():
    print("==================================================")
    print("   [O] AVIATOR VISUAL TRACKER (OCR) ")
    print("==================================================")
    
    region = load_config()
    
    if region:
        print(f"📂 Región cargada: {region}")
        resp = input("¿Deseas recalibrar la zona? (s/n): ").lower()
        if resp == 's':
            region = calibrate_region()
    else:
        print("No hay region configurada.")
        region = calibrate_region()

    print("\nINICIANDO RASTREO VISUAL...")
    print("Presiona Ctrl+C para detener.")
    
    last_val = 0
    
    try:
        while True:
            val = find_multiplier_on_screen(region)
            
            if val and val != last_val:
                print(f"DETECTADO: {val:.2f}x")
                last_val = val
                
            time.sleep(0.2) # Más rápido si hay región definida
            
    except KeyboardInterrupt:
        print("\nDetenido por usuario.")

if __name__ == "__main__":
    main()
