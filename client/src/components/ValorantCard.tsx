import { cn } from "@/lib/utils";

interface ValorantCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function ValorantCard({ children, className = "", hover = false }: ValorantCardProps) {
  return (
    <div className={cn(
      "glass-morphism rounded-2xl p-8",
      hover && "card-hover",
      className
    )}>
      {children}
    </div>
  );
}
