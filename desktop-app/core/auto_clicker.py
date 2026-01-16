"""
Sistema de auto-click para automatizar apuestas.
Realiza clicks en coordenadas específicas de la pantalla.
"""
import pyautogui
import time
from typing import Tuple, Optional

class AutoClicker:
    def __init__(self):
        # Configuración de seguridad de pyautogui
        pyautogui.FAILSAFE = True  # Mover mouse a esquina superior izquierda para abortar
        pyautogui.PAUSE = 0.1  # Pausa entre comandos
        
        self.enabled = False
        self.last_click_time = 0
        self.min_click_interval = 0.5  # Mínimo 500ms entre clicks
    
    def click_at(self, x: int, y: int, delay_ms: int = 100) -> bool:
        """
        Realizar click en coordenadas específicas.
        
        Args:
            x: Coordenada X
            y: Coordenada Y
            delay_ms: Delay antes del click en milisegundos
            
        Returns:
            True si el click fue exitoso
        """
        if not self.enabled:
            print("⚠️ Auto-click deshabilitado")
            return False
        
        # Verificar intervalo mínimo
        current_time = time.time()
        if current_time - self.last_click_time < self.min_click_interval:
            print("⚠️ Click muy rápido, esperando...")
            return False
        
        try:
            # Delay antes del click
            if delay_ms > 0:
                time.sleep(delay_ms / 1000.0)
            
            # Realizar click
            pyautogui.click(x, y)
            self.last_click_time = current_time
            
            print(f"🖱️ Click en ({x}, {y})")
            return True
            
        except Exception as e:
            print(f"❌ Error en auto-click: {e}")
            return False
    
    def move_to(self, x: int, y: int, duration: float = 0.2):
        """
        Mover mouse a coordenadas (sin click).
        
        Args:
            x: Coordenada X
            y: Coordenada Y
            duration: Duración del movimiento en segundos
        """
        try:
            pyautogui.moveTo(x, y, duration=duration)
            print(f"🖱️ Mouse movido a ({x}, {y})")
        except Exception as e:
            print(f"❌ Error moviendo mouse: {e}")
    
    def get_mouse_position(self) -> Tuple[int, int]:
        """Obtener posición actual del mouse"""
        return pyautogui.position()
    
    def enable(self):
        """Habilitar auto-click"""
        self.enabled = True
        print("✅ Auto-click habilitado")
    
    def disable(self):
        """Deshabilitar auto-click"""
        self.enabled = False
        print("⏸️ Auto-click deshabilitado")
    
    def set_min_interval(self, seconds: float):
        """Establecer intervalo mínimo entre clicks"""
        self.min_click_interval = seconds
        print(f"⏱️ Intervalo mínimo: {seconds}s")
    
    def click_sequence(self, positions: list, delay_between: int = 500):
        """
        Realizar secuencia de clicks.
        
        Args:
            positions: Lista de tuplas (x, y)
            delay_between: Delay entre clicks en ms
        """
        for x, y in positions:
            if self.click_at(x, y):
                time.sleep(delay_between / 1000.0)
