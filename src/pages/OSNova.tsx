 import { useState } from "react";
 import { useSearchParams } from "react-router-dom";
import NewServiceOrderDialog from "@/components/os/NewServiceOrderDialog";

export default function OSNova() {
  const [open, setOpen] = useState(true);
   const [searchParams] = useSearchParams();
   const obraId = searchParams.get("obraId") || undefined;
 
  return (
    <NewServiceOrderDialog 
      open={open} 
       initialObraId={obraId}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) window.history.back();
      }} 
    />
  );
}