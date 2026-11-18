import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Krishna Overseas | Connected Logistics",
  description:
    "Your connected logistics workspace. Sign in to Krishna Overseas to keep your business moving.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
