"""
Sistema de clicks en pantalla con jitter aleatorio.
Implementa el cluster randomization del PROJECT_MASTER_SPEC.
"""
import pyautogui
import random
import time
from typing import List, Tuple, Optional

# Configuración de seguridad
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.1

class ScreenClicker:
    """Gestor de clicks en pantalla con randomización"""
    
    def __init__(self):
        self.button1_points = []
        self.button2_points = []
        self.last_click_time = 0
        self.min_click_interval = 0.5  # segundos
    
    def set_button_points(self, button_id: int, points: List[Tuple[int, int]]):
        """Guardar puntos de calibración para un botón"""
        if button_id == 1:
            self.button1_points = points
            print(f"✅ Botón 1 configurado con {len(points)} puntos")
        elif button_id == 2:
            self.button2_points = points
            print(f"✅ Botón 2 configurado con {len(points)} puntos")
    
    def click_button(self, button_id: int, jitter: int = 3) -> bool:
        """
        Hacer click en un botón usando puntos calibrados.
        
        Args:
            button_id: 1 o 2
            jitter: Desviación aleatoria en píxeles (+/- jitter)
        
        Returns:
            True si el click fue exitoso
        """
        # Obtener puntos del botón
        points = self.button1_points if button_id == 1 else self.button2_points
        
        if not points:
            print(f"❌ Botón {button_id} no calibrado")
            return False
        
        # Verificar intervalo mínimo
        current_time = time.time()
        if current_time - self.last_click_time < self.min_click_interval:
            wait_time = self.min_click_interval - (current_time - self.last_click_time)
            time.sleep(wait_time)
        
        # Seleccionar punto aleatorio
        base_x, base_y = random.choice(points)
        
        # Aplicar jitter
        x = base_x + random.randint(-jitter, jitter)
        y = base_y + random.randint(-jitter, jitter)
        
        try:
            # Mover mouse y hacer click
            pyautogui.moveTo(x, y, duration=random.uniform(0.1, 0.3))
            pyautogui.click()
            
            self.last_click_time = time.time()
            print(f"🖱️ Click en Botón {button_id}: ({x}, {y})")
            return True
            
        except Exception as e:
            print(f"❌ Error al hacer click: {e}")
            return False
    
    def click_sequence(self, button_ids: List[int], delay_ms: int = 100) -> bool:
        """
        Hacer una secuencia de clicks (ej: Bet + Cancel para Anti-AFK)
        
        Args:
            button_ids: Lista de IDs de botones a clickear en orden
            delay_ms: Delay entre clicks en milisegundos
        
        Returns:
            True si todos los clicks fueron exitosos
        """
        for button_id in button_ids:
            if not self.click_button(button_id):
                return False
            time.sleep(delay_ms / 1000.0)
        
        return True
    
    def click_at_position(self, x: int, y: int, jitter: int = 3) -> bool:
        """
        Hacer click en una posición específica con jitter.
        
        Args:
            x, y: Coordenadas de pantalla
            jitter: Desviación aleatoria
        
        Returns:
            True si el click fue exitoso
        """
        # Aplicar jitter
        final_x = x + random.randint(-jitter, jitter)
        final_y = y + random.randint(-jitter, jitter)
        
        try:
            pyautogui.moveTo(final_x, final_y, duration=random.uniform(0.1, 0.3))
            pyautogui.click()
            print(f"🖱️ Click en ({final_x}, {final_y})")
            return True
        except Exception as e:
            print(f"❌ Error al hacer click: {e}")
            return False
