"""
Motor OCR para extracción de multiplicadores.
Procesa imágenes y extrae valores numéricos usando Tesseract.
"""
import pytesseract
import cv2
import numpy as np
from PIL import Image
import re
from typing import Optional, Tuple
import os

class OCREngine:
    def __init__(self, tesseract_path: Optional[str] = None):
        """
        Inicializar motor OCR.
        
        Args:
            tesseract_path: Ruta al ejecutable de Tesseract (opcional)
        """
        if tesseract_path and os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        self.debug_mode = False
        self.debug_counter = 0
    
    def enable_debug(self, enabled: bool = True):
        """Activar modo debug para guardar imágenes procesadas"""
        self.debug_mode = enabled
        if enabled:
            os.makedirs("debug_ocr", exist_ok=True)
    
    def preprocess_image(self, img: Image.Image) -> np.ndarray:
        """
        Preprocesar imagen para mejorar OCR.
        
        Args:
            img: Imagen PIL
            
        Returns:
            Imagen procesada como array numpy
        """
        # Convertir PIL a OpenCV
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        # Convertir a escala de grises
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # Aumentar contraste
        gray = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)
        
        # Binarización adaptativa
        binary = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )
        
        # Invertir si el fondo es oscuro
        if np.mean(binary) < 127:
            binary = cv2.bitwise_not(binary)
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(binary, None, 10, 7, 21)
        
        # Dilatar ligeramente para unir caracteres
        kernel = np.ones((2, 2), np.uint8)
        processed = cv2.dilate(denoised, kernel, iterations=1)
        
        # Guardar para debug
        if self.debug_mode:
            debug_path = f"debug_ocr/processed_{self.debug_counter}.png"
            cv2.imwrite(debug_path, processed)
            self.debug_counter += 1
        
        return processed
    
    def extract_multiplier(self, img: Image.Image) -> Optional[Tuple[float, float]]:
        """
        Extraer multiplicador de la imagen.
        
        Args:
            img: Imagen PIL de la región del multiplicador
            
        Returns:
            Tupla (multiplicador, confianza) o None si no se detecta
        """
        try:
            # Preprocesar
            processed = self.preprocess_image(img)
            
            # Configuración de Tesseract para números
            custom_config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789.x'
            
            # Extraer texto
            text = pytesseract.image_to_string(
                processed,
                config=custom_config
            ).strip()
            
            # Obtener confianza
            try:
                data = pytesseract.image_to_data(
                    processed,
                    config=custom_config,
                    output_type=pytesseract.Output.DICT
                )
                confidences = [int(conf) for conf in data['conf'] if conf != '-1']
                avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            except:
                avg_confidence = 0
            
            # Parsear multiplicador
            multiplier = self._parse_multiplier(text)
            
            if multiplier:
                confidence = avg_confidence / 100.0
                print(f"📊 OCR: {text} → {multiplier}x (confianza: {confidence:.2f})")
                return (multiplier, confidence)
            
            return None
            
        except Exception as e:
            print(f"❌ Error en OCR: {e}")
            return None
    
    def _parse_multiplier(self, text: str) -> Optional[float]:
        """
        Parsear texto a valor de multiplicador.
        
        Args:
            text: Texto extraído por OCR
            
        Returns:
            Valor float del multiplicador o None
        """
        # Limpiar texto
        text = text.replace(' ', '').replace(',', '.')
        
        # Buscar patrón de multiplicador (ej: "2.45x", "2.45", "245")
        patterns = [
            r'(\d+\.\d+)x?',  # 2.45x o 2.45
            r'(\d+)x',         # 2x
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    value = float(match.group(1))
                    # Validar rango razonable (1.00 - 1000.00)
                    if 1.0 <= value <= 1000.0:
                        return value
                except ValueError:
                    continue
        
        return None
    
    def test_ocr(self, img: Image.Image) -> str:
        """
        Probar OCR en imagen sin procesamiento especial.
        Útil para debugging.
        """
        try:
            text = pytesseract.image_to_string(img)
            return text.strip()
        except Exception as e:
            return f"Error: {e}"
