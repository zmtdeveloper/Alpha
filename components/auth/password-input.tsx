"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<InputProps, "type">;

export function PasswordInput({
  className,
  id,
  ...props
}: PasswordInputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const [isVisible, setIsVisible] = React.useState(false);
  const label = isVisible ? "Hide password" : "Show password";

  return (
    <div className="relative">
      <Input
        className={cn("pr-10", className)}
        id={inputId}
        type={isVisible ? "text" : "password"}
        {...props}
      />
      <button
        aria-controls={inputId}
        aria-label={label}
        className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setIsVisible((value) => !value)}
        title={label}
        type="button"
      >
        {isVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </div>
  );
}
