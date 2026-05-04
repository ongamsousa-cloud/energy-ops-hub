import * as XLSX from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('servicos.xlsx');
const wb = XLSX.read(buf, {type:'buffer'});
const ws = wb.Sheets[wb.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(ws);

let currentCategory = 'Geral';
const categories = new Set();
const activities = [];

for (const row of json) {
    if (row['__EMPTY'] && !row['4.    TABELA DE ATIVIDADES:']) {
        currentCategory = row['__EMPTY'].trim();
        categories.add(currentCategory);
        continue;
    }
    
    if (row['__EMPTY'] === 'tipo de atividade') continue;

    const codigo = row['4.    TABELA DE ATIVIDADES:'];
    const descricao = row['__EMPTY_1'];
    const unidade = row['__EMPTY_2'] || 'Unidade';
    const umd = parseFloat(String(row['__EMPTY_3'] || '0').replace(',', '.'));

    if (row['__EMPTY'] && row['4.    TABELA DE ATIVIDADES:']) {
        currentCategory = row['__EMPTY'].trim();
        categories.add(currentCategory);
    }

    if (codigo && descricao) {
        activities.push({
            codigo_item: String(codigo),
            descricao,
            unidade,
            umd_unitaria: umd,
            categoria_nome: currentCategory
        });
    }
}

let sql = '-- Categorias\n';
for (const cat of categories) {
    sql += `INSERT INTO public.categorias (nome) VALUES ('${cat.replace(/'/g, "''")}') ON CONFLICT (nome) DO NOTHING;\n`;
}

sql += '\n-- Atividades\n';
for (const act of activities) {
    sql += `INSERT INTO public.atividades (categoria_id, codigo_item, descricao, unidade, umd_unitaria) 
    SELECT id, '${act.codigo_item}', '${act.descricao.replace(/'/g, "''")}', '${act.unidade}', ${act.umd_unitaria} 
    FROM public.categorias WHERE nome = '${act.categoria_nome.replace(/'/g, "''")}'
    ON CONFLICT (codigo_item) DO UPDATE SET 
    descricao = EXCLUDED.descricao,
    unidade = EXCLUDED.unidade,
    umd_unitaria = EXCLUDED.umd_unitaria;\n`;
}
fs.writeFileSync('final_activities.sql', sql);
