import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { translateError } from "@/lib/error-handler";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

const toast = {
  ...sonnerToast,
  error: (message: any, data?: any) => {
    return sonnerToast.error(translateError(message), data);
  },
  success: (message: any, data?: any) => {
    // Também traduzimos se for um objeto de erro passado por engano ou algo assim
    return sonnerToast.success(translateError(message), data);
  },
  info: (message: any, data?: any) => {
    return sonnerToast.info(translateError(message), data);
  },
  warning: (message: any, data?: any) => {
    return sonnerToast.warning(translateError(message), data);
  },
};

export { Toaster, toast };
