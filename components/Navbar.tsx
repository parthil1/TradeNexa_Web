"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  LogOut,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPathForRole } from "@/utils/roleNavigation";
import AuthModal from "@/components/AuthModal";
import CompleteProfileModal from "@/components/CompleteProfileModal";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/common/Button";
import type { UserRole } from "@/types/auth";

function formatVerifiedRoleLabel(role: UserRole | string): string {
  const value = String(role).toLowerCase();
  if (value === "both") return "Buyer & Seller";
  if (value === "buyer") return "Buyer";
  if (value === "seller") return "Seller";
  return role;
}

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

  const dashboardHref = user ? getDashboardPathForRole(user.role) : "/buyer/home";

  const linkClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      active
        ? "bg-primary-soft text-primary"
        : "text-muted-fg hover:bg-muted hover:text-foreground"
    }`;

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex shrink-0 items-center">
              <Logo size="nav" priority />
            </div>

            <div className="hidden lg:flex lg:items-center lg:gap-0.5">
              {topLinks.slice(0, 4).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={linkClass(isNavActive(link.href))}
                >
                  {link.name}
                </Link>
              ))}

              <div
                className="relative"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-fg transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  Solutions
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-primary" : ""}`}
                    aria-hidden
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-card p-1.5 shadow-[var(--shadow-elevated)]"
                    >
                      {dropdownLinks.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                            isNavActive(link.href)
                              ? "bg-primary-soft text-primary"
                              : "text-muted-fg hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {topLinks.slice(4).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={linkClass(isNavActive(link.href))}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link href={dashboardHref} className="hidden sm:inline-flex">
                    <Button variant="outline" size="sm">
                      <LayoutDashboard className="h-4 w-4" aria-hidden />
                      Dashboard
                    </Button>
                  </Link>
                  <div className="relative hidden sm:block">
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                      aria-expanded={isUserMenuOpen}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="max-w-[100px] truncate">{user.name}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-fg transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsUserMenuOpen(false)}
                            aria-hidden
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-elevated)]"
                          >
                            <div className="mb-1 border-b border-border px-3 pb-3 pt-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
                                Business catalog
                              </p>
                              <p className="mt-1 truncate text-sm font-semibold text-foreground">
                                {user.company}
                              </p>
                              <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                                <CheckCircle2 className="h-3 w-3" aria-hidden />
                                Verified {formatVerifiedRoleLabel(user.role)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                logoutUser();
                              }}
                              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-error transition-colors duration-200 hover:bg-error-soft"
                            >
                              <LogOut className="h-4 w-4" aria-hidden />
                              Sign Out
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAuthModal("login")}
                  >
                    Sign in
                  </Button>
                  <Button onClick={() => openAuthModal("login")} size="sm">
                    Get started
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}

              {!isAuthenticated && (
                <Button
                  onClick={() => openAuthModal("login")}
                  size="sm"
                  className="sm:hidden"
                >
                  Join
                </Button>
              )}

              {isAuthenticated && user ? (
                <Link
                  href={dashboardHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex sm:hidden"
                >
                  <Button variant="outline" size="sm" aria-label="Dashboard">
                    <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-fg transition-colors duration-200 hover:bg-muted lg:hidden"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden />
                )}
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
              transition={{ duration: 0.2 }}
              className="border-t border-border bg-card lg:hidden"
            >
              <div className="scroll-area max-h-[calc(100dvh-4rem)] space-y-0.5 overflow-y-auto px-4 py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                      isNavActive(link.href)
                        ? "bg-primary-soft text-primary"
                        : "text-muted-fg hover:bg-muted"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="mt-4 border-t border-border pt-4">
                  {isAuthenticated && user ? (
                    <div className="space-y-2">
                      <div className="rounded-xl bg-muted px-4 py-3">
                        <p className="text-xs font-medium text-muted-fg">{user.company}</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{user.name}</p>
                      </div>
                      <Link href={dashboardHref} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" fullWidth>
                          <LayoutDashboard className="h-4 w-4" aria-hidden />
                          My Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        fullWidth
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logoutUser();
                        }}
                      >
                        <LogOut className="h-4 w-4" aria-hidden />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        fullWidth
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          openAuthModal("login");
                        }}
                      >
                        Get started
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          openAuthModal("login");
                        }}
                      >
                        Sign in
                      </Button>
                    </div>
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
