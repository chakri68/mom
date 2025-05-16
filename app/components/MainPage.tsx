"use client";

import { Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import WelcomeScreen from "./WelcomeScreen";
import { ConfigProvider } from "../context/ConfigContext";
import { ConfettiPopperProvider } from "../context/PopperContext";
import Cake from "./Cake";

function Fallback() {
  return (
    <div
      style={{
        color: "white",
        fontSize: "1.5rem",
        textAlign: "center",
        width: "100vw",
        height: "100vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "#333",
      }}
    >
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
        <ConfettiPopperProvider>
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
        </ConfettiPopperProvider>
      </ConfigProvider>
    </Suspense>
  );
}
