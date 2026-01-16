"""
Ventana de overlay transparente que se superpone a la pantalla.
Muestra la máscara de calibración y feedback visual.
"""
from PyQt5.QtWidgets import QWidget
from PyQt5.QtCore import Qt, QRect, pyqtSignal
from PyQt5.QtGui import QPainter, QColor, QPen, QBrush
from typing import Optional, Dict

class OverlayWindow(QWidget):
    """Ventana transparente que muestra la máscara de captura"""
    
    # Señales
    region_updated = pyqtSignal(dict)  # Emitida cuando se actualiza la región
    
    def __init__(self, config: Dict):
        super().__init__()
        self.config = config
        self.capture_region = None
        self.is_capturing = False
        self.initUI()
    
    def initUI(self):
        """Inicializar la interfaz de usuario"""
        # Ventana sin bordes, siempre encima, transparente
        self.setWindowFlags(
            Qt.WindowStaysOnTopHint |
            Qt.FramelessWindowHint |
            Qt.Tool |
            Qt.WindowTransparentForInput  # Click-through
        )
        
        # Fondo transparente
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setAttribute(Qt.WA_TransparentForMouseEvents)
        
        # Pantalla completa
        self.showFullScreen()
        
        # Título de ventana
        self.setWindowTitle("Aviator Tracker - Overlay")
    
    def set_capture_region(self, x: int, y: int, width: int, height: int):
        """
        Establecer región de captura.
        
        Args:
            x: Coordenada X
            y: Coordenada Y
            width: Ancho
            height: Alto
        """
        self.capture_region = {
            'x': x,
            'y': y,
            'width': width,
            'height': height
        }
        self.update()  # Redibujar
        self.region_updated.emit(self.capture_region)
    
    def set_capturing(self, capturing: bool):
        """Establecer estado de captura (cambia color del overlay)"""
        self.is_capturing = capturing
        self.update()
    
    def paintEvent(self, event):
        """Dibujar el overlay"""
        if not self.capture_region:
            return
        
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # Obtener configuración de overlay
        color_hex = self.config.get('overlay', {}).get('color', '#00FF00')
        opacity = self.config.get('overlay', {}).get('opacity', 0.3)
        border_width = self.config.get('overlay', {}).get('border_width', 3)
        
        # Color cambia si está capturando
        if self.is_capturing:
            color = QColor("#00FF00")  # Verde cuando captura
        else:
            color = QColor(color_hex)  # Color configurado cuando no captura
        
        # Dibujar rectángulo de región
        rect = QRect(
            self.capture_region['x'],
            self.capture_region['y'],
            self.capture_region['width'],
            self.capture_region['height']
        )
        
        # Borde
        pen = QPen(color, border_width)
        painter.setPen(pen)
        
        # Relleno semi-transparente
        fill_color = QColor(color)
        fill_color.setAlphaF(opacity)
        brush = QBrush(fill_color)
        painter.setBrush(brush)
        
        # Dibujar
        painter.drawRect(rect)
        
        # Texto de estado (opcional)
        if self.is_capturing:
            painter.setPen(QPen(QColor("#FFFFFF")))
            painter.drawText(
                rect.x() + 10,
                rect.y() - 10,
                "🔍 Capturando..."
            )
    
    def clear_region(self):
        """Limpiar región de captura"""
        self.capture_region = None
        self.update()
    
    def toggle_visibility(self):
        """Alternar visibilidad del overlay"""
        if self.isVisible():
            self.hide()
        else:
            self.show()
