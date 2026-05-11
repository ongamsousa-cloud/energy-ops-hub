import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/sonner";

type Notif = { id: string; titulo: string; mensagem: string | null; link: string | null; lida: boolean; created_at: string };

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);

  const load = () => {
    if (!user) return;
    supabase.from("notificacoes").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setItems((data ?? []) as Notif[]));
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` }, (payload: any) => {
        const n = payload.new as Notif;
        setItems((prev) => [n, ...prev].slice(0, 20));
        toast.message(n.titulo, { description: n.mensagem ?? undefined });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unread = items.filter((i) => !i.lida).length;

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notificacoes").update({ lida: true }).eq("user_id", user.id).eq("lida", false);
    load();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <span className="text-sm font-medium">Notificações</span>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs text-primary hover:underline">Marcar todas como lidas</button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Sem notificações</div>
          ) : items.map((n) => (
            <Link key={n.id} to={n.link || "#"} className={`block border-b border-border p-3 text-xs hover:bg-accent ${!n.lida ? "bg-primary/5" : ""}`}>
              <div className="font-medium">{n.titulo}</div>
              {n.mensagem && <div className="mt-0.5 text-muted-foreground line-clamp-2">{n.mensagem}</div>}
              <div className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}