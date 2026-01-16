/**
 * SCRIPT DE DIAGNÓSTICO MANUAL PARA HIGH FLYER
 * 
 * INSTRUCCIONES:
 * 1. Abre High Flyer en el navegador
 * 2. Haz clic derecho en el juego → Inspeccionar
 * 3. Ve a la pestaña Console
 * 4. Copia y pega TODO este script
 * 5. Presiona Enter
 * 6. Comparte los resultados
 */

console.clear();
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-weight: bold');
console.log('%c🔍 DIAGNÓSTICO MANUAL - HIGH FLYER', 'color: #6366f1; font-weight: bold; font-size: 16px');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-weight: bold');

const results = {
    timestamp: new Date().toLocaleString(),
    url: window.location.href,
    frame: window.self === window.top ? 'PÁGINA PRINCIPAL' : 'IFRAME'
};

console.log('\n%c📍 INFORMACIÓN BÁSICA', 'color: #a855f7; font-weight: bold; font-size: 14px');
console.log('   URL:', results.url);
console.log('   Contexto:', results.frame);
console.log('   Fecha:', results.timestamp);

// 1. BUSCAR TODOS LOS INPUTS
console.log('\n%c1️⃣ ANÁLISIS DE INPUTS', 'color: #10b981; font-weight: bold; font-size: 14px');
const allInputs = document.querySelectorAll('input');
console.log(`   Total de inputs encontrados: ${allInputs.length}`);

if (allInputs.length > 0) {
    console.log('\n   📝 Detalles de cada input:');
    allInputs.forEach((input, i) => {
        console.log(`\n   Input #${i}:`);
        console.log('      Clase:', input.className || 'Sin clase');
        console.log('      Tipo:', input.type);
        console.log('      ID:', input.id || 'Sin ID');
        console.log('      Placeholder:', input.placeholder || 'Sin placeholder');
        console.log('      Valor actual:', input.value);
        console.log('      Name:', input.name || 'Sin name');
        console.log('      Selector sugerido:', input.className ? `input.${input.className.split(' ')[0]}` : `input[type="${input.type}"]`);
    });
    
    // Verificar selectores específicos
    console.log('\n   🎯 Verificando selectores documentados:');
    const arAvInputs = document.querySelectorAll('input.Ar_Av');
    console.log(`      input.Ar_Av: ${arAvInputs.length > 0 ? '✅ ENCONTRADO (' + arAvInputs.length + ')' : '❌ NO ENCONTRADO'}`);
    
    if (arAvInputs.length > 0) {
        console.log('\n      Valores actuales de input.Ar_Av:');
        arAvInputs.forEach((inp, i) => {
            console.log(`         [${i}] = "${inp.value}"`);
        });
    }
} else {
    console.log('   ❌ NO SE ENCONTRARON INPUTS');
}

// 2. BUSCAR TODOS LOS BOTONES
console.log('\n%c2️⃣ ANÁLISIS DE BOTONES', 'color: #10b981; font-weight: bold; font-size: 14px');
const allButtons = document.querySelectorAll('button');
console.log(`   Total de botones encontrados: ${allButtons.length}`);

if (allButtons.length > 0) {
    console.log('\n   🔘 Detalles de cada botón:');
    allButtons.forEach((btn, i) => {
        const text = btn.innerText || btn.textContent || '';
        console.log(`\n   Botón #${i}:`);
        console.log('      Clase:', btn.className || 'Sin clase');
        console.log('      ID:', btn.id || 'Sin ID');
        console.log('      Texto:', text.substring(0, 50));
        console.log('      Selector sugerido:', btn.className ? `button.${btn.className.split(' ')[0]}` : 'button');
    });
    
    // Verificar selectores específicos
    console.log('\n   🎯 Verificando selectores documentados:');
    const tuTvButtons = document.querySelectorAll('button.tu_tv');
    const tuTvTwButtons = document.querySelectorAll('button.tu_tv.tu_tw');
    console.log(`      button.tu_tv: ${tuTvButtons.length > 0 ? '✅ ENCONTRADO (' + tuTvButtons.length + ')' : '❌ NO ENCONTRADO'}`);
    console.log(`      button.tu_tv.tu_tw: ${tuTvTwButtons.length > 0 ? '✅ ENCONTRADO (' + tuTvTwButtons.length + ')' : '❌ NO ENCONTRADO'}`);
    
    if (tuTvTwButtons.length > 0) {
        console.log('\n      Textos de button.tu_tv.tu_tw:');
        tuTvTwButtons.forEach((btn, i) => {
            console.log(`         [${i}] = "${btn.innerText}"`);
        });
    }
} else {
    console.log('   ❌ NO SE ENCONTRARON BOTONES');
}

// 3. BUSCAR CONTENEDOR DE HISTORIAL
console.log('\n%c3️⃣ ANÁLISIS DE HISTORIAL', 'color: #10b981; font-weight: bold; font-size: 14px');
const historySelectors = [
    '.yA_yB',
    '[class*="history"]',
    '[class*="result"]',
    '[class*="multiplier"]',
    '[class*="yA"]',
    '[class*="yB"]'
];

console.log('   Probando selectores de historial:');
historySelectors.forEach(sel => {
    const found = document.querySelector(sel);
    console.log(`      ${sel}: ${found ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
    if (found) {
        console.log(`         Clase completa: ${found.className}`);
        console.log(`         Contenido (primeros 100 chars): ${found.innerText.substring(0, 100)}`);
    }
});

// 4. BUSCAR ELEMENTOS POR CLASES PARCIALES
console.log('\n%c4️⃣ BÚSQUEDA DE CLASES OFUSCADAS', 'color: #10b981; font-weight: bold; font-size: 14px');
const allElements = document.querySelectorAll('*');
const classPatterns = {
    'Ar_': [],
    'tu_': [],
    'yA_': [],
    'Ay_': [],
    'qp_': []
};

allElements.forEach(el => {
    if (el.className && typeof el.className === 'string') {
        Object.keys(classPatterns).forEach(pattern => {
            if (el.className.includes(pattern)) {
                const classes = el.className.split(' ').filter(c => c.includes(pattern));
                classes.forEach(c => {
                    if (!classPatterns[pattern].includes(c)) {
                        classPatterns[pattern].push(c);
                    }
                });
            }
        });
    }
});

console.log('   Clases encontradas por patrón:');
Object.keys(classPatterns).forEach(pattern => {
    if (classPatterns[pattern].length > 0) {
        console.log(`\n      Patrón "${pattern}": ✅ ${classPatterns[pattern].length} clases`);
        classPatterns[pattern].forEach(cls => {
            const count = document.querySelectorAll(`.${cls}`).length;
            console.log(`         .${cls} (${count} elementos)`);
        });
    } else {
        console.log(`      Patrón "${pattern}": ❌ No encontrado`);
    }
});

// 5. RESUMEN Y RECOMENDACIONES
console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-weight: bold');
console.log('%c📊 RESUMEN', 'color: #6366f1; font-weight: bold; font-size: 14px');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-weight: bold');

const summary = {
    inputs: allInputs.length,
    buttons: allButtons.length,
    inputArAv: document.querySelectorAll('input.Ar_Av').length,
    buttonTuTv: document.querySelectorAll('button.tu_tv.tu_tw').length,
    historyFound: !!document.querySelector('.yA_yB')
};

console.log('\n   Elementos encontrados:');
console.log(`      Inputs totales: ${summary.inputs}`);
console.log(`      Botones totales: ${summary.buttons}`);
console.log(`      input.Ar_Av: ${summary.inputArAv} ${summary.inputArAv === 4 ? '✅' : '⚠️'}`);
console.log(`      button.tu_tv.tu_tw: ${summary.buttonTuTv} ${summary.buttonTuTv === 2 ? '✅' : '⚠️'}`);
console.log(`      Historial (.yA_yB): ${summary.historyFound ? '✅' : '❌'}`);

console.log('\n%c💡 RECOMENDACIONES:', 'color: #fbbf24; font-weight: bold');

if (results.frame === 'PÁGINA PRINCIPAL') {
    console.log('%c   ⚠️ ESTÁS EN LA PÁGINA PRINCIPAL, NO EN EL IFRAME DEL JUEGO', 'color: #ef4444; font-weight: bold');
    console.log('   Haz clic derecho en el juego → Inspeccionar');
    console.log('   Luego ejecuta este script de nuevo en el iframe correcto');
} else if (summary.inputArAv === 4 && summary.buttonTuTv >= 2) {
    console.log('%c   ✅ TODOS LOS SELECTORES FUNCIONAN CORRECTAMENTE', 'color: #10b981; font-weight: bold');
    console.log('   Los selectores documentados son correctos.');
    console.log('   Si la extensión no funciona, el problema es otro (probablemente timing o eventos).');
} else {
    console.log('%c   ⚠️ LOS SELECTORES HAN CAMBIADO', 'color: #ef4444; font-weight: bold');
    console.log('   Revisa la sección "ANÁLISIS DE INPUTS" y "ANÁLISIS DE BOTONES" arriba');
    console.log('   Usa los "Selector sugerido" para actualizar content.js');
}

console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-weight: bold');
console.log('%c✅ DIAGNÓSTICO COMPLETADO', 'color: #10b981; font-weight: bold; font-size: 14px');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #6366f1; font-weight: bold');

// Retornar objeto con resultados
console.log('%c📋 Copia este resumen para compartir:', 'color: #94a3b8');
const finalReport = {
    url: results.url,
    frame: results.frame,
    inputs: summary.inputs,
    buttons: summary.buttons,
    selectorsStatus: {
        'input.Ar_Av': summary.inputArAv === 4 ? 'OK' : 'FAIL',
        'button.tu_tv.tu_tw': summary.buttonTuTv >= 2 ? 'OK' : 'FAIL',
        '.yA_yB': summary.historyFound ? 'OK' : 'FAIL'
    }
};

console.log(JSON.stringify(finalReport, null, 2));

finalReport;
