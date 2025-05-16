import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Enhanced particle types with better descriptions
type ParticleType = "confetti" | "balloon" | "star" | "heart" | "emoji";

// Configuration options for the popper animation
interface PopperConfigOptions {
  /** Number of particles to create */
  count?: number;
  /** Gravity effect (speed of falling) */
  gravity?: number;
  /** Initial velocity range */
  speed?: number;
  /** Particle size range */
  size?: [number, number];
  /** Duration of the animation in milliseconds (0 for infinite) */
  duration?: number;
  /** Custom colors array (or default will be used) */
  colors?: string[];
  /** Emoji to use (when type is 'emoji') */
  emoji?: string;
  /** Origin point for the animation (default is bottom center) */
  origin?: { x: number; y: number } | "center" | "mouse";
  /** Spread angle in degrees (how wide the particles spread) */
  spread?: number;
}

// Main configuration type that specifies which particle types to use and their options
type PopperConfig = Partial<
  Record<ParticleType, boolean | PopperConfigOptions>
>;

// Context type for the confetti popper
interface ConfettiPopperContextType {
  triggerConfettiPopper: (config?: PopperConfig) => void;
  stopAnimation: () => void;
  isAnimating: boolean;
}

// Create the context with default values
const ConfettiPopperContext = createContext<ConfettiPopperContextType>({
  triggerConfettiPopper: () => {},
  stopAnimation: () => {},
  isAnimating: false,
});

// Hook for using the confetti popper
export const useConfettiPopper = () => {
  const ctx = useContext(ConfettiPopperContext);
  if (!ctx) {
    throw new Error(
      "useConfettiPopper must be used within a ConfettiPopperProvider"
    );
  }
  return ctx;
};

// Confetti shapes enum
enum ConfettiShape {
  RECTANGLE = "rectangle",
  SQUARE = "square",
  CIRCLE = "circle",
  TRIANGLE = "triangle",
  STRIP = "strip",
}

// Enhanced particle type with more properties
export type Particle = {
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  wobble?: number;
  wobbleSpeed?: number;
  wobbleAmplitude?: number;
  gravity: number;
  drag: number;
  emoji?: string;
  createdAt: number;
  duration: number;
  confettiShape?: ConfettiShape;
  shimmerOffset?: number;
};

// Default configuration values
const DEFAULT_CONFIG: Record<ParticleType, PopperConfigOptions> = {
  confetti: {
    count: 150,
    gravity: 0.15,
    speed: 8,
    size: [5, 15],
    duration: 4000,
    spread: 80,
    colors: [
      "255,50,50",
      "50,100,255",
      "255,100,255",
      "100,255,100",
      "255,255,50",
      "255,150,50",
    ],
  },
  balloon: {
    count: 12,
    gravity: -0.1,
    speed: 8,
    size: [30, 60],
    duration: 6000,
    spread: 180,
    colors: [
      "255,50,50",
      "50,100,255",
      "255,100,255",
      "100,255,100",
      "255,200,50",
    ],
  },
  star: {
    count: 50,
    gravity: 0.07,
    speed: 8,
    size: [20, 26],
    duration: 4000,
    spread: 90,
  },
  heart: {
    count: 40,
    gravity: 0.07,
    speed: 8,
    size: [20, 42],
    duration: 4000,
    colors: ["255,0,100", "255,50,150", "200,0,50"],
    spread: 90,
  },
  emoji: {
    count: 35,
    gravity: 0.1,
    speed: 8,
    size: [20, 30],
    duration: 4000,
    emoji: "🎉",
    spread: 90,
  },
};

// Default colors for particles
const DEFAULT_COLORS = [
  "255,0,0", // Red
  "0,255,0", // Green
  "0,0,255", // Blue
  "255,255,0", // Yellow
  "255,0,255", // Magenta
  "0,255,255", // Cyan
  "255,165,0", // Orange
  "128,0,128", // Purple
];

// Main provider component
export const ConfettiPopperProvider: React.FC<{
  children: React.ReactNode;
  maxParticles?: number;
  disableOnLowPerformance?: boolean;
}> = ({ children, maxParticles = 500, disableOnLowPerformance = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsRef = useRef<number[]>([]);
  const poorPerformanceDetectedRef = useRef<boolean>(false);

  // Function to handle window resize
  const handleResize = useCallback(() => {
    if (canvasRef.current) {
      const pixelRatio = window.devicePixelRatio || 1;
      canvasRef.current.width = window.innerWidth * pixelRatio;
      canvasRef.current.height = window.innerHeight * pixelRatio;

      // Set CSS size
      canvasRef.current.style.width = `${window.innerWidth}px`;
      canvasRef.current.style.height = `${window.innerHeight}px`;

      // Scale the context
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.scale(pixelRatio, pixelRatio);
      }
    }
  }, []);

  // Mouse position tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [handleResize, handleMouseMove]);

  // Generate a random color
  const generateColor = useCallback((colors?: string[]) => {
    const colorArray = colors && colors.length > 0 ? colors : DEFAULT_COLORS;
    return colorArray[Math.floor(Math.random() * colorArray.length)];
  }, []);

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      // FPS calculation for performance monitoring
      const deltaTime = timestamp - (lastFrameTimeRef.current || timestamp);
      lastFrameTimeRef.current = timestamp;

      const fps = 1000 / deltaTime;
      fpsRef.current.push(fps);
      if (fpsRef.current.length > 30) {
        fpsRef.current.shift();

        // Check if performance is poor (below 30fps for 30 frames)
        const avgFps =
          fpsRef.current.reduce((sum, curr) => sum + curr, 0) /
          fpsRef.current.length;
        if (
          disableOnLowPerformance &&
          avgFps < 30 &&
          particlesRef.current.length > 50
        ) {
          poorPerformanceDetectedRef.current = true;
          particlesRef.current = particlesRef.current.slice(0, 50);
        }
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const now = Date.now();
      let hasVisibleParticles = false;

      particlesRef.current.forEach((p) => {
        // Apply physics based on particle type
        if (p.type === "confetti") {
          // More dynamic confetti movement
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 1 - p.drag;
          p.rotation += p.rotationSpeed;

          // Shimmer effect for confetti
          if (p.shimmerOffset !== undefined) {
            p.shimmerOffset += 0.1;
          }

          // Duration-based fade out
          const age = now - p.createdAt;
          if (p.duration > 0) {
            p.alpha = Math.max(0, 1 - age / p.duration);
          }
        } else if (p.type === "balloon") {
          // More natural balloon movement with varying wobble
          p.x += Math.sin(p.wobble ?? 0) * (p.wobbleAmplitude ?? 1.5);
          p.y += p.vy;
          p.wobble = (p.wobble ?? 0) + (p.wobbleSpeed ?? 0.05);

          // Duration-based fade out
          const age = now - p.createdAt;
          if (p.duration > 0) {
            p.alpha = Math.max(0, 1 - age / p.duration);
          }
        } else if (p.type === "emoji") {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 1 - p.drag;
          p.rotation += p.rotationSpeed;

          // Duration-based fade out
          const age = now - p.createdAt;
          if (p.duration > 0) {
            p.alpha = Math.max(0, 1 - age / p.duration);
          }
        } else {
          // star and heart
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 1 - p.drag;
          p.rotation += p.rotationSpeed;

          // Duration-based fade out
          const age = now - p.createdAt;
          if (p.duration > 0) {
            p.alpha = Math.max(0, 1 - age / p.duration);
          }
        }

        // Only draw if still visible
        if (p.alpha > 0) {
          hasVisibleParticles = true;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha;

          if (p.type === "confetti") {
            // Apply shimmer effect if available
            let baseColor = p.color;
            if (p.shimmerOffset !== undefined) {
              const shimmerIntensity = Math.sin(p.shimmerOffset) * 0.5 + 0.5;
              const colorParts = baseColor.split(",").map(Number);
              baseColor = colorParts
                .map((val, i) => {
                  if (i < 3) {
                    return Math.min(
                      255,
                      Math.floor(val + shimmerIntensity * 100)
                    );
                  }
                  return val;
                })
                .join(",");
            }

            // Draw different confetti shapes
            ctx.fillStyle = `rgba(${baseColor},1)`;

            if (p.confettiShape === ConfettiShape.RECTANGLE) {
              ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            } else if (p.confettiShape === ConfettiShape.SQUARE) {
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.confettiShape === ConfettiShape.CIRCLE) {
              ctx.beginPath();
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
              ctx.fill();
            } else if (p.confettiShape === ConfettiShape.TRIANGLE) {
              ctx.beginPath();
              ctx.moveTo(-p.size / 2, p.size / 2);
              ctx.lineTo(p.size / 2, p.size / 2);
              ctx.lineTo(0, -p.size / 2);
              ctx.closePath();
              ctx.fill();
            } else if (p.confettiShape === ConfettiShape.STRIP) {
              // Thin, elongated strip
              ctx.fillRect(-p.size, -p.size / 8, p.size * 2, p.size / 4);
            }

            // Add metallic edge highlight for extra pop
            ctx.strokeStyle = `rgba(255,255,255,${p.alpha * 0.5})`;
            ctx.lineWidth = 1;
            if (p.confettiShape === ConfettiShape.RECTANGLE) {
              ctx.strokeRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            }
          } else if (p.type === "balloon") {
            // Draw a more realistic balloon
            const balloonWidth = p.size * 0.7;
            const balloonHeight = p.size;

            // Create gradient for 3D effect
            const gradient = ctx.createRadialGradient(
              -balloonWidth / 4,
              -balloonHeight / 4,
              0,
              -balloonWidth / 4,
              -balloonHeight / 4,
              balloonWidth * 1.5
            );
            gradient.addColorStop(0, `rgba(${p.color},1)`);
            gradient.addColorStop(
              0.8,
              `rgba(${p.color
                .split(",")
                .map((c, i) => (i < 3 ? Math.max(0, parseInt(c) - 40) : c))
                .join(",")},1)`
            );

            // Draw balloon body
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);

            // Left side of balloon
            ctx.bezierCurveTo(
              -balloonWidth,
              -balloonHeight / 4,
              -balloonWidth,
              -balloonHeight,
              0,
              -balloonHeight
            );

            // Right side of balloon
            ctx.bezierCurveTo(
              balloonWidth,
              -balloonHeight,
              balloonWidth,
              -balloonHeight / 4,
              0,
              0
            );

            ctx.fill();

            // Draw highlight
            ctx.fillStyle = `rgba(255,255,255,0.2)`;
            ctx.beginPath();
            ctx.ellipse(
              -balloonWidth / 3,
              -balloonHeight / 2,
              balloonWidth / 4,
              balloonHeight / 5,
              Math.PI / 4,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Draw knot at bottom
            ctx.fillStyle = `rgba(${p.color
              .split(",")
              .map((c, i) => (i < 3 ? Math.max(0, parseInt(c) - 60) : c))
              .join(",")},1)`;
            ctx.beginPath();
            ctx.ellipse(
              0,
              balloonHeight / 10,
              balloonWidth / 6,
              balloonHeight / 12,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Draw string (wavy string for better effect)
            ctx.strokeStyle = `rgba(210,210,210,${p.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, balloonHeight / 8);

            // Create a wavy string effect
            const stringLength = balloonHeight + 15;
            const waves = 3;
            const amplitude = 5;

            for (let i = 0; i <= waves; i++) {
              const y = balloonHeight / 8 + (stringLength / waves) * i;
              const x = i % 2 === 0 ? amplitude : -amplitude;

              ctx.quadraticCurveTo(
                x * 1.5,
                y - stringLength / (waves * 2),
                x,
                y
              );
            }

            ctx.stroke();
          } else if (p.type === "star") {
            ctx.fillStyle = `rgba(${p.color},1)`;
            ctx.beginPath();

            // Draw a 5-pointed star
            for (let i = 0; i < 5; i++) {
              const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
              const innerAngle = outerAngle + Math.PI / 5;

              const outerX = (Math.cos(outerAngle) * p.size) / 2;
              const outerY = (Math.sin(outerAngle) * p.size) / 2;

              const innerX = (Math.cos(innerAngle) * p.size) / 5;
              const innerY = (Math.sin(innerAngle) * p.size) / 5;

              if (i === 0) {
                ctx.moveTo(outerX, outerY);
              } else {
                ctx.lineTo(outerX, outerY);
              }

              ctx.lineTo(innerX, innerY);
            }

            ctx.closePath();
            ctx.fill();
          } else if (p.type === "heart") {
            ctx.fillStyle = `rgba(${p.color},1)`;
            ctx.beginPath();
            const s = p.size / 3;

            // Draw heart shape
            ctx.moveTo(0, s);
            ctx.bezierCurveTo(s, -s, 2.5 * s, 0, 0, 2.5 * s);
            ctx.bezierCurveTo(-2.5 * s, 0, -s, -s, 0, s);
            ctx.fill();
          } else if (p.type === "emoji") {
            ctx.font = `${p.size}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(p.emoji || "🎉", 0, 0);
          }

          ctx.restore();
        }
      });

      // Remove invisible particles
      particlesRef.current = particlesRef.current.filter(
        (p) => p.alpha > 0 && p.y < window.innerHeight + 100 && p.y > -100
      );

      if (hasVisibleParticles) {
        frameRef.current = requestAnimationFrame(animate);
        setIsAnimating(true);
      } else {
        frameRef.current = null;
        setIsAnimating(false);
      }
    },
    [disableOnLowPerformance]
  );

  // Stop animation function
  const stopAnimation = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    particlesRef.current = [];
    setIsAnimating(false);
  }, []);

  // Get origin coordinates based on config
  const getOrigin = useCallback(
    (origin: { x: number; y: number } | "center" | "mouse" | undefined) => {
      if (!origin || origin === "center") {
        return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      } else if (origin === "mouse") {
        return { x: mousePositionRef.current.x, y: mousePositionRef.current.y };
      } else {
        return {
          x: origin.x * window.innerWidth,
          y: origin.y * window.innerHeight,
        };
      }
    },
    []
  );

  // Function to trigger the confetti animation
  const triggerConfettiPopper = useCallback(
    (config: PopperConfig = { confetti: true }) => {
      // If poor performance detected, limit the number of particles
      if (poorPerformanceDetectedRef.current) {
        Object.keys(config).forEach((key) => {
          const type = key as ParticleType;
          if (config[type] && typeof config[type] === "object") {
            (config[type] as PopperConfigOptions).count = Math.min(
              (config[type] as PopperConfigOptions).count ||
                DEFAULT_CONFIG[type].count ||
                20,
              20
            );
          }
        });
      }

      // Don't exceed max particles
      if (particlesRef.current.length >= maxParticles) {
        particlesRef.current = particlesRef.current.slice(-maxParticles / 2);
      }

      const now = Date.now();
      const newParticles: Particle[] = [];

      // Process each particle type in the config
      Object.entries(config).forEach(([typeKey, typeConfig]) => {
        if (!typeConfig) return;

        const type = typeKey as ParticleType;
        const options: PopperConfigOptions =
          typeof typeConfig === "boolean"
            ? DEFAULT_CONFIG[type]
            : { ...DEFAULT_CONFIG[type], ...typeConfig };

        const {
          count = DEFAULT_CONFIG[type].count || 50,
          gravity = DEFAULT_CONFIG[type].gravity || 0.1,
          speed = DEFAULT_CONFIG[type].speed || 3,
          size: sizeRange = DEFAULT_CONFIG[type].size || [5, 15],
          duration = DEFAULT_CONFIG[type].duration || 3000,
          colors = DEFAULT_CONFIG[type].colors,
          emoji = DEFAULT_CONFIG[type].emoji || "🎉",
          origin: originConfig = { x: 0.5, y: 0.9 },
          spread = DEFAULT_CONFIG[type].spread || 60,
        } = options;

        const origin = getOrigin(originConfig);
        const spreadRadians = (spread * Math.PI) / 180;

        for (let i = 0; i < count; i++) {
          const angle =
            Math.random() * spreadRadians - spreadRadians / 2 + Math.PI / 2;
          const speedValue = Math.random() * speed + speed / 2;

          const particle: Particle = {
            type,
            x: origin.x,
            y: origin.y,
            vx: Math.cos(angle) * speedValue,
            vy: -Math.sin(angle) * speedValue,
            size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
            color: generateColor(colors),
            alpha: 1,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            gravity,
            drag: 0.02,
            createdAt: now,
            duration,
          };

          // Add type-specific properties
          if (type === "balloon") {
            particle.wobble = Math.random() * Math.PI * 2;
            particle.wobbleSpeed = Math.random() * 0.05 + 0.02;
            particle.wobbleAmplitude = Math.random() * 2 + 1;
            particle.vy = -Math.random() * 1.5 - 0.5;
            particle.vx = (Math.random() - 0.5) * 0.5;

            // Generate bright, vibrant balloon colors if not specified
            if (!colors) {
              particle.color = `${Math.floor(
                Math.random() * 55 + 200
              )},${Math.floor(Math.random() * 55 + 150)},${Math.floor(
                Math.random() * 55 + 200
              )}`;
            }
          } else if (type === "emoji") {
            particle.emoji = emoji;
          }

          newParticles.push(particle);
        }
      });

      // Add new particles to the existing ones
      particlesRef.current = [...particlesRef.current, ...newParticles];

      // Start animation if not already running
      if (!frameRef.current) {
        lastFrameTimeRef.current = 0;
        fpsRef.current = [];
        frameRef.current = requestAnimationFrame(animate);
      }
    },
    [animate, generateColor, getOrigin, maxParticles]
  );

  return (
    <ConfettiPopperContext.Provider
      value={{
        triggerConfettiPopper,
        stopAnimation,
        isAnimating,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
      {children}
    </ConfettiPopperContext.Provider>
  );
};

// Simple example button component that uses the confetti popper
export const ConfettiButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  type?: ParticleType | "all";
  options?: PopperConfigOptions;
  className?: string;
}> = ({ onClick, children, type = "confetti", options, className = "" }) => {
  const { triggerConfettiPopper } = useConfettiPopper();

  const handleClick = (e: React.MouseEvent) => {
    // Create a config where the origin is at the button position
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: rect.top / window.innerHeight,
    };

    // Configure the animation based on the type
    const config: PopperConfig = {};

    if (type === "all") {
      config.confetti = { ...options, origin };
      config.star = { ...options, origin };
      config.heart = { ...options, origin };
      config.emoji = { ...options, emoji: "🎉", origin };
    } else {
      config[type] = { ...options, origin };
    }

    triggerConfettiPopper(config);
    onClick?.();
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};
