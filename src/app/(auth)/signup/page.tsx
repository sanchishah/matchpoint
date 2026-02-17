"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { signupSchema } from "@/lib/validations";
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

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignupValues) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message ?? "Could not create your account. Please try again.");
        return;
      }

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Account created but sign-in failed. Please log in manually.");
        router.push("/login");
        return;
      }

      router.push("/profile/setup");
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
          Create Your Account
        </h2>
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/60 text-center mt-1">
          Join Matchpoint and start playing
        </p>
      </CardHeader>

      <CardContent className="px-8 pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-[family-name:var(--font-inter)] text-[#333333] text-xs uppercase tracking-wider">
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Your name"
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-[family-name:var(--font-inter)] text-[#333333] text-xs uppercase tracking-wider">
                    Password
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

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#0B4F6C] px-8 py-3 h-12 text-white font-[family-name:var(--font-inter)] text-sm tracking-wide hover:bg-[#0B4F6C]/90 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center pb-8 px-8">
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/60">
          Already have an account?{" "}
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
