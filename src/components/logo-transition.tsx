import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "./router.js";

// Hex colors for the Dr Tecno branding
const colors = {
  pink: "#ED4E9D",
  yellow: "#FFD028",
  green: "#37CE7F",
  cyan: "#17CBE0",
  bg: "#0B0C10" // Dark background matching oklch(0.10 0.01 240)
};

/**
 * A highly detailed cybernetic CPU & Tools SVG representing the Dr Tecno brand icons.
 * Features rotating gears, glowing circuits, and crossed micro-soldering tools.
 */
export const LogoIconSVG: React.FC<{ className?: string; size?: number; glow?: boolean }> = ({
  className = "",
  size = 120,
  glow = true
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`${className} ${glow ? "drop-shadow-[0_0_15px_rgba(23,203,224,0.6)]" : ""}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Brand Linear Gradients */}
        <linearGradient id="brand-grad-horizontal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.pink} />
          <stop offset="33%" stopColor={colors.yellow} />
          <stop offset="66%" stopColor={colors.green} />
          <stop offset="100%" stopColor={colors.cyan} />
        </linearGradient>

        <linearGradient id="pink-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.pink} />
          <stop offset="100%" stopColor={colors.cyan} />
        </linearGradient>

        <linearGradient id="yellow-green-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.yellow} />
          <stop offset="100%" stopColor={colors.green} />
        </linearGradient>

        {/* Glow Filters */}
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Symmetrical Electronic Trace Circles (Orbiting Outer Ring) */}
      <motion.circle
        cx="100"
        cy="100"
        r="85"
        stroke="url(#brand-grad-horizontal)"
        strokeWidth="1.5"
        strokeDasharray="8 6 12 4"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      <motion.circle
        cx="100"
        cy="100"
        r="75"
        stroke={colors.cyan}
        strokeWidth="1"
        strokeDasharray="4 8 2 4"
        opacity="0.6"
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Outer circuit connection nodes (4 primary corners) */}
      <circle cx="100" cy="15" r="4" fill={colors.pink} />
      <circle cx="100" cy="185" r="4" fill={colors.green} />
      <circle cx="15" cy="100" r="4" fill={colors.cyan} />
      <circle cx="185" cy="100" r="4" fill={colors.yellow} />

      {/* Crossed Micro-soldering Tools / Brand symbols */}
      {/* Tool 1: Stylized Tech Wrench / Screwdriver (Diagonal Left) */}
      <motion.g
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.85 }}
        transition={{ delay: 0.1 }}
      >
        <line x1="45" y1="45" x2="155" y2="155" stroke="url(#pink-cyan-grad)" strokeWidth="5" strokeLinecap="round" />
        {/* Wrench head */}
        <path d="M 38 38 C 30 46 32 58 42 62 L 50 54 L 54 50 L 46 42 Z" fill={colors.pink} />
        {/* Tool handle end */}
        <circle cx="155" cy="155" r="5" fill={colors.cyan} />
      </motion.g>

      {/* Tool 2: Stylized Precision Electronic Tweezer / Probe (Diagonal Right) */}
      <motion.g
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.85 }}
        transition={{ delay: 0.15 }}
      >
        <line x1="155" y1="45" x2="45" y2="155" stroke="url(#yellow-green-grad)" strokeWidth="4" strokeLinecap="round" />
        {/* Fine probe tip */}
        <path d="M 155 45 L 165 35 L 170 40 L 160 50 Z" fill={colors.yellow} />
        <circle cx="45" cy="155" r="5" fill={colors.green} />
      </motion.g>

      {/* Central Tech Microchip / CPU */}
      <motion.g
        initial={{ scale: 0.6, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        {/* CPU Outer Pin Contacts (Symmetrical micro pins) */}
        {[-30, -15, 0, 15, 30].map((offset) => (
          <React.Fragment key={offset}>
            {/* Top Pins */}
            <rect x={100 + offset - 3} y="52" width="6" height="10" fill={colors.yellow} rx="1" />
            {/* Bottom Pins */}
            <rect x={100 + offset - 3} y="138" width="6" height="10" fill={colors.green} rx="1" />
            {/* Left Pins */}
            <rect x="52" y={100 + offset - 3} width="10" height="6" fill={colors.pink} rx="1" />
            {/* Right Pins */}
            <rect x="138" y={100 + offset - 3} width="10" height="6" fill={colors.cyan} rx="1" />
          </React.Fragment>
        ))}

        {/* main microchip body */}
        <rect
          x="60"
          y="60"
          width="80"
          height="80"
          rx="12"
          fill={colors.bg}
          stroke="url(#brand-grad-horizontal)"
          strokeWidth="3"
          className="shadow-2xl"
        />

        {/* Inner circuit pattern layout */}
        <rect x="70" y="70" width="60" height="60" rx="6" fill="rgba(255,255,255,0.02)" stroke={colors.cyan} strokeWidth="1" strokeDasharray="3 3" />

        {/* Central Glowing Core Reactor (The "Dr" Logo Circle) */}
        <circle
          cx="100"
          cy="100"
          r="20"
          fill="rgba(23, 203, 224, 0.1)"
          stroke="url(#brand-grad-horizontal)"
          strokeWidth="2"
          filter={glow ? "url(#neon-glow)" : undefined}
        />

        {/* Pulse Core Element */}
        <motion.circle
          cx="100"
          cy="100"
          r="10"
          fill={colors.cyan}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Inner Tech Letter "T" (for Tecno) */}
        <text
          x="100"
          y="105"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="14"
          fontWeight="bold"
          fontFamily="monospace"
        >
          T
        </text>
      </motion.g>
    </svg>
  );
};

/**
 * Ultra-lightweight vector brand shape outlines.
 * Built with pure inline SVGs to avoid any heavy image assets or layout thrashing.
 * Perfectly fluid and fast even on lower-end devices.
 */
export const BrandShapeOutline: React.FC<{
  shapeId: string;
  color: string;
  size?: number;
  className?: string;
}> = ({ shapeId, color, size = 100, className = "" }) => {
  if (shapeId === "cyan") {
    // 5-point Star
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="50,10 62,37 91,37 68,54 77,81 50,65 23,81 32,54 9,37 38,37"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Subtle decorative inner dash star */}
        <polygon
          points="50,22 58,41 78,41 62,53 68,72 50,60 32,72 38,53 22,41 42,41"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (shapeId === "green") {
    // 3-pointed Y-sintonizador
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rounded Y connector outline using line paths */}
        <path
          d="M 50,15 L 50,48 M 50,48 L 22,72 M 50,48 L 78,72"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Double-line tech-aesthetic outline detail */}
        <path
          d="M 50,10 L 50,48 M 50,48 L 17,76 M 50,48 L 83,76"
          stroke={color}
          strokeWidth="1.2"
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </svg>
    );
  }

  if (shapeId === "yellow") {
    // Rounded Triangle with center core circle
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Geometric rounded triangle */}
        <path
          d="M 50,12 L 88,78 C 90,81 88,85 84,85 L 16,85 C 12,85 10,81 12,78 Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner circular core */}
        <circle
          cx="50"
          cy="56"
          r="15"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="56"
          r="9"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.6"
        />
      </svg>
    );
  }

  // default to pink: 6-pointed star / Hexagon shape
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 50,10 L 62,31 L 86,31 L 73,51 L 85,72 L 61,72 L 50,93 L 39,72 L 15,72 L 27,51 L 14,31 L 38,31 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Decorative center hexagon core */}
      <polygon
        points="50,38 60,44 60,56 50,62 40,56 40,44"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="1 2"
        opacity="0.5"
      />
    </svg>
  );
};

interface BrandShape {
  id: string;
  color: string;
  label: string;
}

const BRAND_SHAPES: BrandShape[] = [
  { id: "cyan", color: colors.cyan, label: "Estrella Línea" },
  { id: "green", color: colors.green, label: "Sintonizador Y" },
  { id: "yellow", color: colors.yellow, label: "Triángulo Núcleo" },
  { id: "pink", color: colors.pink, label: "Hexágono Línea" }
];

/**
 * Root-level full-screen page transition overlay.
 * Uses a dynamic cyber-portal styled with the official logos acting as frames.
 * Plays zoom-in or zoom-out animations with neon outline strokes matching the selected shape.
 */
export const PageTransitionOverlay: React.FC = () => {
  const { path } = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedShape, setSelectedShape] = useState<BrandShape>(BRAND_SHAPES[0]);
  const [zoomDirection, setZoomDirection] = useState<"in" | "out">("out");

  // Trigger page transition whenever path changes
  useEffect(() => {
    // Pick random shape and zoom direction
    const randomIdx = Math.floor(Math.random() * BRAND_SHAPES.length);
    const randomDir = Math.random() > 0.5 ? "in" : "out";
    
    setSelectedShape(BRAND_SHAPES[randomIdx]);
    setZoomDirection(randomDir);
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 400); // Super-snappy 400ms transition (1/3 of 1.2s)

    return () => clearTimeout(timer);
  }, [path]);

  // Framer Motion Curtain Variants for Portal Entrance/Exit
  const portalBgVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: [0, 1, 1, 0],
      transition: { duration: 0.4, times: [0, 0.15, 0.85, 1], ease: "easeInOut" }
    }
  };

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div 
          key={`portal-${selectedShape.id}-${zoomDirection}`}
          variants={portalBgVariants}
          initial="initial"
          animate="animate"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050608] overflow-hidden select-none pointer-events-auto"
        >
          {/* Subtle tech outline corner framing indicators */}
          <div className="absolute top-8 left-8 border-t border-l w-12 h-12 opacity-20" style={{ borderColor: selectedShape.color }} />
          <div className="absolute top-8 right-8 border-t border-r w-12 h-12 opacity-20" style={{ borderColor: selectedShape.color }} />
          <div className="absolute bottom-8 left-8 border-b border-l w-12 h-12 opacity-20" style={{ borderColor: selectedShape.color }} />
          <div className="absolute bottom-8 right-8 border-b border-r w-12 h-12 opacity-20" style={{ borderColor: selectedShape.color }} />

          {/* 3 Concentric Zooming Line Frames for a lightweight 3D tunnel effect */}
          {[0, 1, 2].map((index) => {
            const delay = index * 0.03;
            
            // Zoom Ranges: smooth exponential hardware-accelerated scales
            const scaleRange = zoomDirection === "out" 
              ? [0.15, 1.2 + index * 0.6, 4.5 + index * 2, 16] 
              : [16, 4.5 + index * 2, 1.2 + index * 0.6, 0];

            const opacityRange = zoomDirection === "out"
              ? [0, 0.8, 0.4, 0]
              : [0, 0.4, 0.8, 0];

            return (
              <motion.div
                key={`tunnel-layer-${index}`}
                initial={{ scale: scaleRange[0], opacity: 0 }}
                animate={{
                  scale: scaleRange,
                  opacity: opacityRange
                }}
                transition={{
                  duration: 0.33,
                  delay: delay,
                  ease: "easeInOut",
                  times: [0, 0.35, 0.75, 1]
                }}
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  width: "280px",
                  height: "280px"
                }}
              >
                {/* Clean inline SVG circular layout */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="47" 
                    stroke={selectedShape.color} 
                    strokeWidth="0.8" 
                    fill="none" 
                    strokeDasharray="2 6"
                    opacity={0.6 - index * 0.15}
                  />
                </svg>

                {/* Lightweight Vector Shape Outline */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <BrandShapeOutline
                    shapeId={selectedShape.id}
                    color={selectedShape.color}
                    size={160}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* HUD Tech Status Label */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="px-3.5 py-1 rounded-md border bg-black/40 backdrop-blur-sm flex items-center gap-2 font-mono text-[9px] tracking-widest text-muted-foreground uppercase"
              style={{ borderColor: `${selectedShape.color}22` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedShape.color }} />
              <span style={{ color: selectedShape.color }} className="font-bold">
                {selectedShape.label}
              </span>
              <span>•</span>
              <span>ZOOM {zoomDirection === "out" ? "OUT" : "IN"}</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Container-level localized transitions for tab switcher ("viñetas") or sliders.
 * Wrap your content or put this component inside a 'relative overflow-hidden' container,
 * and pass the trigger key (like activeTab state). It plays a super clean brand zoom frame transition.
 */
export const LocalLogoTransition: React.FC<{ triggerKey: string }> = ({ triggerKey }) => {
  const [prevKey, setPrevKey] = useState(triggerKey);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedShape, setSelectedShape] = useState<BrandShape>(BRAND_SHAPES[0]);

  useEffect(() => {
    if (triggerKey !== prevKey) {
      // Determine shape based on string character sum to keep it deterministic but variety-rich
      const charSum = triggerKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      setSelectedShape(BRAND_SHAPES[charSum % BRAND_SHAPES.length]);
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPrevKey(triggerKey);
      }, 200); // Snap 0.2s local zoom transition

      return () => clearTimeout(timer);
    }
  }, [triggerKey, prevKey]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.2, times: [0, 0.15, 0.85, 1] }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-[#050608]/90 backdrop-blur-[2px] pointer-events-none overflow-hidden rounded-xl"
        >
          {/* Zoom frame portal layer */}
          <motion.div
            initial={{ scale: 0.15, opacity: 0 }}
            animate={{
              scale: [0.15, 1.4, 4],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 0.18,
              ease: "easeInOut",
              times: [0, 0.45, 1]
            }}
            className="w-24 h-24 flex items-center justify-center"
          >
            <BrandShapeOutline
              shapeId={selectedShape.id}
              color={selectedShape.color}
              size={90}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
