import type { ComponentProps, PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * A glass card that tilts toward a real pointer and lifts on hover. Touch
 * and pen get no tilt, so nothing sticks after a tap. Reduced motion is
 * handled by the app-wide MotionConfig.
 */
export function TiltCard({ className = "", children, ...rest }: ComponentProps<typeof motion.div>) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 180, damping: 18 };
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), spring);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), spring);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      className={`tilt glass ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
