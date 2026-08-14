interface ProductJsonLdProps {
  name: string;
  description: string;
  url: string;
  category?: string;
}

export function ProductJsonLd({
  name,
  description,
  url,
  category = "Business Software",
}: ProductJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name,
          description,
          url: `https://zuiiotech.com${url}`,
          applicationCategory: category,
          operatingSystem: "Web, iOS, Android",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "MNT",
            description: "Free tier available",
          },
          provider: {
            "@type": "Organization",
            name: "Zuiio",
            url: "https://zuiiotech.com",
          },
        }),
      }}
    />
  );
}
