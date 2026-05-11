 import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Cookie, ShieldCheck, X } from "lucide-react";

 import { useLocalStorage } from "@/hooks/useLocalStorage";
 
 interface CookiePreferences {
   essential: boolean;
   analytical: boolean;
   marketing: boolean;
   acceptedAt?: string;
 }
 
 export default function CookieBanner() {
   const [isVisible, setIsVisible] = useState(false);
   const [showPreferences, setShowPreferences] = useState(false);
   const [consent, setConsent] = useLocalStorage<CookiePreferences | null>("cookie-consent", null);
   
   const [tempPreferences, setTempPreferences] = useState<CookiePreferences>({
     essential: true,
     analytical: false,
     marketing: false,
   });
 
   useEffect(() => {
     if (!consent) {
       setIsVisible(true);
     }
   }, [consent]);
 
   const saveConsent = (prefs: CookiePreferences) => {
     const newConsent = { ...prefs, acceptedAt: new Date().toISOString() };
     setConsent(newConsent);
     setIsVisible(false);
     setShowPreferences(false);
     
     window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: newConsent }));
     
     if (newConsent.analytical) {
       console.log("Cookies analíticos ativados");
     }
     if (newConsent.marketing) {
       console.log("Cookies de marketing ativados");
     }
   };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytical: true,
      marketing: true,
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      essential: true,
      analytical: false,
      marketing: false,
    });
  };

  if (!isVisible && !showPreferences) return null;

  return (
    <>
      {isVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
          <Card className="max-w-4xl mx-auto p-4 md:p-6 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-md flex flex-col md:flex-row items-center gap-4 md:gap-8 ring-1 ring-primary/10">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Cookie className="h-5 w-5" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Aviso de Cookies</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Utilizamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa{" "}
                <Link to="/privacidade" className="underline hover:text-primary transition-colors font-medium">
                  política de privacidade
                </Link>.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
              <Button variant="ghost" size="sm" onClick={() => setShowPreferences(true)} className="text-xs">
                Gerenciar
              </Button>
              <Button variant="outline" size="sm" onClick={handleRejectNonEssential} className="text-xs">
                Rejeitar não essenciais
              </Button>
              <Button size="sm" onClick={handleAcceptAll} className="text-xs font-bold bg-primary hover:bg-primary/90">
                Aceitar todos
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Preferências de Cookies
            </DialogTitle>
            <DialogDescription>
              Personalize quais tipos de cookies você permite que utilizemos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1 flex-1">
                <Label className="text-sm font-bold">Essenciais</Label>
                <p className="text-xs text-muted-foreground">Necessários para o funcionamento básico do sistema.</p>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1 flex-1">
                <Label className="text-sm font-bold">Analíticos</Label>
                <p className="text-xs text-muted-foreground">Ajudam-nos a entender como o sistema é utilizado.</p>
              </div>
               <Switch
                 checked={tempPreferences.analytical}
                 onCheckedChange={(v) => setTempPreferences(prev => ({ ...prev, analytical: v }))}
               />
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1 flex-1">
                <Label className="text-sm font-bold">Marketing</Label>
                <p className="text-xs text-muted-foreground">Utilizados para oferecer conteúdo mais relevante.</p>
              </div>
               <Switch
                 checked={tempPreferences.marketing}
                 onCheckedChange={(v) => setTempPreferences(prev => ({ ...prev, marketing: v }))}
               />
            </div>
          </div>
           <DialogFooter>
             <Button className="w-full" onClick={() => saveConsent(tempPreferences)}>
               Salvar Preferências
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
