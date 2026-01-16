"""
Overlay Manager con diseño premium y animaciones suaves.
Calibración visual de alta calidad para el sistema Aviator Tracker.
"""
import sys
from PyQt5.QtWidgets import QApplication, QWidget, QLabel, QVBoxLayout, QGraphicsOpacityEffect
from PyQt5.QtCore import Qt, pyqtSignal, QPoint, QPropertyAnimation, QEasingCurve, QTimer
from PyQt5.QtGui import QPainter, QColor, QPen, QFont, QLinearGradient, QRadialGradient

class CalibrationOverlay(QWidget):
    """Overlay de pantalla completa con diseño premium para calibración de clicks"""
    
    calibration_complete = pyqtSignal(list)
    calibration_cancelled = pyqtSignal()
    
    def __init__(self, button_id: int, target_points: int = 3):
        super().__init__()
        self.button_id = button_id
        self.target_points = target_points
        self.points = []
        self.pulse_radius = 0
        self.pulse_timer = QTimer()
        self.pulse_timer.timeout.connect(self.animate_pulse)
        self.initUI()
    
    def initUI(self):
        # Removed Qt.Tool to avoid z-order issues
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.showFullScreen()
        self.setCursor(Qt.CrossCursor)
        
        # Ensure visibility
        self.raise_()
        self.activateWindow()
        
        # Layout central
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignCenter)
        layout.setContentsMargins(50, 50, 50, 50)
        self.setLayout(layout)
        
        # Panel de instrucciones con glassmorphism
        self.instructions = QLabel()
        self.instructions.setStyleSheet("""
            QLabel {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 rgba(30, 41, 59, 240),
                    stop:1 rgba(15, 23, 42, 240));
                color: #ffffff;
                padding: 30px 40px;
                border-radius: 20px;
                border: 2px solid rgba(59, 130, 246, 0.8);
                font-size: 16px;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-weight: 500;
            }
        """)
        self.instructions.setAlignment(Qt.AlignCenter)
        self.update_instructions()
        layout.addWidget(self.instructions)
        
        # Contador con efecto neon
        self.counter_label = QLabel(f"Puntos: 0 / {self.target_points}")
        self.counter_label.setStyleSheet("""
            QLabel {
                color: #fbbf24;
                font-size: 24px;
                font-weight: bold;
                font-family: 'Consolas', 'Courier New', monospace;
                margin-top: 20px;
                padding: 15px 30px;
                background: rgba(251, 191, 36, 0.1);
                border-radius: 12px;
                border: 2px solid rgba(251, 191, 36, 0.3);
            }
        """)
        self.counter_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.counter_label)
        
        # Efecto de fade-in al aparecer
        self.fade_in_animation()
    
    def fade_in_animation(self):
        """Animación de aparición suave"""
        effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(effect)
        
        self.animation = QPropertyAnimation(effect, b"opacity")
        self.animation.setDuration(400)
        self.animation.setStartValue(0)
        self.animation.setEndValue(1)
        self.animation.setEasingCurve(QEasingCurve.OutCubic)
        self.animation.start()
    
    def update_instructions(self):
        """Actualizar texto de instrucciones con formato HTML rico"""
        text = f"""
        <div style='text-align: center; line-height: 1.6;'>
            <h2 style='color: #3b82f6; margin: 0 0 15px 0; font-size: 28px; text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);'>
                🎯 CALIBRACIÓN BOTÓN {self.button_id}
            </h2>
            <p style='color: #e2e8f0; font-size: 16px; margin: 10px 0;'>
                Haz <b style='color: #10b981;'>CLICK</b> sobre el botón del juego <b>{self.target_points}</b> veces
            </p>
            <div style='margin-top: 20px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;'>
                <span style='color: #22c55e; font-weight: bold;'>ENTER</span> 
                <span style='color: #94a3b8;'>para Guardar</span>
                <span style='color: #64748b; margin: 0 10px;'>|</span>
                <span style='color: #ef4444; font-weight: bold;'>ESC</span> 
                <span style='color: #94a3b8;'>para Cancelar</span>
            </div>
        </div>
        """
        self.instructions.setText(text)
    
    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            global_pos = event.globalPos()
            self.points.append((global_pos.x(), global_pos.y()))
            
            # Actualizar contador con animación
            self.update_counter_with_animation()
            
            # Iniciar animación de pulso en el punto clickeado
            self.pulse_radius = 0
            self.pulse_center = global_pos
            self.pulse_timer.start(16)  # ~60 FPS
            
            self.update()
    
    def update_counter_with_animation(self):
        """Actualizar contador con efecto de escala"""
        count = len(self.points)
        
        if count >= self.target_points:
            self.counter_label.setText("✅ COMPLETO - Presiona ENTER")
            self.counter_label.setStyleSheet("""
                QLabel {
                    color: #22c55e;
                    font-size: 26px;
                    font-weight: bold;
                    font-family: 'Consolas', 'Courier New', monospace;
                    margin-top: 20px;
                    padding: 15px 30px;
                    background: rgba(34, 197, 94, 0.2);
                    border-radius: 12px;
                    border: 2px solid rgba(34, 197, 94, 0.6);
                    text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
                }
            """)
        else:
            self.counter_label.setText(f"Puntos: {count} / {self.target_points}")
    
    def animate_pulse(self):
        """Animar pulso expansivo en punto clickeado"""
        self.pulse_radius += 3
        if self.pulse_radius > 50:
            self.pulse_timer.stop()
        self.update()
    
    def keyPressEvent(self, event):
        if event.key() in [Qt.Key_Return, Qt.Key_Enter]:
            if self.points:
                self.calibration_complete.emit(self.points)
                self.fade_out_and_close()
        elif event.key() == Qt.Key_Escape:
            self.calibration_cancelled.emit()
            self.fade_out_and_close()
    
    def fade_out_and_close(self):
        """Cerrar con animación de fade-out"""
        effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(effect)
        
        self.close_animation = QPropertyAnimation(effect, b"opacity")
        self.close_animation.setDuration(300)
        self.close_animation.setStartValue(1)
        self.close_animation.setEndValue(0)
        self.close_animation.setEasingCurve(QEasingCurve.InCubic)
        self.close_animation.finished.connect(self.close)
        self.close_animation.start()
    
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # Fondo oscuro semi-transparente con gradiente
        gradient = QLinearGradient(0, 0, self.width(), self.height())
        gradient.setColorAt(0, QColor(0, 0, 0, 180))
        gradient.setColorAt(1, QColor(15, 23, 42, 200))
        painter.fillRect(self.rect(), gradient)
        
        # Dibujar puntos capturados con efecto glow
        for i, (x, y) in enumerate(self.points):
            local_point = self.mapFromGlobal(QPoint(x, y))
            
            # Glow exterior (radial gradient)
            glow_gradient = QRadialGradient(local_point, 20)
            glow_gradient.setColorAt(0, QColor(34, 197, 94, 150))
            glow_gradient.setColorAt(0.5, QColor(34, 197, 94, 80))
            glow_gradient.setColorAt(1, QColor(34, 197, 94, 0))
            painter.setBrush(glow_gradient)
            painter.setPen(Qt.NoPen)
            painter.drawEllipse(local_point, 20, 20)
            
            # Punto central sólido
            painter.setBrush(QColor(34, 197, 94))
            painter.setPen(QPen(QColor(255, 255, 255), 2))
            painter.drawEllipse(local_point, 8, 8)
            
            # Número del punto
            painter.setPen(QColor(255, 255, 255))
            font = QFont("Arial", 10, QFont.Bold)
            painter.setFont(font)
            painter.drawText(local_point.x() - 5, local_point.y() + 5, str(i + 1))
        
        # Dibujar pulso animado si está activo
        if self.pulse_timer.isActive() and hasattr(self, 'pulse_center'):
            local_pulse = self.mapFromGlobal(self.pulse_center)
            pulse_color = QColor(59, 130, 246, max(0, 200 - self.pulse_radius * 4))
            painter.setPen(QPen(pulse_color, 3))
            painter.setBrush(Qt.NoBrush)
            painter.drawEllipse(local_pulse, self.pulse_radius, self.pulse_radius)


class OCRCalibrationOverlay(QWidget):
    """Overlay premium para calibración de zona OCR con selección visual"""
    
    region_selected = pyqtSignal(dict)
    calibration_cancelled = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.start_point = None
        self.end_point = None
        self.is_drawing = False
        self.initUI()
    
    def initUI(self):
        # Removed Qt.Tool
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.showFullScreen()
        self.setCursor(Qt.CrossCursor)
        
        # Ensure visibility
        self.raise_()
        self.activateWindow()
        
        # Fade-in animation
        effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(effect)
        
        # Use self.animation to prevent GC
        self.animation = QPropertyAnimation(effect, b"opacity")
        self.animation.setDuration(400)
        self.animation.setStartValue(0)
        self.animation.setEndValue(1)
        self.animation.setEasingCurve(QEasingCurve.OutCubic)
        self.animation.start()
    
    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self.start_point = event.globalPos()
            self.is_drawing = True
    
    def mouseMoveEvent(self, event):
        if self.is_drawing:
            self.end_point = event.globalPos()
            self.update()
    
    def mouseReleaseEvent(self, event):
        if self.is_drawing and self.start_point and self.end_point:
            x = min(self.start_point.x(), self.end_point.x())
            y = min(self.start_point.y(), self.end_point.y())
            w = abs(self.start_point.x() - self.end_point.x())
            h = abs(self.start_point.y() - self.end_point.y())
            
            if w > 10 and h > 10:  # Mínimo tamaño válido
                self.region_selected.emit({"x": x, "y": y, "width": w, "height": h})
                self.fade_out_and_close()
    
    def keyPressEvent(self, event):
        if event.key() == Qt.Key_Escape:
            self.calibration_cancelled.emit()
            self.fade_out_and_close()
    
    def fade_out_and_close(self):
        """Cerrar con animación suave"""
        effect = QGraphicsOpacityEffect(self)
        self.setGraphicsEffect(effect)
        
        # Guardar referencia para evitar GC pre-maturo
        self.close_animation = QPropertyAnimation(effect, b"opacity")
        self.close_animation.setDuration(300)
        self.close_animation.setStartValue(1)
        self.close_animation.setEndValue(0)
        self.close_animation.setEasingCurve(QEasingCurve.InCubic)
        self.close_animation.finished.connect(self.close)
        self.close_animation.start()
    
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # Fondo oscuro con gradiente cyberpunk
        gradient = QLinearGradient(0, 0, self.width(), self.height())
        gradient.setColorAt(0, QColor(10, 10, 25, 200))  # Azul oscuro profundo
        gradient.setColorAt(0.5, QColor(15, 15, 35, 210))
        gradient.setColorAt(1, QColor(20, 10, 30, 200))  # Púrpura oscuro
        painter.fillRect(self.rect(), gradient)
        
        # EFECTO SCANLINES (líneas horizontales sutiles)
        scanline_pen = QPen(QColor(0, 255, 255, 8), 1)  # Cyan muy transparente
        painter.setPen(scanline_pen)
        for y in range(0, self.height(), 4):  # Cada 4px
            painter.drawLine(0, y, self.width(), y)
        
        # CUADRÍCULA TECH (Grid mejorado)
        grid_spacing = 50
        
        # Grid secundario (más sutil)
        grid_pen_secondary = QPen(QColor(0, 255, 255, 15), 1)  # Cyan muy sutil
        painter.setPen(grid_pen_secondary)
        for x in range(0, self.width(), grid_spacing // 2):
            painter.drawLine(x, 0, x, self.height())
        for y in range(0, self.height(), grid_spacing // 2):
            painter.drawLine(0, y, self.width(), y)
        
        # Grid principal (más visible)
        grid_pen = QPen(QColor(0, 255, 255, 40), 1)  # Cyan neón
        painter.setPen(grid_pen)
        for x in range(0, self.width(), grid_spacing):
            painter.drawLine(x, 0, x, self.height())
        for y in range(0, self.height(), grid_spacing):
            painter.drawLine(0, y, self.width(), y)
        
        # Cruz central NEÓN (referencia principal)
        center_x = self.width() // 2
        center_y = self.height() // 2
        
        # Glow de la cruz
        glow_pen = QPen(QColor(255, 0, 255, 30), 8)  # Magenta glow
        painter.setPen(glow_pen)
        painter.drawLine(center_x, 0, center_x, self.height())
        painter.drawLine(0, center_y, self.width(), center_y)
        
        # Cruz principal
        center_pen = QPen(QColor(255, 0, 255, 120), 2)  # Magenta neón
        painter.setPen(center_pen)
        painter.drawLine(center_x, 0, center_x, self.height())
        painter.drawLine(0, center_y, self.width(), center_y)
        
        # Marcadores de esquina (corner indicators)
        corner_size = 30
        corner_pen = QPen(QColor(0, 255, 255, 100), 3)
        painter.setPen(corner_pen)
        margin = 20
        
        # Esquinas de pantalla
        # Superior izquierda
        painter.drawLine(margin, margin, margin + corner_size, margin)
        painter.drawLine(margin, margin, margin, margin + corner_size)
        # Superior derecha
        painter.drawLine(self.width() - margin, margin, self.width() - margin - corner_size, margin)
        painter.drawLine(self.width() - margin, margin, self.width() - margin, margin + corner_size)
        # Inferior izquierda
        painter.drawLine(margin, self.height() - margin, margin + corner_size, self.height() - margin)
        painter.drawLine(margin, self.height() - margin, margin, self.height() - margin - corner_size)
        # Inferior derecha
        painter.drawLine(self.width() - margin, self.height() - margin, self.width() - margin - corner_size, self.height() - margin)
        painter.drawLine(self.width() - margin, self.height() - margin, self.width() - margin, self.height() - margin - corner_size)
        
        # Panel de instrucciones con estilo HUD
        painter.setPen(QColor(0, 255, 255))
        font = QFont("Consolas", 13, QFont.Bold)
        painter.setFont(font)
        
        instruction_text = "[ CALIBRACIÓN OCR ] Arrastra para seleccionar región | ESC = Cancelar"
        text_rect = painter.fontMetrics().boundingRect(instruction_text)
        text_x = (self.width() - text_rect.width()) // 2
        
        # Fondo del HUD con bordes neón
        bg_rect = text_rect.adjusted(-25, -12, 25, 12)
        bg_rect.moveTopLeft(QPoint(text_x - 25, 25))
        
        # Glow del panel
        painter.setBrush(QColor(0, 255, 255, 20))
        painter.setPen(QPen(QColor(0, 255, 255, 80), 4))
        painter.drawRoundedRect(bg_rect, 3, 3)
        
        # Panel sólido
        painter.setBrush(QColor(10, 15, 30, 240))
        painter.setPen(QPen(QColor(0, 255, 255, 180), 2))
        painter.drawRoundedRect(bg_rect, 3, 3)
        
        # Texto con efecto glow
        painter.setPen(QColor(0, 255, 255, 80))
        painter.drawText(text_x + 1, 48, instruction_text)
        painter.setPen(QColor(0, 255, 255))
        painter.drawText(text_x, 47, instruction_text)
        
        # Dibujar rectángulo de selección con estilo TECH
        if self.start_point and self.end_point:
            start = self.mapFromGlobal(self.start_point)
            end = self.mapFromGlobal(self.end_point)
            
            x = min(start.x(), end.x())
            y = min(start.y(), end.y())
            w = abs(start.x() - end.x())
            h = abs(start.y() - end.y())
            
            # Glow exterior (múltiples capas)
            for i in range(3, 0, -1):
                glow_pen = QPen(QColor(0, 255, 0, 30 * i), i * 3)
                painter.setPen(glow_pen)
                painter.setBrush(Qt.NoBrush)
                painter.drawRect(x - i, y - i, w + i*2, h + i*2)
            
            # Borde principal NEÓN VERDE
            painter.setPen(QPen(QColor(0, 255, 0, 200), 3))
            painter.setBrush(QColor(0, 255, 0, 25))
            painter.drawRect(x, y, w, h)
            
            # Líneas de escaneo animadas (efecto tech)
            scan_pen = QPen(QColor(0, 255, 0, 100), 1)
            painter.setPen(scan_pen)
            for i in range(0, h, 10):
                painter.drawLine(x, y + i, x + w, y + i)
            
            # Esquinas TECH (estilo HUD)
            corner_size = 25
            corner_pen = QPen(QColor(255, 0, 255, 220), 4)
            painter.setPen(corner_pen)
            
            # Superior izquierda
            painter.drawLine(x - 5, y - 5, x + corner_size, y - 5)
            painter.drawLine(x - 5, y - 5, x - 5, y + corner_size)
            # Superior derecha
            painter.drawLine(x + w + 5, y - 5, x + w - corner_size, y - 5)
            painter.drawLine(x + w + 5, y - 5, x + w + 5, y + corner_size)
            # Inferior izquierda
            painter.drawLine(x - 5, y + h + 5, x + corner_size, y + h + 5)
            painter.drawLine(x - 5, y + h + 5, x - 5, y + h - corner_size)
            # Inferior derecha
            painter.drawLine(x + w + 5, y + h + 5, x + w - corner_size, y + h + 5)
            painter.drawLine(x + w + 5, y + h + 5, x + w + 5, y + h - corner_size)
            
            # Panel de dimensiones estilo HUD
            if w > 60 and h > 40:
                painter.setPen(QColor(0, 255, 255))
                font = QFont("Consolas", 12, QFont.Bold)
                painter.setFont(font)
                
                dim_text = f"[ {w} × {h} px ]"
                dim_rect = painter.fontMetrics().boundingRect(dim_text)
                dim_x = x + (w - dim_rect.width()) // 2
                dim_y = y + (h - dim_rect.height()) // 2
                
                # Fondo del HUD de dimensiones
                bg = dim_rect.adjusted(-12, -6, 12, 6)
                bg.moveTopLeft(QPoint(dim_x - 12, dim_y - dim_rect.height() + 6))
                
                # Glow
                painter.setBrush(QColor(0, 255, 255, 30))
                painter.setPen(QPen(QColor(0, 255, 255, 100), 3))
                painter.drawRoundedRect(bg, 3, 3)
                
                # Panel
                painter.setBrush(QColor(10, 15, 30, 230))
                painter.setPen(QPen(QColor(0, 255, 255, 200), 2))
                painter.drawRoundedRect(bg, 3, 3)
                
                # Texto con glow
                painter.setPen(QColor(0, 255, 0, 100))
                painter.drawText(dim_x + 1, dim_y + 1, dim_text)
                painter.setPen(QColor(0, 255, 0))
                painter.drawText(dim_x, dim_y, dim_text)

