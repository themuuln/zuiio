import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "react-email";

interface ConfirmEmailProps {
  userName: string;
  confirmationUrl: string;
}

export function ConfirmEmail({ userName, confirmationUrl }: ConfirmEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email address for TOLOM</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Confirm your email</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            Please confirm your email address by clicking the button below. This
            helps us keep your account secure.
          </Text>
          <Link href={confirmationUrl} style={button}>
            Confirm email address
          </Link>
          <Text style={text}>
            If you didn't create a TOLOM account, you can safely ignore this
            email.
          </Text>
          <Text style={footer}>— The TOLOM Team</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f8f9fa",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const h1 = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 16px",
};

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 16px",
};

const button = {
  display: "inline-block",
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  margin: "0 0 16px",
};

const footer = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "24px 0 0",
};
