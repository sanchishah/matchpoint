"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <Card className="border-[#E2E8F0] shadow-none">
        <CardHeader className="pb-2 pt-8 px-8">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[#333333] text-center">
            Invalid Link
          </h2>
        </CardHeader>
        <CardContent className="px-8 pt-4 pb-4">
          <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/70 text-center leading-relaxed">
            This password reset link is invalid. Please request a new one.
          </p>
        </CardContent>
        <CardFooter className="justify-center pb-8 px-8">
          <Link
            href="/forgot-password"
            className="font-[family-name:var(--font-inter)] text-sm text-[#0B4F6C] font-medium hover:underline underline-offset-4"
          >
            Request New Link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function onSubmit(values: ResetPasswordValues) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success("Password reset successfully!");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-[#E2E8F0] shadow-none">
      <CardHeader className="pb-2 pt-8 px-8">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[#333333] text-center">
          Reset Password
        </h2>
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/60 text-center mt-1">
          Enter your new password below
        </p>
      </CardHeader>

      <CardContent className="px-8 pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-[family-name:var(--font-inter)] text-[#333333] text-xs uppercase tracking-wider">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      className="h-11 border-[#E2E8F0] bg-white font-[family-name:var(--font-inter)] text-[#333333] placeholder:text-[#333333]/30 focus-visible:border-[#0B4F6C] focus-visible:ring-[#0B4F6C]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-[family-name:var(--font-inter)] text-[#333333] text-xs uppercase tracking-wider">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Re-enter your password"
                      className="h-11 border-[#E2E8F0] bg-white font-[family-name:var(--font-inter)] text-[#333333] placeholder:text-[#333333]/30 focus-visible:border-[#0B4F6C] focus-visible:ring-[#0B4F6C]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#0B4F6C] px-8 py-3 h-12 text-white font-[family-name:var(--font-inter)] text-sm tracking-wide hover:bg-[#0B4F6C]/90 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center pb-8 px-8">
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/60">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-[#0B4F6C] font-medium hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
