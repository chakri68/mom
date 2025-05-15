import React, { useEffect, useRef, useState } from "react";
import "./Cake.scss";
import { AnimatePresence, motion } from "framer-motion";
import { useSoundDetection } from "@/app/hooks/useSoundDetection";
import Candle from "./Candle";
import { usePopperAnimation } from "../../context/PopperContext";
import CakeOverlay from "../TriggerOverlay";
import ConfettiCanvas from "../TopdownConfetti";

export default function Cake() {
  const { blowStrength, startListening } = useSoundDetection({
    threshold: 0.08,
    smoothingFactor: 0.3,
  });
  const triggerTimer = useRef<NodeJS.Timeout | null>(null);

  const [triggered, setTriggered] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const triggerCooldown = 0.5; // seconds
  const threshold = 0.08; // Minimum blow strength to trigger the popper

  // Set isReady after a short delay to allow entrance animation to complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      startListening?.(); // Start listening for blowing once component is mounted
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const triggerPopper = usePopperAnimation();

  useEffect(() => {
    if (blowStrength > threshold && !triggered && isReady) {
      // Trigger the true state in triggerCooldown seconds
      if (!triggerTimer.current)
        triggerTimer.current = setTimeout(() => {
          setTriggered(true);
        }, triggerCooldown * 1000);
      triggerPopper();
    }
  }, [blowStrength, isReady]);

  const handleRestart = () => {
    // Reset the triggered state
    setTriggered(false);

    // Clear any existing timer
    if (triggerTimer.current) {
      clearTimeout(triggerTimer.current);
      triggerTimer.current = null;
    }

    // Add any additional reset logic here
    // For example, you might want to reset the popper animation too
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        backgroundColor: "#0d0d0d", // darker than #333
        backgroundImage: `
          radial-gradient(circle at center, rgba(255, 105, 180, 0.05) 0%, transparent 50%),
          radial-gradient(circle at top left, rgba(0, 255, 255, 0.05), transparent 60%)
        `,
        boxShadow: `
          inset 0 0 80px rgba(255, 105, 180, 0.08),
          inset 0 0 100px rgba(0, 255, 255, 0.04)
        `,
        fontSize: "1.5rem",
        position: "relative",
        overflow: "hidden", // to contain the canvas glow
      }}
    >
      {/* Overlay Component */}
      <CakeOverlay isVisible={triggered} onRestart={handleRestart} />

      <motion.div
        className="cake-container"
        initial={{ opacity: 0, scale: 0.8, y: "-50%", x: "-50%" }}
        animate={{
          opacity: 1,
          scale: triggered ? 1.6 : 2,
          top: triggered ? "58%" : "50%",
        }}
        style={{
          position: "absolute",
          width: "250px",
          height: "200px",
          top: "50%",
          left: "50%",
          transformOrigin: "center center",
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className="cake">
          <div className="plate" />
          <div className="layer layer-bottom" />
          <div className="layer layer-middle" />
          <div className="layer layer-top" />
          <div className="icing" />
          <div className="drip drip1" />
          <div className="drip drip2" />
          <div className="drip drip3" />
          <div className="candle">
            <Candle
              blowStrength={Math.min(blowStrength * 6, 1)}
              noFlame={triggered}
            />
          </div>
        </div>
      </motion.div>

      {/* Instructions text */}
      {!triggered && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 3 }}
          style={{
            color: "white",
            marginTop: "2rem",
            fontSize: "1.2rem",
            textAlign: "center",
            opacity: 0.8,
            maxWidth: "80%",
            position: "absolute",
            bottom: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
            textShadow: "0 0 5px rgba(255, 255, 255, 0.2)",
          }}
        >
          Blow out the candle!
        </motion.p>
      )}
      <AnimatePresence>
        {triggered && (
          <>
            <ConfettiCanvas />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
