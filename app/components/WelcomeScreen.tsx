import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useConfig } from "../context/ConfigContext";

export type WelcomeScreenProps = {
  onContinue: () => void;
};

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [glowColor, setGlowColor] = useState("#FFA500");
  const { get } = useConfig();

  const headingGlowControls = useAnimation();
  const buttonGlowControls = useAnimation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = get("sender_name", "Someone special");
      const storedMessage = get("welcome_message", "has a surprise for you");
      const storedGlowColor = get("background_color", "#FFA500");
      const greeting = get("greetings_text", "Greetings!");
      setGlowColor(storedGlowColor);
      setSenderName(storedName);
      setWelcomeMessage(storedMessage);
      if (greeting) {
        document.title = `${greeting}!!`;
      }
    }
  }, []);

  useEffect(() => {
    headingGlowControls.start({
      textShadow: [
        `0 0 5px ${glowColor}, 0 0 10px ${glowColor}, 0 0 20px ${glowColor}`,
        `0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
        `0 0 5px ${glowColor}, 0 0 10px ${glowColor}, 0 0 20px ${glowColor}`,
      ],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut",
      },
    });

    buttonGlowControls.start({
      boxShadow: [
        `0 0 10px ${glowColor}, 0 0 20px ${glowColor}`,
        `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
        `0 0 10px ${glowColor}, 0 0 20px ${glowColor}`,
      ],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut",
      },
    });
  }, [glowColor, headingGlowControls, buttonGlowControls]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at center, #111 0%, #000 100%)",
        zIndex: 20,
        gap: "3rem",
        padding: "2rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{ textAlign: "center", maxWidth: "80%" }}
      >
        <motion.h1
          animate={headingGlowControls}
          style={{
            fontSize: "3rem",
            color: glowColor,
            marginBottom: "1rem",
            fontWeight: "bold",
          }}
        >
          {senderName}
        </motion.h1>

        <motion.p
          style={{
            fontSize: "2rem",
            color: "#eee",
            marginBottom: "1rem",
            textShadow: "0 0 5px rgba(255, 255, 255, 0.2)",
          }}
        >
          {welcomeMessage}
        </motion.p>

        <motion.button
          animate={buttonGlowControls}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onContinue}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            backgroundColor: glowColor,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            marginTop: "1rem",
          }}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
