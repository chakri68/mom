import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfig } from "../context/ConfigContext";

export type CakeOverlayProps = {
  isVisible: boolean;
  onRestart: () => void;
};

export default function CakeOverlay({
  isVisible,
  onRestart,
}: CakeOverlayProps) {
  const [greetingsText, setGreetingsText] = useState("");
  const [subGreetingsText, setSubGreetingsText] = useState("");
  const [glowColor, setGlowColor] = useState("#FFA500");
  const { get } = useConfig();

  useEffect(() => {
    setGreetingsText(get("greetings_text", "Happy Mother's Day Ma!!"));
    setSubGreetingsText(get("sub_greetings_text", "You're the best!"));
    setGlowColor(get("background_color", "#FF69B4"));
  }, []);

  // Utility: convert hex to rgba with opacity
  const hexToRgba = (hex: string, alpha: number) => {
    const raw = hex.replace("#", "");
    const bigint = parseInt(raw, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const glowRGBA = hexToRgba(glowColor, 0.7);
  const glowRGBA_faint = hexToRgba(glowColor, 0.4);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(circle at center, ${hexToRgba(
              glowColor,
              0.15
            )}, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 10,
            padding: "2rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="greetings-text"
            style={{
              fontSize: "3rem",
              fontWeight: 700,
              color: "#fff",
              textAlign: "center",
              textShadow: `0 0 10px ${glowRGBA}`,
              marginTop: "4rem",
              animation: "float 4s ease-in-out infinite",
            }}
          >
            {greetingsText}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            style={{
              fontSize: "1.25rem",
              color: "#ffdef0",
              textAlign: "center",
              marginTop: "1rem",
              maxWidth: "80%",
              textShadow: `0 0 6px ${glowRGBA_faint}`,
            }}
          >
            {subGreetingsText}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            onClick={onRestart}
            className="restart-button"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.75rem",
              backgroundColor: glowColor,
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              pointerEvents: "auto",
              marginTop: "auto",
              marginBottom: "1rem",
              animation: "pulse 2s ease-in-out infinite",
              boxShadow: `
                0 0 5px ${glowColor},
                0 0 10px ${glowColor},
                0 0 20px ${glowColor},
                0 0 30px ${glowRGBA}
              `,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            whileHover={{
              scale: 1.1,
              boxShadow: `
                0 0 6px ${glowColor},
                0 0 12px ${glowColor},
                0 0 24px ${glowColor},
                0 0 36px ${glowRGBA}
              `,
            }}
            whileTap={{ scale: 0.9 }}
          >
            Make Another Wish
          </motion.button>

          {/* Floating and pulse keyframes */}
          <style jsx>{`
            @keyframes float {
              0% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-10px);
              }
              100% {
                transform: translateY(0);
              }
            }
            @keyframes pulse {
              0% {
                box-shadow: 0 0 0 0 ${glowRGBA};
              }
              70% {
                box-shadow: 0 0 0 10px ${hexToRgba(glowColor, 0)};
              }
              100% {
                box-shadow: 0 0 0 0 ${hexToRgba(glowColor, 0)};
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
