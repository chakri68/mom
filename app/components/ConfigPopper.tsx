"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Config, ConfigKeys } from "../context/ConfigContext";
import { snakeCaseToNormalText } from "../util";

export default function ConfigPopup({
  onSave,
  isOpen,
  onClose,
}: {
  onSave: (config: Config) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Config>({
    defaultValues: {
      // Yellow
      background_color: "#FFEA00",
      greetings_text: "Happy Mother's Day Ma!!",
      sub_greetings_text: "You're the best!",
      sender_name: "Someone special",
      welcome_message: "has a surprise for you",
    },
  });

  const onSubmit = (data: Config) => {
    onSave(data);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "#1e1e1e",
              color: "#f1f1f1",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow: "0 0 30px rgba(255, 105, 180, 0.5)",
              width: "90%",
              maxWidth: "500px",
              textAlign: "center",
              fontFamily: "monospace",
            }}
          >
            <h2 style={{ marginBottom: "1rem", color: "#FF69B4" }}>
              Set Up Your Surprise 🎁
            </h2>

            <form onSubmit={handleSubmit(onSubmit)}>
              {ConfigKeys.map((key) => (
                <div
                  key={key}
                  style={{ marginBottom: "1rem", textAlign: "left" }}
                >
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.3rem",
                      color: "#FFB6C1",
                    }}
                  >
                    {key}
                  </label>
                  <input
                    type="text"
                    {...register(key as keyof Config, {
                      required: key !== "background_color",
                    })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "10px",
                      border: "1px solid #444",
                      backgroundColor: "#2c2c2c",
                      color: "#fff",
                    }}
                  />
                  {errors[key as keyof Config] && (
                    <span style={{ color: "#ff4d6d", fontSize: "0.8rem" }}>
                      {snakeCaseToNormalText(key)} is required.
                    </span>
                  )}
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                }}
              >
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#FF69B4",
                    color: "#fff",
                    border: "none",
                    padding: "0.7rem 1.5rem",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 0 10px #FF69B4",
                    transition: "all 0.2s ease",
                  }}
                >
                  Save & Start
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: "#444",
                    color: "#fff",
                    border: "none",
                    padding: "0.7rem 1.5rem",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
