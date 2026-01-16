import re

print("🎨 Mejorando CSS y ampliando inputs...")

# Leer HTML
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Mejorar CSS de inputs - ampliar ancho
content = content.replace(
    'width: 70px;',
    'width: 90px;'
)

# Mejorar estética de la sección
content = content.replace(
    '.strategy-param {',
    '''.strategy-param {
            font-size: 12px;
            line-height: 1.4;'''
)

# Guardar
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ CSS mejorado - inputs más anchos")
