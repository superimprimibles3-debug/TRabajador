"""
Gestor de configuración para el servidor Python unificado.
Maneja la carga y guardado de configuraciones del usuario.
"""
import json
import os
from typing import Dict, Any, Optional

class ConfigManager:
    def __init__(self, config_path: str = "config.json"):
        self.config_path = config_path
        self.config = self._load_default_config()
        self.load()
    
    def _load_default_config(self) -> Dict[str, Any]:
        """Configuración por defecto"""
        return {
            "calibration": {
                "multiplier_region": None,
                "button1_points": [],
                "button2_points": [],
                "button3_points": [],
                "exp1_points": [],
                "exp2_points": []
            },
            "api": {
                "endpoint": "http://localhost:5000",
                "enabled": True
            },
            "ocr": {
                "interval_ms": 1000,
                "confidence_threshold": 0.7,
                "tesseract_path": r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                "debug": False
            },
            "overlay": {
                "color": "#22c55e",
                "opacity": 0.3,
                "enabled": True,
                "border_width": 3
            },
            "auto_click": {
                "enabled": False,
                "delay_ms": 100
            },
            "sniper": {
                "enabled": False,
                "target_multiplier": 2.0,
                "sound_enabled": True
            },
            "anti_afk": {
                "enabled": True,
                "interval_min": 2,
                "interval_max": 4
            }
        }
    
    def load(self) -> bool:
        """Cargar configuración desde archivo"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                    # Merge con default config para mantener nuevas claves
                    self._merge_config(self.config, loaded_config)
                print(f"✅ Configuración cargada desde {self.config_path}")
                return True
        except Exception as e:
            print(f"⚠️ Error cargando configuración: {e}")
        return False
    
    def save(self) -> bool:
        """Guardar configuración a archivo"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            print(f"💾 Configuración guardada en {self.config_path}")
            return True
        except Exception as e:
            print(f"❌ Error guardando configuración: {e}")
            return False
    
    def _merge_config(self, base: Dict, update: Dict):
        """Merge recursivo de configuraciones"""
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._merge_config(base[key], value)
            else:
                base[key] = value
    
    def get(self, path: str, default: Any = None) -> Any:
        """
        Obtener valor de configuración usando path con puntos.
        Ejemplo: config.get('calibration.multiplier_region.x')
        """
        keys = path.split('.')
        value = self.config
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        return value
    
    def set(self, path: str, value: Any):
        """
        Establecer valor de configuración usando path con puntos.
        Ejemplo: config.set('overlay.color', '#FF0000')
        """
        keys = path.split('.')
        target = self.config
        for key in keys[:-1]:
            if key not in target:
                target[key] = {}
            target = target[key]
        target[keys[-1]] = value
    
    def export_to_dict(self) -> Dict[str, Any]:
        """Exportar configuración completa como diccionario"""
        return self.config.copy()
    
    def import_from_dict(self, config_dict: Dict[str, Any]):
        """Importar configuración desde diccionario"""
        self._merge_config(self.config, config_dict)
        self.save()
