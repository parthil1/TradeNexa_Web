"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Mail, MapPin } from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/common/Button";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";

const productLinks = [
  { name: "Browse Categories", href: "/categories" },
  { name: "Products", href: "/products" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Seller Benefits", href: "/seller-benefits" },
  { name: "Buyer Benefits", href: "/buyer-benefits" },
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Why Choose Us", href: "/why-choose-us" },
  { name: "Contact", href: "/contact" },
];

const resourceLinks = [
  { name: "FAQ", href: "/faq" },
  { name: "Contact Support", href: "/contact" },
];

const legalLinks = [
  { name: "Privacy Policy", href: "/privacy" },
];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-fg transition-colors duration-200 hover:text-primary"
    >
      {children}
    </Link>
  );
}

export default function Footer() {
  const { openRegisterModal } = useApp();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      scrollToFirstFormError(
        { email: "Email is required" },
        { fieldIds: { email: "footer-newsletter-email" } }
      );
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      scrollToFirstFormError(
        { email: "Please enter a valid email address" },
        { fieldIds: { email: "footer-newsletter-email" } }
      );
      return;
    }
    setEmailError("");
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 3000);
  };

  return (
    <footer className="mt-auto shrink-0 border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo size="lg" className="mb-4" />
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-fg">
              India&apos;s digital B2B marketplace connecting buyers with verified sellers.
              Grow your business and expand your reach across the nation.
            </p>
            <div className="mb-6 space-y-2 text-sm text-muted-fg">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a href="mailto:contact@tradenexa.com" className="hover:text-primary transition-colors duration-200">
                  contact@tradenexa.com
                </a>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden />
                <span>Serving businesses across India</span>
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Newsletter</h4>
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm font-medium text-primary"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Subscribed successfully!
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribeSubmit} className="flex max-w-md flex-col gap-2" noValidate>
                  <div className="flex items-center gap-2">
                    <input
                      id="footer-newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      placeholder="Business email"
                      className="input-base flex-1"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "footer-email-error" : undefined}
                    />
                    <Button type="submit" size="md" className="shrink-0 px-3" aria-label="Subscribe">
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                  {emailError && (
                    <p id="footer-email-error" className="text-xs font-medium text-error" role="alert">
                      {emailError}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                Product
              </h3>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.href + link.name}>
                    <FooterLink href={link.href}>{link.name}</FooterLink>
                  </li>
                ))}
                {!isAuthenticated && (
                  <>
                    <li>
                      <button
                        type="button"
                        onClick={() => openRegisterModal("seller")}
                        className="cursor-pointer text-left text-sm text-muted-fg transition-colors duration-200 hover:text-primary"
                      >
                        Become a Seller
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => openRegisterModal("buyer")}
                        className="cursor-pointer text-left text-sm text-muted-fg transition-colors duration-200 hover:text-primary"
                      >
                        Register as Buyer
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                Company
              </h3>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                Resources
              </h3>
              <ul className="space-y-3">
                {resourceLinks.map((link) => (
                  <li key={link.href + link.name}>
                    <FooterLink href={link.href}>{link.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                Legal
              </h3>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-fg">
            Copyright © 2026 TradeNexa B2B Marketplace. All Rights Reserved.
          </p>
          <div className="flex gap-2" aria-label="Social links">
            {[
              {
                label: "Facebook",
                path: "M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z",
              },
              {
                label: "Twitter",
                path: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z",
              },
              {
                label: "LinkedIn",
                path: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
              },
            ].map((social) => (
              <span
                key={social.label}
                role="img"
                aria-label={social.label}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-fg transition-colors duration-200 hover:border-primary/30 hover:text-primary"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden>
                  <path d={social.path} />
                </svg>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
