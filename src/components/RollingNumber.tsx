"use client";

import { motion } from "framer-motion";

interface RollingNumberProps {
    value: string;
    className?: string;
}

export function RollingNumber({ value, className = "" }: RollingNumberProps) {
    // Reverse the string so the ones place, tens place, etc. always map to the same React keys.
    const chars = value.split("").reverse();

    return (
        <div className={`flex flex-row-reverse leading-none h-auto items-baseline ${className}`}>
            {chars.map((char, i) => {
                if (!isNaN(parseInt(char, 10))) {
                    const num = parseInt(char, 10);
                    return (
                        /* We use exactly 1em for the slot window */
                        <div key={`idx-${i}`} className="relative inline-block w-[1ch] overflow-hidden leading-none h-[1em]">
                            {/* Translate up by num * 1em to show the current digit */}
                            <motion.div
                                initial={{ y: `-${num}em` }}
                                animate={{ y: `-${num}em` }}
                                transition={{ type: "spring", stiffness: 100, damping: 18, mass: 0.8 }}
                                className="absolute top-0 flex flex-col will-change-transform"
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                    <span key={n} className="h-[1em] flex items-center justify-center leading-none">
                                        {n}
                                    </span>
                                ))}
                            </motion.div>
                        </div>
                    );
                } else {
                    return (
                        <span key={`char-${i}`} className="inline-block leading-none h-[1em]">
                            {char}
                        </span>
                    );
                }
            })}
        </div>
    );
}
