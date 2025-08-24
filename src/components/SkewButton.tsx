import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkewButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  testId?: string;
}

export default function SkewButton({ 
  children, 
  className = "", 
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  testId
}: SkewButtonProps) {
  const baseClasses = "skew-button px-8 py-4 text-xl font-bold rounded-lg";
  const variantClasses = variant === "primary" 
    ? "" // Primary styling handled by CSS
    : "secondary"; // Secondary styling handled by CSS

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseClasses, variantClasses, className)}
      data-testid={testId}
    >
      <span className="block transform skew-x-10">
        {children}
      </span>
    </Button>
  );
}
