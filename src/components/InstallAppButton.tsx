import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface Props {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  className?: string;
  label?: string;
}

export default function InstallAppButton({ variant = "outline", size = "sm", className, label = "Baixar aplicativo" }: Props) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore iOS
      window.navigator.standalone === true;
    setInstalled(standalone);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else if (isIOS) {
      setIosOpen(true);
    } else {
      setIosOpen(true);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={handleClick} className={className}>
        <Download className="h-4 w-4 mr-1.5" />
        {label}
      </Button>
      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar aplicativo</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm pt-2">
                {isIOS ? (
                  <>
                    <p>No iPhone/iPad (Safari):</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Toque no botão <b>Compartilhar</b> na barra do Safari.</li>
                      <li>Selecione <b>Adicionar à Tela de Início</b>.</li>
                      <li>Confirme em <b>Adicionar</b>.</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <p>Para instalar no seu dispositivo:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Abra o menu do navegador (⋮).</li>
                      <li>Toque em <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</li>
                    </ol>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}