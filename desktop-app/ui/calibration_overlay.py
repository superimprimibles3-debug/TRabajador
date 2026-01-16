"""
Overlay de calibración de pantalla completa.
Idéntico al proceso de calibración de la extensión.
"""
from PyQt5.QtWidgets import QWidget, QLabel, QVBoxLayout
from PyQt5.QtCore import Qt, pyqtSignal, QPoint
from PyQt5.QtGui import QPainter, QColor, QPen, QFont
from typing import List, Tuple

class CalibrationOverlay(QWidget):
    """Overlay de pantalla completa para calibración de clicks"""
    
    # Señales
    calibration_complete = pyqtSignal(list)  # Lista de puntos (x, y)
    calibration_cancelled = pyqtSignal()
    
    def __init__(self, button_id: int, target_points: int = 3):
        super().__init__()
        self.button_id = button_id
        self.target_points = target_points
        self.points = []
        self.initUI()
    
    def initUI(self):
        """Inicializar overlay de pantalla completa"""
        # Ventana sin bordes, pantalla completa, siempre encima
        self.setWindowFlags(
            Qt.WindowStaysOnTopHint |
            Qt.FramelessWindowHint |
            Qt.Tool
        )
        
        # Fondo oscuro semi-transparente
        self.setAttribute(Qt.WA_TranslucentBackground)
        
        # Pantalla completa
        self.showFullScreen()
        
        # Cursor crosshair
        self.setCursor(Qt.CrossCursor)
        
        # Layout para instrucciones
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignCenter)
        self.setLayout(layout)
        
        # Contenedor de instrucciones
        self.instructions = QLabel()
        self.instructions.setStyleSheet("""
            QLabel {
                background: #1e293b;
                color: #fff;
                padding: 20px;
                border-radius: 12px;
                border: 2px solid #3b82f6;
                font-size: 14px;
            }
        """)
        self.instructions.setAlignment(Qt.AlignCenter)
        self.update_instructions()
        layout.addWidget(self.instructions)
        
        # Contador de puntos
        self.counter_label = QLabel(f"Puntos: 0 / {self.target_points}")
        self.counter_label.setStyleSheet("""
            QLabel {
                color: #fbbf24;
                font-size: 16px;
                font-weight: bold;
                background: transparent;
                margin-top: 10px;
            }
        """)
        self.counter_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.counter_label)
    
    def update_instructions(self):
        """Actualizar texto de instrucciones"""
        text = f"""
        <div style="text-align: center;">
            <h2 style="margin: 0 0 10px; color: #3b82f6;">CALIBRACIÓN BOTÓN {self.button_id}</h2>
            <p style="margin: 0 0 5px;">Haz CLICK sobre el botón {self.target_points} veces.</p>
            <p style="margin: 0 0 15px; font-size: 12px; color: #94a3b8;">Cada click será un punto de calibración.</p>
            <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px;">
                <span style="color: #22c55e;">ENTER</span> para Guardar
            </div>
            <div style="font-weight: bold; font-size: 18px; color: #ef4444;">
                ESC para Cancelar
            </div>
        </div>
        """
        self.instructions.setText(text)
    
    def mousePressEvent(self, event):
        """Capturar click del mouse"""
        if event.button() == Qt.LeftButton:
            # Obtener coordenadas globales de pantalla
            global_pos = event.globalPos()
            x = global_pos.x()
            y = global_pos.y()
            
            # Agregar punto
            self.points.append((x, y))
            
            # Actualizar contador
            self.counter_label.setText(f"Puntos: {len(self.points)} / {self.target_points}")
            
            # Cambiar color si se alcanzó el objetivo
            if len(self.points) >= self.target_points:
                self.counter_label.setStyleSheet("""
                    QLabel {
                        color: #10b981;
                        font-size: 16px;
                        font-weight: bold;
                        background: transparent;
                        margin-top: 10px;
                    }
                """)
                self.counter_label.setText(f"✅ {len(self.points)} puntos capturados - Presiona ENTER")
            
            # Forzar repintado para mostrar el punto
            self.update()
            
            print(f"📍 Punto capturado: ({x}, {y})")
    
    def keyPressEvent(self, event):
        """Capturar teclas"""
        if event.key() == Qt.Key_Return or event.key() == Qt.Key_Enter:
            # Guardar calibración
            if len(self.points) > 0:
                print(f"✅ Calibración completada: {len(self.points)} puntos")
                self.calibration_complete.emit(self.points)
                self.close()
            else:
                print("⚠️ No se capturaron puntos")
        
        elif event.key() == Qt.Key_Escape:
            # Cancelar calibración
            print("❌ Calibración cancelada")
            self.calibration_cancelled.emit()
            self.close()
    
    def paintEvent(self, event):
        """Dibujar overlay y puntos"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # Fondo oscuro semi-transparente
        painter.fillRect(self.rect(), QColor(0, 0, 0, 180))
        
        # Dibujar puntos capturados
        for x, y in self.points:
            # Convertir coordenadas globales a locales del widget
            local_point = self.mapFromGlobal(QPoint(x, y))
            
            # Punto verde
            painter.setBrush(QColor(34, 197, 94))  # #22c55e
            painter.setPen(QPen(QColor(255, 255, 255), 2))
            painter.drawEllipse(local_point, 5, 5)


class OCRCalibrationOverlay(QWidget):
    """Overlay para calibración de región OCR"""
    
    # Señales
    region_selected = pyqtSignal(dict)  # {x, y, width, height}
    selection_cancelled = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.start_point = None
        self.end_point = None
        self.is_drawing = False
        self.initUI()
    
    def initUI(self):
        """Inicializar overlay"""
        self.setWindowFlags(
            Qt.WindowStaysOnTopHint |
            Qt.FramelessWindowHint |
            Qt.Tool
        )
        
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.showFullScreen()
        self.setCursor(Qt.CrossCursor)
        
        # Layout para instrucciones
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignTop | Qt.AlignHCenter)
        self.setLayout(layout)
        
        # Instrucciones
        instructions = QLabel()
        instructions.setStyleSheet("""
            QLabel {
                background: #1e293b;
                color: #fff;
                padding: 20px;
                border-radius: 12px;
                border: 2px solid #22c55e;
                font-size: 14px;
                margin-top: 20px;
            }
        """)
        instructions.setText("""
        <div style="text-align: center;">
            <h2 style="margin: 0 0 10px; color: #22c55e;">🔍 CALIBRACIÓN OCR</h2>
            <p style="margin: 0 0 5px;">Dibuja un recuadro VERDE sobre el área del multiplicador.</p>
            <p style="margin: 0 0 15px; font-size: 12px; color: #94a3b8;">
                Arrastra el mouse para crear el rectángulo de captura.
            </p>
            <div style="font-weight: bold; font-size: 18px; color: #ef4444;">
                ESC para Cancelar
            </div>
        </div>
        """)
        layout.addWidget(instructions)
    
    def mousePressEvent(self, event):
        """Iniciar selección"""
        if event.button() == Qt.LeftButton:
            self.start_point = event.globalPos()
            self.is_drawing = True
    
    def mouseMoveEvent(self, event):
        """Actualizar selección mientras se arrastra"""
        if self.is_drawing:
            self.end_point = event.globalPos()
            self.update()
    
    def mouseReleaseEvent(self, event):
        """Finalizar selección"""
        if event.button() == Qt.LeftButton and self.is_drawing:
            self.end_point = event.globalPos()
            self.is_drawing = False
            
            # Calcular región
            x1 = min(self.start_point.x(), self.end_point.x())
            y1 = min(self.start_point.y(), self.end_point.y())
            x2 = max(self.start_point.x(), self.end_point.x())
            y2 = max(self.start_point.y(), self.end_point.y())
            
            width = x2 - x1
            height = y2 - y1
            
            # Validar tamaño mínimo
            if width > 20 and height > 10:
                region = {
                    'x': x1,
                    'y': y1,
                    'width': width,
                    'height': height
                }
                print(f"✅ Región OCR seleccionada: {region}")
                self.region_selected.emit(region)
                self.close()
            else:
                print("⚠️ Región muy pequeña, intenta de nuevo")
                self.start_point = None
                self.end_point = None
                self.update()
    
    def keyPressEvent(self, event):
        """Cancelar con ESC"""
        if event.key() == Qt.Key_Escape:
            print("❌ Selección OCR cancelada")
            self.selection_cancelled.emit()
            self.close()
    
    def paintEvent(self, event):
        """Dibujar overlay y rectángulo de selección"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # Fondo oscuro
        painter.fillRect(self.rect(), QColor(0, 0, 0, 180))
        
        # Dibujar rectángulo de selección si existe
        if self.start_point and self.end_point:
            # Convertir a coordenadas locales
            start_local = self.mapFromGlobal(self.start_point)
            end_local = self.mapFromGlobal(self.end_point)
            
            # Calcular rectángulo
            x = min(start_local.x(), end_local.x())
            y = min(start_local.y(), end_local.y())
            width = abs(end_local.x() - start_local.x())
            height = abs(end_local.y() - start_local.y())
            
            # Dibujar rectángulo verde
            painter.setPen(QPen(QColor(34, 197, 94), 3))  # #22c55e
            painter.setBrush(QColor(34, 197, 94, 50))
            painter.drawRect(x, y, width, height)
            
            # Mostrar dimensiones
            painter.setPen(QColor(255, 255, 255))
            painter.setFont(QFont("Arial", 12, QFont.Bold))
            painter.drawText(x + 5, y - 5, f"{width}x{height}")
