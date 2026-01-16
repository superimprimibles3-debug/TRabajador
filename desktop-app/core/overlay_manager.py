import sys
from PyQt5.QtWidgets import QApplication, QWidget, QLabel, QVBoxLayout
from PyQt5.QtCore import Qt, pyqtSignal, QPoint
from PyQt5.QtGui import QPainter, QColor, QPen, QFont

class CalibrationOverlay(QWidget):
    """Overlay de pantalla completa para calibración de clicks sin usar el DOM"""
    
    calibration_complete = pyqtSignal(list)
    calibration_cancelled = pyqtSignal()
    
    def __init__(self, button_id: int, target_points: int = 3):
        super().__init__()
        self.button_id = button_id
        self.target_points = target_points
        self.points = []
        self.initUI()
    
    def initUI(self):
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.showFullScreen()
        self.setCursor(Qt.CrossCursor)
        
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignCenter)
        self.setLayout(layout)
        
        self.instructions = QLabel()
        self.instructions.setStyleSheet("background: #1e293b; color: #fff; padding: 20px; border-radius: 12px; border: 2px solid #3b82f6; font-size: 14px;")
        self.instructions.setAlignment(Qt.AlignCenter)
        self.update_instructions()
        layout.addWidget(self.instructions)
        
        self.counter_label = QLabel(f"Puntos: 0 / {self.target_points}")
        self.counter_label.setStyleSheet("color: #fbbf24; font-size: 16px; font-weight: bold; margin-top: 10px;")
        layout.addWidget(self.counter_label)
    
    def update_instructions(self):
        text = f"<div style='text-align: center;'><h2 style='color: #3b82f6;'>CALIBRACIÓN BOTÓN {self.button_id}</h2><p>Haz CLICK sobre el botón del juego {self.target_points} veces.</p><b>ENTER</b> para Guardar | <b>ESC</b> para Cancelar</div>"
        self.instructions.setText(text)
    
    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            global_pos = event.globalPos()
            self.points.append((global_pos.x(), global_pos.y()))
            self.counter_label.setText(f"Puntos: {len(self.points)} / {self.target_points}")
            if len(self.points) >= self.target_points:
                self.counter_label.setText("✅ Capturados - Presiona ENTER")
            self.update()

    def keyPressEvent(self, event):
        if event.key() in [Qt.Key_Return, Qt.Key_Enter]:
            if self.points:
                self.calibration_complete.emit(self.points)
                self.close()
        elif event.key() == Qt.Key_Escape:
            self.calibration_cancelled.emit()
            self.close()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.fillRect(self.rect(), QColor(0, 0, 0, 180))
        painter.setBrush(QColor(34, 197, 94))
        painter.setPen(QPen(Qt.white, 2))
        for x, y in self.points:
            local_point = self.mapFromGlobal(QPoint(x, y))
            painter.drawEllipse(local_point, 6, 6)

class OCRCalibrationOverlay(QWidget):
    """Overlay para calibración de zona OCR con Python nativo"""
    region_selected = pyqtSignal(dict)
    
    def __init__(self):
        super().__init__()
        self.start_point = None
        self.end_point = None
        self.is_drawing = False
        self.initUI()
        
    def initUI(self):
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.showFullScreen()
        self.setCursor(Qt.CrossCursor)

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
            self.region_selected.emit({"x": x, "y": y, "width": w, "height": h})
            self.close()

    def keyPressEvent(self, event):
        if event.key() == Qt.Key_Escape: self.close()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.fillRect(self.rect(), QColor(0, 0, 0, 160))
        if self.start_point and self.end_point:
            start = self.mapFromGlobal(self.start_point)
            end = self.mapFromGlobal(self.end_point)
            rect = QPoint(min(start.x(), end.x()), min(start.y(), end.y()))
            w, h = abs(start.x() - end.x()), abs(start.y() - end.y())
            painter.setPen(QPen(QColor(34, 197, 94), 2))
            painter.setBrush(QColor(34, 197, 94, 50))
            painter.drawRect(rect.x(), rect.y(), w, h)
