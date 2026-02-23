"use client";

import { useState } from "react";
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Something went wrong");
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-[#E2E8F0] shadow-none">
        <CardHeader className="pb-2 pt-8 px-8">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[#333333] text-center">
            Check Your Email
          </h2>
        </CardHeader>
        <CardContent className="px-8 pt-4 pb-4">
          <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/70 text-center leading-relaxed">
            If an account with that email exists, we&apos;ve sent a link to
            reset your password. It expires in 1 hour.
          </p>
        </CardContent>
        <CardFooter className="justify-center pb-8 px-8">
          <Link
            href="/login"
            className="font-[family-name:var(--font-inter)] text-sm text-[#0B4F6C] font-medium hover:underline underline-offset-4"
          >
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-[#E2E8F0] shadow-none">
      <CardHeader className="pb-2 pt-8 px-8">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[#333333] text-center">
          Forgot Password
        </h2>
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/60 text-center mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </CardHeader>

      <CardContent className="px-8 pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-[family-name:var(--font-inter)] text-[#333333] text-xs uppercase tracking-wider">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
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
