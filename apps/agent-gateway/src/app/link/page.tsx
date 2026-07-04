"use client";

import { useEffect, useState } from "react";

/**
 * Link page — QR code generator for Telegram bot linking.
 * 
 * Usage: /link?orgId=xxx&userId=yyy&productType=zer
 * 
 * Scans QR → opens Telegram → auto-sends /start <token> → bot links account.
 */
export default function LinkPage() {
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error";
    telegramUrl?: string;
    error?: string;
  }>({ status: "loading" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orgId = params.get("orgId");
    const userId = params.get("userId");
    const productType = params.get("productType");

    if (!orgId || !userId || !productType) {
      setState({
        status: "error",
        error: "orgId, userId, and productType URL параметрүүд шаардлагатай.",
      });
      return;
    }

    fetch("/api/link/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, userId, productType }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setState({ status: "error", error: data.error });
        } else {
          setState({ status: "ready", telegramUrl: data.telegramUrl });
        }
      })
      .catch((err) => {
        setState({ status: "error", error: err.message });
      });
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          textAlign: "center",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            margin: "0 0 8px 0",
            color: "#111",
          }}
        >
          🔗 Telegram-тэй холбох
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "#666",
            margin: "0 0 24px 0",
            lineHeight: 1.5,
          }}
        >
          QR кодыг уншуулж Telegram боттой холбогдоно уу.
          <br />
          Камераараа QR код руу чиглүүлэхэд Telegram нээгдэнэ.
        </p>

        {state.status === "loading" && (
          <div
            style={{
              width: "280px",
              height: "280px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f9f9f9",
              borderRadius: "12px",
              color: "#999",
              fontSize: "14px",
            }}
          >
            Токен үүсгэж байна...
          </div>
        )}

        {state.status === "ready" && state.telegramUrl && <QrDisplay url={state.telegramUrl} />}

        {state.status === "error" && (
          <div
            style={{
              color: "#e53e3e",
              fontSize: "14px",
              padding: "20px",
            }}
          >
            ❌ {state.error}
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            fontSize: "12px",
            color: "#999",
            lineHeight: 1.5,
          }}
        >
          <p>Холболт 15 минут хүчинтэй.</p>
          <p>Хэрэв автоматаар нээгдэхгүй бол доорх товчийг дарна уу.</p>
        </div>

        {state.telegramUrl && (
          <a
            href={state.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "12px 24px",
              background: "#2481cc",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Telegram нээх
          </a>
        )}
      </div>
    </main>
  );
}

/** QR code display component using the qrcode library. */
function QrDisplay({ url }: { url: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: { dark: "#111", light: "#fff" },
      }).then(setQrDataUrl);
    });
  }, [url]);

  if (!qrDataUrl) {
    return (
      <div
        style={{
          width: "280px",
          height: "280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9f9f9",
          borderRadius: "12px",
          color: "#999",
          fontSize: "14px",
        }}
      >
        QR код бэлтгэж байна...
      </div>
    );
  }

  return (
    <div style={{ margin: "0 auto", width: "fit-content" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="Telegram QR code"
        style={{
          width: "280px",
          height: "280px",
          borderRadius: "12px",
        }}
      />
    </div>
  );
}
