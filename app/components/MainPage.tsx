"use client";

import { Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Cake from "./Cake";
import WelcomeScreen from "./WelcomeScreen";
import { PopperAnimationProvider } from "../context/PopperContext";
import { ConfigProvider } from "../context/ConfigContext";

function Fallback() {
  return (
    <div style={{ color: "white", fontSize: "1.5rem", textAlign: "center" }}>
      Loading configuration...
    </div>
  );
}

export default function MothersDay() {
  const [showCake, setShowCake] = useState(false);

  const handleContinue = () => {
    setShowCake(true);
  };

  return (
    <Suspense fallback={<Fallback />}>
      <ConfigProvider>
        <PopperAnimationProvider>
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: "100vw",
              height: "100vh",
              margin: 0,
              padding: 0,
              backgroundColor: "#333",
              fontSize: "1.5rem",
              overflow: "hidden", // Prevent any potential scrolling issues
              position: "relative", // For proper overlay positioning
            }}
          >
            <AnimatePresence mode="wait">
              {!showCake ? (
                <WelcomeScreen key="welcome" onContinue={handleContinue} />
              ) : (
                <Cake key="cake" />
              )}
            </AnimatePresence>
          </div>
        </PopperAnimationProvider>
      </ConfigProvider>
    </Suspense>
  );
}
