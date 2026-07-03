"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { Logo } from "@/components/common/Logo";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";

export default function Footer() {
  const { openRegisterModal } = useApp();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple email validation
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
    setEmailError('');
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 3000);
  };

  return (
    <footer className="mt-auto shrink-0 border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Column 1 - Brand & Desc */}
          <div className="md:col-span-2">
            <Logo size="lg" className="mb-4" />
            <p className="text-sm leading-relaxed max-w-sm mb-6 text-slate-500">
              India's digital B2B marketplace connecting buyers with verified sellers. Grow your business and expand your reach across the nation.
            </p>
            {/* Newsletter Subscription */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Subscribe to our Newsletter</h4>
              {subscribed ? (
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Subscribed successfully!
                </div>
              ) : (
                <form onSubmit={handleSubscribeSubmit} className="flex max-w-md flex-col gap-2" noValidate>
                  <div className="flex items-center gap-2">
                    <input
                      id="footer-newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      placeholder="Enter business email"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-white transition hover:bg-primary-hover shadow-sm"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
                </form>
              )}
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-primary transition-colors">Categories</Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">FAQ Page</Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - For Sellers */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase mb-4">Join Platform</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => openRegisterModal("seller")} className="hover:text-primary text-left transition-colors">
                  Become a Seller
                </button>
              </li>
              <li>
                <button onClick={() => openRegisterModal("buyer")} className="hover:text-primary text-left transition-colors">
                  Register as Buyer
                </button>
              </li>
              <li>
                <button onClick={() => openRegisterModal("both")} className="hover:text-primary text-left transition-colors">
                  Register as Both
                </button>
              </li>
              <li>
                <Link href="/seller-benefits" className="hover:text-primary transition-colors">Seller Benefits</Link>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">Business Profile Setup</span>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">Product Listing Guide</span>
              </li>
            </ul>
          </div>

          {/* Column 4 - Support */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase mb-4">Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-slate-400 cursor-not-allowed">Help Center</span>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">Privacy Policy</span>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">Terms & Conditions</span>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            Copyright © 2026 TradeNexa B2B Marketplace. All Rights Reserved. Inspired by TradeNexa for demonstration purposes.
          </p>
          <div className="flex gap-4">
            <span className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-primary transition cursor-pointer">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
            </span>
            <span className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-primary transition cursor-pointer">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
            </span>
            <span className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-primary transition cursor-pointer">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            </span>
            <span className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-primary transition cursor-pointer">
              <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
