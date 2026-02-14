"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { profileSchema } from "@/lib/validations";
import {
  SKILL_LEVELS,
  AGE_BRACKETS,
  GENDER_OPTIONS,
  RADIUS_OPTIONS,
} from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: undefined,
      ageBracket: undefined,
      gender: undefined,
      skillLevel: undefined,
      radiusMiles: undefined,
      zip: "",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          form.reset({
            name: data.name,
            age: data.age,
            ageBracket: data.ageBracket,
            gender: data.gender,
            skillLevel: data.skillLevel,
            radiusMiles: data.radiusMiles,
            zip: data.zip,
          });
        }
      } catch {
        // No existing profile, leave defaults
      }
    }
    fetchProfile();
  }, [form]);

  async function onSubmit(values: ProfileFormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success("Profile saved successfully!");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold tracking-tight text-[#4A4A4A] sm:text-5xl">
            Complete Your Profile
          </h1>
          <p className="mt-4 text-lg text-[#4A4A4A]/70">
            Tell us about yourself so we can find your perfect match.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-[#F1F1F1] bg-white shadow-sm">
          <CardContent className="pt-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#4A4A4A] font-medium">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your full name"
                          className="border-[#F1F1F1] focus-visible:border-[#3F6F5E] focus-visible:ring-[#3F6F5E]/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Age + Age Bracket row */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#4A4A4A] font-medium">
                          Age
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="25"
                            min={18}
                            max={100}
                            className="border-[#F1F1F1] focus-visible:border-[#3F6F5E] focus-visible:ring-[#3F6F5E]/20"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ageBracket"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#4A4A4A] font-medium">
                          Age Bracket
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full border-[#F1F1F1] focus-visible:border-[#3F6F5E] focus-visible:ring-[#3F6F5E]/20">
                              <SelectValue placeholder="Select age bracket" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AGE_BRACKETS.map((bracket) => (
                              <SelectItem
                                key={bracket.value}
                                value={bracket.value}
                              >
                                {bracket.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#4A4A4A] font-medium">
                        Gender
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full border-[#F1F1F1] focus-visible:border-[#3F6F5E] focus-visible:ring-[#3F6F5E]/20">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Skill Level */}
                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#4A4A4A] font-medium">
                        Skill Level
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(val) =>
                            field.onChange(parseInt(val, 10))
                          }
                          value={field.value?.toString()}
                          className="grid grid-cols-2 gap-3 sm:grid-cols-5"
                        >
                          {SKILL_LEVELS.map((level) => (
                            <label
                              key={level.value}
                              htmlFor={`skill-${level.value}`}
                              className="cursor-pointer"
                            >
                              <div
                                className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-all ${
                                  field.value === level.value
                                    ? "border-[#3F6F5E] bg-[#DDEFE6]/50 text-[#3F6F5E]"
                                    : "border-[#F1F1F1] bg-white text-[#4A4A4A]/70 hover:border-[#DDEFE6] hover:bg-[#DDEFE6]/20"
                                }`}
                              >
                                <span className="text-xl font-semibold">
                                  {level.value}
                                </span>
                                <span className="text-xs font-medium leading-tight">
                                  {level.label}
                                </span>
                                <RadioGroupItem
                                  value={level.value.toString()}
                                  id={`skill-${level.value}`}
                                  className="sr-only"
                                />
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Radius + Zip row */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="radiusMiles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#4A4A4A] font-medium">
                          Play Radius
                        </FormLabel>
                        <Select
                          onValueChange={(val) =>
                            field.onChange(parseInt(val, 10))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full border-[#F1F1F1] focus-visible:border-[#3F6F5E] focus-visible:ring-[#3F6F5E]/20">
                              <SelectValue placeholder="Select radius" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RADIUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value.toString()}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#4A4A4A] font-medium">
                          Zip Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 95014"
                            className="border-[#F1F1F1] focus-visible:border-[#3F6F5E] focus-visible:ring-[#3F6F5E]/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-[#3F6F5E] text-base font-medium text-white hover:bg-[#3F6F5E]/90 transition-colors"
                  >
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
