"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { decodeBase64Json, encodeBase64Json } from "../util";
import ConfigPopup from "../components/ConfigPopper";

export const ConfigKeys = [
  "sender_name",
  "welcome_message",
  "greetings_text",
  "sub_greetings_text",
  "background_color",
] as const;

export type Config = {
  [K in (typeof ConfigKeys)[number]]: string | undefined;
};

type ConfigKey = (typeof ConfigKeys)[number];

interface ConfigContextType {
  get: <T extends ConfigKey>(
    key: T,
    fallback: NonNullable<Config[T]>
  ) => NonNullable<Config[T]>;
  set: <T extends ConfigKey>(key: T, value: NonNullable<Config[T]>) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const configStr = searchParams?.get("config");
  const resetConfig = searchParams?.get("reset_config");

  // Remove all the query params from the URL
  if (resetConfig) {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.delete("reset_config");
    const url = new URL(window.location.href);
    url.search = queryParams.toString();
    router.replace(url.toString());
  }

  const [version, setVersion] = useState(0);
  const [configPopupOpen, setConfigPopupOpen] = useState(false);
  const [config, setConfig] = useState<Config>(() => {
    if (resetConfig) {
      // If reset_config is present, clear localStorage and return default config
      localStorage.clear();
    }

    if (typeof configStr === "string") {
      // Decode the config parameter
      const config = decodeBase64Json<Config>(configStr);
      return config;
    }

    // Get all keys from localStorage
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("app_config_")
    );
    // Map the keys to their corresponding values
    const result: Config = {} as Config;
    keys.forEach((key) => {
      const configKey = key.replace("app_config_", "") as ConfigKey;
      const value = localStorage.getItem(key);
      if (value) {
        result[configKey] = value;
      }
    });

    if (Object.keys(result).length === 0) {
      // If no config is found in localStorage, open the popcup to ask for config values
      setConfigPopupOpen(true);
    }

    return result;
  });

  const get = <T extends ConfigKey>(
    key: T,
    fallback: NonNullable<Config[T]>
  ): NonNullable<Config[T]> => {
    return (config[key] ?? fallback) as NonNullable<Config[T]>;
  };

  const set = <T extends ConfigKey>(key: T, value: NonNullable<Config[T]>) => {
    localStorage.setItem(`app_config_${key}`, value);
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setVersion((prev) => prev + 1);
    const url = new URL(window.location.href);
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.delete("config");
    queryParams.delete("reset_config");
    url.search = queryParams.toString();
    queryParams.set("config", encodeBase64Json(config));
    url.search = queryParams.toString();
    router.replace(url.toString());
  }, [config]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-expect-error TypeScript doesn't know about window.setContext and window.getContext
      window.setContext = <T extends ConfigKey>(
        key: T,
        value: NonNullable<Config[T]>
      ) => {
        set(key, value);
      };

      // @ts-expect-error TypeScript doesn't know about window.setContext and window.getContext
      window.getContext = <T extends ConfigKey>(
        key: T,
        fallback: NonNullable<Config[T]>
      ): NonNullable<Config[T]> => {
        return get(key, fallback);
      };
    }
  }, [config]);

  const handleInitialSave = (newConfig: Config) => {
    Object.entries(newConfig).forEach(([key, value]) => {
      localStorage.setItem(`app_config_${key}`, value as string);
    });
    setConfig(newConfig as Config);
    setConfigPopupOpen(false);
  };

  return (
    <ConfigContext.Provider value={{ get, set }}>
      <div
        style={{
          display: "contents",
        }}
        key={version}
      >
        {children}
      </div>
      <ConfigPopup
        onSave={handleInitialSave}
        isOpen={configPopupOpen}
        onClose={() => setConfigPopupOpen(false)}
      />
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
