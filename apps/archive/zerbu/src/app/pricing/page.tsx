"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { CheckCircle, Heart, Crown, Star } from "@phosphor-icons/react";

type Plan = {
  id: "monthly" | "annual" | "lifetime";
  title: string;
  price: string;
  priceMNT: string;
  period: string;
  icon: typeof Crown;
  features: string[];
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: "monthly",
    title: "Үнэгүй",
    price: "₮0",
    priceMNT: "0",
    period: "сараар",
    icon: Heart,
    features: [
      "Өдөр бүрийн асуулт",
      "3 тоглоом (WYR, Know Me, NHIE)",
      "Хамтарсан хуанли",
      "Сэтгэлийн тэмдэглэл",
      "25 зураг",
      "Үндсэн streak",
    ],
  },
  {
    id: "monthly",
    title: "Дээд",
    price: "₮9,900",
    priceMNT: "9900",
    period: "сараар",
    icon: Crown,
    popular: true,
    features: [
      "Бүх тоглоом",
      "AI дүн шинжилгээ",
      "Хязгааргүй зураг",
      "Бүх асуултын багц",
      "Love Maps",
      "Дотно орон зай",
      "Гүнзгий яриа",
    ],
  },
  {
    id: "annual",
    title: "Дээд Жилийн",
    price: "₮79,000",
    priceMNT: "79000",
    period: "жилээр (33% хямд)",
    icon: Crown,
    features: [
      "Дээд төлөвлөгөөний бүх давуу тал",
      "Сард ердөө ₮6,583",
      "Тэргүүлэх дэмжлэг",
    ],
  },
  {
    id: "lifetime",
    title: "Насан туршийн",
    price: "₮199,000",
    priceMNT: "199000",
    period: "нэг удаа",
    icon: Star,
    features: [
      "Бүх зүйл насан туршдаа",
      "Шинэчлэлт шаардлагагүй",
      "VIP дэмжлэг",
      "Ирээдүйн бүх функц",
    ],
  },
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSelectPlan(plan: Plan) {
    if (plan.priceMNT === "0") return;
    setSelectedPlan(plan);
    setLoading(true);
    setShowPayment(true);

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      const data = await res.json();
      if (data.invoice?.qrImage) {
        setQrImage(data.invoice.qrImage);
      }
    } catch {
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-text dark:text-dark-text mb-3">
            Үнийн төлөвлөгөө
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Гуравхан хуушуурын үнээр — хайр дүүрэн харилцаа. Монгол хэрэглэгчдэд зориулсан шударга үнэ.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id + plan.price}
                className={`relative flex flex-col ${
                  plan.popular ? "ring-2 ring-primary" : ""
                }`}
              >
                {plan.popular && (
                  <Badge variant="primary" className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    Хамгийн түгээмэл
                  </Badge>
                )}
                <div className="text-center mb-4">
                  <Icon size={32} className={`mx-auto mb-2 ${plan.popular ? "text-primary" : "text-text-secondary"}`} />
                  <CardTitle>{plan.title}</CardTitle>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-text dark:text-dark-text">{plan.price}</span>
                    <p className="text-xs text-text-secondary">{plan.period}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2 mb-4">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className="text-success shrink-0" weight="fill" />
                      <span className="text-text dark:text-dark-text">{f}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  variant={plan.popular ? "primary" : "outline"}
                  disabled={plan.priceMNT === "0"}
                  fullWidth
                >
                  {plan.priceMNT === "0" ? "Үнэгүй" : "Сонгох"}
                </Button>
              </Card>
            );
          })}
        </div>

        <Modal open={showPayment} onClose={() => setShowPayment(false)} title="QPay төлбөр">
          <div className="text-center space-y-4">
            {loading ? (
              <div className="py-8">
                <div className="animate-pulse w-48 h-48 bg-secondary/20 rounded-[16px] mx-auto" />
                <p className="text-text-secondary mt-3">QR код үүсгэж байна...</p>
              </div>
            ) : qrImage ? (
              <>
                <img
                  src={`data:image/png;base64,${qrImage}`}
                  alt="QPay QR"
                  className="w-48 h-48 mx-auto rounded-[12px]"
                />
                <p className="text-sm text-text-secondary">
                  {selectedPlan?.title} — {selectedPlan?.price}
                </p>
                <p className="text-xs text-text-secondary">
                  QPay апп-аар QR кодыг уншуулж төлбөрөө төлнө үү
                </p>
              </>
            ) : (
              <div className="py-8">
                <p className="text-text-secondary">Төлбөрийн системд холбогдож чадсангүй</p>
                <p className="text-xs text-text-secondary mt-2">
                  QPay Client ID тохируулаагүй байна
                </p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
