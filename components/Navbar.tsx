"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, ChevronDown, LogOut, CheckCircle2, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPathForRole } from "@/utils/roleNavigation";
import AuthModal from "@/components/AuthModal";
import CompleteProfileModal from "@/components/CompleteProfileModal";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/common/Button";

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

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex shrink-0 items-center">
              <Logo size="nav" priority />
            </div>

            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {topLinks.slice(0, 4).map((link) => {
                const isActive = isNavActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/8 text-primary"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <div
                className="relative"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                  Solutions
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-primary" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.15)]"
                    >
                      {dropdownLinks.map((link) => {
                        const isActive = isNavActive(link.href);
                        return (
                          <Link
                            key={link.name}
                            href={link.href}
                            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-primary/8 text-primary"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/8 text-primary"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="hidden sm:inline-flex"
                  >
                    <Button variant="outline" size="sm">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="max-w-[100px] truncate">{user.name}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.15)]"
                          >
                            <div className="mb-1 border-b border-slate-100 px-3 pb-3 pt-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Business catalog
                              </p>
                              <p className="mt-1 truncate text-sm font-semibold text-slate-900">{user.company}</p>
                              <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified {user.role.toUpperCase()}
                              </span>
                            </div>
                            <Link
                              href={dashboardHref}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              <LayoutDashboard className="h-4 w-4 text-primary" />
                              My Dashboard
                            </Link>
                            <button
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                logoutUser();
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign Out
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="hidden sm:block">
                  <Button onClick={() => openAuthModal("login")} size="sm">
                    Join Platform
                    <ArrowRight className="h-4 w-4" />
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
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : null}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
              className="border-t border-slate-100 bg-white lg:hidden"
            >
              <div className="scroll-area max-h-[calc(100dvh-4rem)] space-y-0.5 overflow-y-auto px-4 py-4">
                {navLinks.map((link) => {
                  const isActive = isNavActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/8 text-primary"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  {isAuthenticated && user ? (
                    <div className="space-y-2">
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium text-slate-400">{user.company}</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">{user.name}</p>
                      </div>
                      <Link href={dashboardHref} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" fullWidth>
                          <LayoutDashboard className="h-4 w-4" />
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
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      fullWidth
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal("login");
                      }}
                    >
                      Join Platform
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
