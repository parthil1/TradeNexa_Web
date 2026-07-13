"use client";

import React, { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

interface CounterProps {
  value: number;
  suffix?: string;
  title: string;
  duration?: number;
}

export default function Counter({ value, suffix = "+", title, duration = 2 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      if (start === end) return;

      const totalMiliseconds = duration * 1000;
      const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 20);
      
      const timer = setInterval(() => {
        start += Math.ceil(end / (totalMiliseconds / incrementTime));
        if (start >= end) {
          clearInterval(timer);
          setCount(end);
        } else {
          setCount(start);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <div ref={ref} className="surface-card p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl"
      >
        {count.toLocaleString()}
        {suffix}
      </motion.div>
      <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted-fg">
        {title}
      </p>
    </div>
  );
}
