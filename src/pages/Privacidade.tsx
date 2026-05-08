import { Shield, Lock, Eye, FileText, UserCheck, Trash2, Mail, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Privacidade() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Política de Privacidade</h1>
        <p className="text-muted-foreground">Última atualização: 08 de Maio de 2026</p>
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Introdução
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais ao utilizar nosso sistema de gestão de operações. Estamos comprometidos em garantir a privacidade e a segurança dos seus dados em conformidade com a Lei Geral de Proteção de Dados (LGPD).
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">1. Dados Coletados</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                <li><span className="font-semibold text-foreground">Identificação:</span> Nome completo, CPF, RG e foto de perfil.</li>
                <li><span className="font-semibold text-foreground">Contato:</span> Endereço de e-mail e número de telefone.</li>
                <li><span className="font-semibold text-foreground">Profissional:</span> Cargo, especialidade, departamento e equipe.</li>
                <li><span className="font-semibold text-foreground">Operacional:</span> Localização GPS (apenas durante a execução de serviços), logs de atividade e mensagens no chat interno.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">2. Finalidade do Tratamento</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                <li><span className="font-semibold text-foreground">Gestão Operacional:</span> Atribuição de ordens de serviço, controle de equipes e monitoramento de execução em campo.</li>
                <li><span className="font-semibold text-foreground">Comunicação:</span> Notificações sobre atualizações de OS e mensagens entre membros da equipe.</li>
                <li><span className="font-semibold text-foreground">Auditoria e Segurança:</span> Registro de alterações para auditoria (Audit Log) e comprovação técnica via evidências (fotos/vídeos).</li>
                <li><span className="font-semibold text-foreground">Autenticação:</span> Controle de acesso seguro ao sistema.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">3. Base Legal</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
              O tratamento dos seus dados fundamenta-se nas seguintes bases legais:
              <ul className="mt-2 space-y-1">
                <li>• <span className="font-semibold text-foreground">Execução de Contrato:</span> Necessário para a prestação dos serviços contratados.</li>
                <li>• <span className="font-semibold text-foreground">Interesse Legítimo:</span> Para melhoria da segurança e eficiência operacional do sistema.</li>
                <li>• <span className="font-semibold text-foreground">Cumprimento de Obrigação Legal:</span> Manutenção de registros conforme exigido pela legislação brasileira.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">4. Compartilhamento e Armazenamento</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-4 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Compartilhamento:</span> Não vendemos seus dados. O compartilhamento ocorre apenas com provedores de infraestrutura técnica (como Supabase/Cloud Storage) necessários para o funcionamento do app e, quando exigido, com autoridades legais.
              </p>
              <Separator />
              <p>
                <span className="font-semibold text-foreground">Armazenamento:</span> Os dados são armazenados em servidores de nuvem de alta segurança localizados no Brasil e Estados Unidos. Mantemos os dados enquanto o usuário possuir uma conta ativa ou conforme necessário para fins de auditoria legal (geralmente por 5 anos após a conclusão dos serviços).
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">5. Segurança da Informação</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Implementamos medidas técnicas e organizativas para proteger seus dados, incluindo:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Criptografia de dados em repouso e em trânsito (SSL/TLS).</li>
                <li>Controle de acesso baseado em funções (RBAC).</li>
                <li>Autenticação multifator (MFA) disponível para todos os usuários.</li>
                <li>Monitoramento contínuo contra acessos não autorizados.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">6. Seus Direitos</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
              Você tem direito de confirmar a existência do tratamento, acessar seus dados, solicitar a correção de dados incompletos ou inexatos, e requerer a exclusão (nos casos permitidos por lei). Para exercer esses direitos, você pode utilizar a página de <span className="font-semibold text-foreground">Configurações de Perfil</span> ou entrar em contato conosco.
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">7. Contato e DPO</h2>
          </div>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Se você tiver dúvidas sobre esta Política ou sobre como seus dados são tratados, entre em contato com nosso Encarregado de Proteção de Dados (DPO):
              <div className="mt-3 font-bold text-primary">
                Email: privacidade@energiaoperacoes.com.br
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      
      <div className="text-center pt-8 border-t text-xs text-muted-foreground">
        © 2026 Energia Operações. Todos os direitos reservados.
      </div>
    </div>
  );
}
