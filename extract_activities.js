import * as XLSX from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('servicos.xlsx');
const wb = XLSX.read(buf, {type:'buffer'});
const ws = wb.Sheets[wb.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(ws);
console.log(JSON.stringify(json, null, 2));
