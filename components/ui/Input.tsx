import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full border bg-white px-4 py-3 text-charcoal placeholder-mauve focus:outline-none transition-colors duration-200 font-inter text-sm",
            error ? "border-red-400 focus:border-red-500" : "border-ivory-200 focus:border-rose-gold",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500 font-inter">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
