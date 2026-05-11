import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { QRCodeSVG } from "qrcode.react";
import { Shield, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

export default function TwoFactorSetup() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"disabled" | "loading" | "unverified" | "enabled">("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

       const totpFactor = data.all.find(f => f.status === "verified" && f.factor_type === "totp");
      if (totpFactor) {
        setStatus("enabled");
        setFactorId(totpFactor.id);
      } else {
         const unverifiedFactor = data.all.find(f => f.status === "unverified" && f.factor_type === "totp");
        if (unverifiedFactor) {
          // Keep it as disabled for now to allow re-enrolling if needed, 
          // or we could resume. For simplicity, we'll let them start over if they didn't finish.
          setStatus("disabled");
        } else {
          setStatus("disabled");
        }
      }
    } catch (e: any) {
      console.error("Error checking MFA status:", e);
    } finally {
      setLoading(false);
    }
  }

  async function enroll() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Energia Ops",
      });
      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setStatus("unverified");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!factorId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });
      if (error) throw error;

      toast.success("Autenticação de dois fatores ativada com sucesso!");
      setStatus("enabled");
      setQrCode(null);
      setVerifyCode("");
    } catch (e: any) {
      toast.error("Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function unenroll() {
    if (!factorId) return;
    if (!confirm("Tem certeza que deseja desativar a autenticação de dois fatores?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      toast.success("2FA desativado.");
      setStatus("disabled");
      setFactorId(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === "enabled" ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <Shield className="h-5 w-5 text-muted-foreground" />
          )}
          Autenticação de Dois Fatores (2FA)
        </CardTitle>
        <CardDescription>
          Proteja sua conta adicionando uma camada extra de segurança.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "disabled" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O 2FA está desativado. Ative para exigir um código do seu aplicativo autenticador ao fazer login.
            </p>
            <Button onClick={enroll} disabled={loading}>
              {loading ? "Iniciando..." : "Ativar 2FA"}
            </Button>
          </div>
        )}

        {status === "unverified" && qrCode && (
          <div className="space-y-6 flex flex-col items-center">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">1. Escaneie o código QR</p>
              <p className="text-xs text-muted-foreground">
                Use um app como Google Authenticator ou Microsoft Authenticator.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-border">
              <QRCodeSVG value={qrCode} size={200} />
            </div>

            <div className="w-full space-y-3">
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">2. Digite o código de verificação</p>
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="000000" 
                  value={verifyCode} 
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="text-center text-lg tracking-[0.5em] font-mono"
                  maxLength={6}
                />
                <Button onClick={verify} disabled={loading || verifyCode.length !== 6}>
                  Verificar
                </Button>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => setStatus("disabled")}>
              Cancelar
            </Button>
          </div>
        )}

        {status === "enabled" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
              <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">O 2FA está ativo</p>
                <p className="text-xs text-green-800/70 dark:text-green-200/70">
                  Sua conta está protegida com autenticação por TOTP.
                </p>
              </div>
            </div>
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={unenroll} disabled={loading}>
              Desativar 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
