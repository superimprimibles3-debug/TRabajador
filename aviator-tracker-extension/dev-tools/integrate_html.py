import re

# Leer el archivo HTML
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# CSS a insertar antes de </style>
css_insert = """
        /* Strategies Section */
        .strategy-select {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 6px;
            font-size: 12px;
        }

        .strategy-config {
            background: rgba(0, 0, 0, 0.2);
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
        }

        .strategy-param {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 8px 0;
            font-size: 11px;
        }

        .strategy-param label {
            flex: 1;
        }

        .strategy-param input[type="number"] {
            width: 70px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 4px;
            padding: 4px;
            text-align: center;
        }

        .strategy-info {
            font-size: 10px;
            opacity: 0.7;
            margin-bottom: 8px;
            font-style: italic;
        }
"""

# Insertar CSS antes de </style>
html_content = html_content.replace('    </style>', css_insert + '    </style>')

# HTML a insertar (leer del snippet)
with open(r'd:\Trabajador\aviator-tracker-extension\strategies_html_snippet.txt', 'r', encoding='utf-8') as f:
    html_insert = f.read()

# Insertar HTML después de la sección Control Automático y antes de Historial
# Buscar el patrón: </div>\n    </div>\n\n    <!-- Historial
pattern = r'(        </div>\r?\n    </div>\r?\n)\r?\n(    <!-- Historial)'
replacement = r'\1\n' + html_insert + r'\n\2'
html_content = re.sub(pattern, replacement, html_content)

# Guardar el archivo modificado
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("✅ HTML actualizado correctamente")
