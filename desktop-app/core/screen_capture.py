"""
Motor de captura de pantalla usando MSS.
Captura regiones específicas de la pantalla de forma eficiente.
"""
import mss
import mss.tools
from PIL import Image
from typing import Tuple, Optional
import io

class ScreenCapture:
    def __init__(self):
        self.sct = mss.mss()
    
    def capture_region(self, x: int, y: int, width: int, height: int) -> Optional[Image.Image]:
        """
        Captura una región específica de la pantalla.
        
        Args:
            x: Coordenada X de la esquina superior izquierda
            y: Coordenada Y de la esquina superior izquierda
            width: Ancho de la región
            height: Alto de la región
            
        Returns:
            PIL Image o None si hay error
        """
        try:
            # Definir región de captura
            monitor = {
                "top": y,
                "left": x,
                "width": width,
                "height": height
            }
            
            # Capturar
            screenshot = self.sct.grab(monitor)
            
            # Convertir a PIL Image
            img = Image.frombytes(
                'RGB',
                (screenshot.width, screenshot.height),
                screenshot.rgb
            )
            
            return img
            
        except Exception as e:
            print(f"❌ Error capturando región: {e}")
            return None
    
    def get_monitor_info(self) -> list:
        """Obtener información de todos los monitores"""
        return self.sct.monitors
    
    def capture_full_screen(self, monitor_number: int = 1) -> Optional[Image.Image]:
        """
        Captura pantalla completa de un monitor específico.
        
        Args:
            monitor_number: Número de monitor (1 = primario)
        """
        try:
            screenshot = self.sct.grab(self.sct.monitors[monitor_number])
            img = Image.frombytes(
                'RGB',
                (screenshot.width, screenshot.height),
                screenshot.rgb
            )
            return img
        except Exception as e:
            print(f"❌ Error capturando pantalla completa: {e}")
            return None
    
    def save_capture(self, img: Image.Image, filename: str):
        """Guardar captura a archivo"""
        try:
            img.save(filename)
            print(f"✅ Captura guardada: {filename}")
        except Exception as e:
            print(f"❌ Error guardando captura: {e}")
    
    def __del__(self):
        """Cerrar MSS al destruir el objeto"""
        if hasattr(self, 'sct'):
            self.sct.close()
