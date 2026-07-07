"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, ChevronDown, LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "@/components/AuthModal";
import CompleteProfileModal from "@/components/CompleteProfileModal";
import { Logo } from "@/components/common/Logo";

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logoutUser, openAuthModal } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const topLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Categories", href: "/categories" },
    { name: "Products", href: "/products" },
    { name: "Contact", href: "/contact" },
  ];

  function isNavActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/categories") return pathname.startsWith("/categories");
    if (href === "/products") return pathname.startsWith("/products");
    return pathname === href;
  }

  const dropdownLinks = [
    { name: "How It Works", href: "/how-it-works" },
    { name: "Why Choose Us", href: "/why-choose-us" },
    { name: "Seller Benefits", href: "/seller-benefits" },
    { name: "Buyer Benefits", href: "/buyer-benefits" },
    { name: "FAQ", href: "/faq" },
  ];

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Categories", href: "/categories" },
    { name: "Products", href: "/products" },
    { name: "Seller Benefits", href: "/seller-benefits" },
    { name: "Buyer Benefits", href: "/buyer-benefits" },
    { name: "Why Choose Us", href: "/why-choose-us" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40 w-full border-b border-border/70 bg-white/95 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex shrink-0 items-center py-0.5">
              <Logo size="nav" priority />
            </div>

            <div className="hidden lg:flex lg:items-center lg:gap-x-6 xl:gap-x-8">
              {topLinks.slice(0, 4).map((link) => {
                const isActive = isNavActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`py-2 text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? "border-b-2 border-primary text-primary" : "text-slate-600"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <div
                className="relative py-2"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button className="flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-600 outline-none transition-colors hover:text-primary">
                  Solutions
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-primary" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 z-50 mt-2 w-48 -translate-x-1/2 rounded-xl border border-slate-100 bg-white p-2 shadow-xl"
                    >
                      {dropdownLinks.map((link) => {
                        const isActive = isNavActive(link.href);
                        return (
                          <Link
                            key={link.name}
                            href={link.href}
                            className={`block rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-slate-50 hover:text-primary ${
                              isActive ? "bg-primary/5 text-primary" : "text-slate-600"
                            }`}
                          >
                            {link.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {topLinks.slice(4).map((link) => {
                const isActive = isNavActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`py-2 text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? "border-b-2 border-primary text-primary" : "text-slate-600"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthenticated && user ? (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-xl"
                        >
                          <div className="mb-2 border-b border-slate-100 px-3 pb-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Business catalog</p>
                            <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{user.company}</p>
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified {user.role.toUpperCase()}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              logoutUser();
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal("login")}
                  className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md sm:flex sm:px-5 cursor-pointer"
                >
                  Join Platform
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {!isAuthenticated && (
                <button
                  onClick={() => openAuthModal("login")}
                  className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover sm:hidden cursor-pointer"
                >
                  Join
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-white lg:hidden"
            >
              <div className="scroll-area max-h-[calc(100dvh-4rem)] space-y-1 overflow-y-auto overscroll-contain px-4 py-4">
                {navLinks.map((link) => {
                  const isActive = isNavActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block rounded-xl px-3 py-2.5 text-base font-medium ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                  {isAuthenticated && user ? (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-400">{user.company}</p>
                        <p className="mt-0.5 text-sm font-bold text-slate-800">{user.name}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logoutUser();
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal("login");
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover cursor-pointer"
                    >
                      Join Platform
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal />
      <CompleteProfileModal />
    </>
  );
}
