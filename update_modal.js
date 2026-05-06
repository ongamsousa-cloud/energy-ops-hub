const fs = require('fs');
let content = fs.readFileSync('src/components/professional/ProfessionalModal.tsx', 'utf8');

// Add import
if (!content.includes('maskCPF')) {
  content = content.replace(
    'import { Textarea } from "@/components/ui/textarea";',
    'import { Textarea } from "@/components/ui/textarea";\nimport { maskCPF, maskPhone } from "@/lib/utils/masks";'
  );
}

// Update phone input
content = content.replace(
  '<Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />',
  '<Input \n                         value={form.telefone} \n                         onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} \n                         placeholder="+55 (00) 00000-0000" \n                       />'
);

// Update CPF input
content = content.replace(
  '<Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />',
  '<Input \n                         value={form.cpf} \n                         onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} \n                         placeholder="000.000.000-00" \n                       />'
);

// Ensure padding/spacing (respiros)
content = content.replace('className="p-[20px] pb-2 border-b bg-muted/30"', 'className="p-6 pb-4 border-b bg-muted/30"');
content = content.replace('className="p-[20px] grid grid-cols-1 md:grid-cols-12 gap-6"', 'className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8"');
content = content.replace('className="p-[15px] border-t bg-muted/30"', 'className="p-6 border-t bg-muted/30"');

fs.writeFileSync('src/components/professional/ProfessionalModal.tsx', content);
