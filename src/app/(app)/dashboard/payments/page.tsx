"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PaymentData {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
  game: {
    id: string;
    startTime: string;
    format: string;
    club: { id: string; name: string; city: string };
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  SUCCEEDED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-[#F1F5F9] text-[#64748B]",
};

export default function PaymentsPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/payments?${params}`)
      .then((res) => res.json())
      .then((data) => setPayments(data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (authStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-7 h-7 text-[#0B4F6C]" />
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] tracking-wide">
            Payment History
          </h1>
        </div>
        <p className="text-[#64748B] mb-8">Track all your game payments.</p>

        {/* Filter */}
        <div className="mb-6 max-w-xs">
          <Label className="text-xs uppercase tracking-wider text-[#64748B] mb-1.5 block">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-[#E2E8F0] rounded-xl h-11">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-[#64748B]">Loading...</div>
        ) : payments.length === 0 ? (
          <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
            <p className="text-[#64748B]">No payments found.</p>
          </Card>
        ) : (
          <Card className="border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#E2E8F0]">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#F8F8F8] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0A0A0A]">
                      {payment.game.club.name}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {format(new Date(payment.game.startTime), "MMM d, yyyy · h:mm a")}
                      {" · "}
                      {payment.game.format === "SINGLES" ? "Singles" : "Doubles"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-medium text-[#0A0A0A]">
                      ${(payment.amountCents / 100).toFixed(2)}
                    </span>
                    <Badge
                      className={`border-0 rounded-full text-xs ${
                        statusColors[payment.status] || "bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
