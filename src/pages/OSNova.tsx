import { useState } from "react";
import NewServiceOrderDialog from "@/components/os/NewServiceOrderDialog";

export default function OSNova() {
  const [open, setOpen] = useState(true);
  return (
    <NewServiceOrderDialog 
      open={open} 
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) window.history.back();
      }} 
    />
  );
}