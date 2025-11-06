import { X } from "lucide-react";
import { motion } from "framer-motion";

interface TagChipProps {
  tag: string;
  onRemove?: () => void;
  variant?: "default" | "purple" | "blue" | "green" | "orange";
}

const variantColors = {
  default: "bg-primary/20 text-primary border-primary/30",
  purple: "bg-[hsl(270,60%,60%)]/20 text-[hsl(270,60%,60%)] border-[hsl(270,60%,60%)]/30",
  blue: "bg-[hsl(220,75%,60%)]/20 text-[hsl(220,75%,60%)] border-[hsl(220,75%,60%)]/30",
  green: "bg-[hsl(140,60%,50%)]/20 text-[hsl(140,60%,50%)] border-[hsl(140,60%,50%)]/30",
  orange: "bg-[hsl(25,85%,60%)]/20 text-[hsl(25,85%,60%)] border-[hsl(25,85%,60%)]/30",
};

export const TagChip = ({ tag, onRemove, variant = "default" }: TagChipProps) => {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`tag-chip inline-flex items-center gap-1 border ${variantColors[variant]}`}
    >
      {tag}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-current/10 rounded-full p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.span>
  );
};
