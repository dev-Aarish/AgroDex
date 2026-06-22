import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  value: string;
  tooltip?: string;
  successMessage?: string;
  children?: React.ReactNode;
}

export function CopyButton({
  value,
  tooltip = "Copy to clipboard",
  successMessage = "Copied to clipboard!",
  className,
  variant = "ghost",
  size,
  children,
  ...props
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      toast({
        title: successMessage,
      });
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Copy failed",
        description: "Could not write text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const defaultSize = children ? "sm" : "icon";
  const finalSize = size || defaultSize;

  return (
    <Button
      variant={variant}
      size={finalSize}
      className={cn(
        "text-muted-foreground hover:text-foreground shrink-0 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none gap-2",
        finalSize === "icon" && "h-8 w-8",
        className
      )}
      onClick={handleCopy}
      title={tooltip}
      {...props}
    >
      {isCopied ? (
        <Check className="h-4 w-4 text-emerald-500 animate-in fade-in zoom-in-75 duration-200" />
      ) : (
        <Copy className="h-4 w-4 transition-transform hover:scale-110" />
      )}
      {children}
    </Button>
  );
}
