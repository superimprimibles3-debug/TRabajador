"""
Sistema de clicks en pantalla con jitter aleatorio y movimientos humanos.
Implementa el cluster randomization del PROJECT_MASTER_SPEC con easing curves.
"""
import pyautogui
import random
import time
from typing import List, Tuple, Optional
import math

# Configuración de seguridad
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.05

class ScreenClicker:
    """Gestor de clicks en pantalla con randomización avanzada y movimientos naturales"""
    
    def __init__(self):
        self.button1_points = []
        self.button2_points = []
        self.button3_points = []  # Para reload/F5
        self.last_click_time = 0
        self.min_click_interval = 0.3  # segundos
        self.click_count = 0
    
    def set_button_points(self, button_id: int, points: List[Tuple[int, int]]):
        """Guardar puntos de calibración para un botón"""
        if button_id == 1:
            self.button1_points = points
            print(f"✅ Botón 1 configurado con {len(points)} puntos")
        elif button_id == 2:
            self.button2_points = points
            print(f"✅ Botón 2 configurado con {len(points)} puntos")
        elif button_id == 3:
            self.button3_points = points
            print(f"✅ Botón 3 (Reload) configurado con {len(points)} puntos")
    
    def get_button_points(self, button_id: int) -> List[Tuple[int, int]]:
        """Obtener puntos calibrados de un botón"""
        if button_id == 1:
            return self.button1_points
        elif button_id == 2:
            return self.button2_points
        elif button_id == 3:
            return self.button3_points
        return []
    
    def _ease_out_quad(self, t: float) -> float:
        """Easing function para movimientos más naturales"""
        return t * (2 - t)
    
    def _ease_in_out_cubic(self, t: float) -> float:
        """Easing cúbico para movimientos suaves"""
        if t < 0.5:
            return 4 * t * t * t
        else:
            p = 2 * t - 2
            return 1 + p * p * p / 2
    
    def _human_curve(self, start_x: int, start_y: int, end_x: int, end_y: int, steps: int = 20) -> List[Tuple[int, int]]:
        """
        Genera una curva de movimiento humana con micro-variaciones.
        Simula el temblor natural de la mano.
        """
        points = []
        for i in range(steps + 1):
            t = i / steps
            
            # Aplicar easing
            eased_t = self._ease_in_out_cubic(t)
            
            # Interpolación base
            x = start_x + (end_x - start_x) * eased_t
            y = start_y + (end_y - start_y) * eased_t
            
            # Agregar micro-variaciones (temblor de mano)
            if 0 < i < steps:
                noise_x = random.uniform(-1.5, 1.5) * math.sin(t * math.pi)
                noise_y = random.uniform(-1.5, 1.5) * math.cos(t * math.pi)
                x += noise_x
                y += noise_y
            
            points.append((int(x), int(y)))
        
        return points
    
    def click_button(self, button_id: int, jitter: int = 4) -> bool:
        """
        Hacer click en un botón usando puntos calibrados con movimiento humano.
        
        Args:
            button_id: 1, 2, o 3
            jitter: Desviación aleatoria en píxeles (+/- jitter)
        
        Returns:
            True si el click fue exitoso
        """
        # Obtener puntos del botón
        points = self.get_button_points(button_id)
        
        if not points:
            print(f"❌ Botón {button_id} no calibrado")
            return False
        
        # Verificar intervalo mínimo (anti-detección)
        current_time = time.time()
        if current_time - self.last_click_time < self.min_click_interval:
            wait_time = self.min_click_interval - (current_time - self.last_click_time)
            time.sleep(wait_time)
        
        # Seleccionar punto aleatorio del cluster
        base_x, base_y = random.choice(points)
        
        # Aplicar jitter con distribución gaussiana (más natural)
        jitter_x = int(random.gauss(0, jitter / 2))
        jitter_y = int(random.gauss(0, jitter / 2))
        
        # Limitar jitter al rango especificado
        jitter_x = max(-jitter, min(jitter, jitter_x))
        jitter_y = max(-jitter, min(jitter, jitter_y))
        
        target_x = base_x + jitter_x
        target_y = base_y + jitter_y
        
        try:
            # Obtener posición actual del mouse
            current_x, current_y = pyautogui.position()
            
            # Generar curva de movimiento humana
            curve_points = self._human_curve(current_x, current_y, target_x, target_y, steps=random.randint(15, 25))
            
            # Mover mouse siguiendo la curva
            for point_x, point_y in curve_points:
                pyautogui.moveTo(point_x, point_y, duration=0)
                time.sleep(random.uniform(0.001, 0.003))  # Micro-delays
            
            # Pequeña pausa antes del click (humanización)
            time.sleep(random.uniform(0.05, 0.15))
            
            # Click con duración variable (presión del botón)
            pyautogui.mouseDown()
            time.sleep(random.uniform(0.06, 0.14))
            pyautogui.mouseUp()
            
            self.last_click_time = time.time()
            self.click_count += 1
            
            print(f"🖱️ Click #{self.click_count} en Botón {button_id}: ({target_x}, {target_y}) [jitter: ({jitter_x}, {jitter_y})]")
            return True
            
        except Exception as e:
            print(f"❌ Error al hacer click: {e}")
            return False
    
    def click_sequence(self, button_ids: List[int], delay_range: Tuple[int, int] = (100, 300)) -> bool:
        """
        Hacer una secuencia de clicks con delays variables (ej: Bet + Cancel para Anti-AFK)
        
        Args:
            button_ids: Lista de IDs de botones a clickear en orden
            delay_range: Rango de delay en milisegundos (min, max)
        
        Returns:
            True si todos los clicks fueron exitosos
        """
        for i, button_id in enumerate(button_ids):
            if not self.click_button(button_id):
                return False
            
            # Delay variable entre clicks (excepto después del último)
            if i < len(button_ids) - 1:
                delay_ms = random.randint(delay_range[0], delay_range[1])
                time.sleep(delay_ms / 1000.0)
        
        return True
    
    def click_at_position(self, x: int, y: int, jitter: int = 3) -> bool:
        """
        Hacer click en una posición específica con jitter y movimiento humano.
        
        Args:
            x, y: Coordenadas de pantalla
            jitter: Desviación aleatoria
        
        Returns:
            True si el click fue exitoso
        """
        # Aplicar jitter gaussiano
        jitter_x = int(random.gauss(0, jitter / 2))
        jitter_y = int(random.gauss(0, jitter / 2))
        
        jitter_x = max(-jitter, min(jitter, jitter_x))
        jitter_y = max(-jitter, min(jitter, jitter_y))
        
        final_x = x + jitter_x
        final_y = y + jitter_y
        
        try:
            current_x, current_y = pyautogui.position()
            curve_points = self._human_curve(current_x, current_y, final_x, final_y)
            
            for point_x, point_y in curve_points:
                pyautogui.moveTo(point_x, point_y, duration=0)
                time.sleep(random.uniform(0.001, 0.003))
            
            time.sleep(random.uniform(0.05, 0.12))
            
            pyautogui.mouseDown()
            time.sleep(random.uniform(0.06, 0.14))
            pyautogui.mouseUp()
            
            print(f"🖱️ Click en ({final_x}, {final_y})")
            return True
        except Exception as e:
            print(f"❌ Error al hacer click: {e}")
            return False
    
    def get_stats(self) -> dict:
        """Obtener estadísticas de clicks"""
        return {
            "total_clicks": self.click_count,
            "button1_calibrated": len(self.button1_points) > 0,
            "button2_calibrated": len(self.button2_points) > 0,
            "button3_calibrated": len(self.button3_points) > 0,
            "button1_points": len(self.button1_points),
            "button2_points": len(self.button2_points),
            "button3_points": len(self.button3_points)
        }
