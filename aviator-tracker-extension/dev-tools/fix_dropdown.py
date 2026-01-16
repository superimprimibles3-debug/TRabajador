print("🎨 Corrigiendo tamaño del menú desplegable...")

# Leer HTML
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y reemplazar el CSS del strategy-select
old_css = '''.strategy-select {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 6px;
            font-size: 12px;
        }'''

new_css = '''.strategy-select {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 6px;
            font-size: 12px;
            height: auto;
            max-height: 40px;
        }'''

content = content.replace(old_css, new_css)

# Guardar
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Menú desplegable corregido")
print("   - Altura máxima: 40px")
print("   - Ahora se verá compacto")
print("\n🔄 Recarga la extensión para ver los cambios")
