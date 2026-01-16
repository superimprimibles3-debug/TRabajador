print("📏 Ampliando campos de Multiestrategia Pro...")

# Leer HTML
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Ampliar input-inline de 45px a 65px
content = content.replace('width: 45px;', 'width: 65px;')

# Guardar
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Campos ampliados de 45px a 65px")
print("✅ Ahora los números se verán completos en Multiestrategia Pro")
print("\n🔄 Recarga la extensión para ver los cambios")
