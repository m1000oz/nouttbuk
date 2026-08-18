"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type SignOutButtonProps = VariantProps<typeof buttonVariants> & {
  className?: string;
};

export function SignOutButton({
  variant = "outline",
  size = "default",
  className,
}: SignOutButtonProps) {
  const router = useRouter();

  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      Cerrar sesión
    </Button>
  );
}
