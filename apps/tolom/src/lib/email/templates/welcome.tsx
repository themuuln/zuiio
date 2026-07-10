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

interface WelcomeEmailProps {
  userName: string;
  loginUrl: string;
}

export function WelcomeEmail({ userName, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to TOLOM — your auto service management platform
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to TOLOM</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            Your account has been created successfully. You can now start
            managing your auto service shop — work orders, appointments,
            inventory, and more.
          </Text>
          <Link href={loginUrl} style={button}>
            Log in to your account
          </Link>
          <Text style={text}>
            If you have any questions, reply to this email or visit our help
            center.
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
