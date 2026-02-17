"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { contactSchema } from "@/lib/validations";
import { Mail, MessageSquare } from "lucide-react";

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Message sent! We'll get back to you soon.");
        reset();
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-16">
      <div className="mx-auto max-w-2xl px-6">
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-xl bg-[#E8F4F8] flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-[#0B4F6C]" />
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl text-[#0A0A0A] mb-4 tracking-wide">
            Questions? Feedback? Reach Out!
          </h1>
          <p className="text-[#333333] max-w-md mx-auto leading-relaxed">
            We&apos;re always happy to hear from you. Whether it&apos;s about a court, a match, or your
            experience — drop us a message anytime.
          </p>
        </div>

        <Card className="border-[#E2E8F0] rounded-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#64748B] mb-2 block">Name</Label>
              <Input
                {...register("name")}
                placeholder="Your name"
                className="border-[#E2E8F0] rounded-xl h-11"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#64748B] mb-2 block">Email</Label>
              <Input
                {...register("email")}
                type="email"
                placeholder="your@email.com"
                className="border-[#E2E8F0] rounded-xl h-11"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#64748B] mb-2 block">Message</Label>
              <Textarea
                {...register("message")}
                placeholder="What's on your mind?"
                className="border-[#E2E8F0] rounded-xl resize-none"
                rows={5}
              />
              {errors.message && (
                <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-full h-12 text-base"
            >
              {submitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
