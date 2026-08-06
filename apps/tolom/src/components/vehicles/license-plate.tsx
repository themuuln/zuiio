"use client";

import { useId } from "react";
import { formatPlateNumber } from "@/lib/utils";

/**
 * Text-only license plate display without the Soyombo symbol.
 * Compact — ideal for performance-sensitive contexts like BayCards,
 * tables, and list rows.
 */
export function TextPlate({ plate }: { plate: string | null | undefined }) {
  if (!plate) return null;
  const formatted = formatPlateNumber(plate);
  return (
    <div className="inline-flex items-center select-none rounded border border-border bg-background px-2 py-0.5 font-mono text-xs font-bold h-6 justify-center">
      {formatted}
    </div>
  );
}

/**
 * Full Mongolian license plate with Soyombo symbol SVG.
 * Shows the red Soyombo emblem on the left with "MNG" text,
 * followed by a split view of digits and Cyrillic letters.
 *
 * Falls back gracefully for non-Mongolian plate formats:
 * digits and trailing letters are displayed without the symbol.
 */
export function MongolianLicensePlate({
  plate,
}: {
  plate: string | null | undefined;
}) {
  const soyomboMaskId = useId();
  if (!plate) return null;
  const formatted = formatPlateNumber(plate);

  // Check if plate matches Mongolian standard: e.g. 4 digits + 3 Cyrillic letters (e.g., 1234УАБ)
  const mongolianRegex = /^(\d{4})([А-Яа-яӨөҮү]{3})$/;
  const match = formatted.match(mongolianRegex);

  let digits = "";
  let letters = "";
  if (match) {
    digits = match[1];
    letters = match[2];
  } else {
    // Fallback: split digits and letters
    const digitMatch = formatted.match(/^(\d+)(.*)$/);
    if (digitMatch?.[1] && digitMatch[2]) {
      digits = digitMatch[1];
      letters = digitMatch[2];
    } else {
      digits = formatted;
    }
  }

  return (
    <div className="inline-flex items-center select-none rounded border border-slate-900 bg-white text-slate-900 px-2 py-0.5 font-mono text-[13px] font-bold h-7 min-w-[95px] justify-center gap-1.5 dark:border-slate-800">
      {/* Soyombo Symbol Red Strip */}
      <div className="flex flex-col items-center justify-center border-r border-slate-200 pr-1.5 h-full select-none">
        <svg
          viewBox="0 0 440 900"
          className="w-3 h-5 fill-[#E02424]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Soyombo Symbol</title>
          <defs>
            <mask id={soyomboMaskId}>
              <path d="M0 0h400v600h-400z" fill="#fff" />
              <g fill="#000">
                <circle cx="200" cy="180" r="60" />
                <circle cx="200" cy="363.5" r="10" />
                <circle cx="200" cy="416.5" r="10" />
                <path d="M200 334a29.5 29.5 0 0 1 0 59 23.5 23.5 0 0 0 0 47v6a29.5 29.5 0 0 1 0-59 23.5 23.5 0 0 0 0-47z" />
              </g>
            </mask>
          </defs>
          <g transform="scale(2) translate(-90 -60)">
            <circle cx="200" cy="205" r="55" mask={`url(#${soyomboMaskId})`} />
            <circle cx="200" cy="190" r="40" />
            <path d="M204.2035 60c-4.97 2.255-6.827 6.321-7.227 10.371-.25 3.41 1.255 7.251 1.405 10.586 0 5.739-5.938 7.629-5.938 15.82 0 2.815 2.6 5.917 2.6 13.223-.45 3.835-2.59 4.7-5 5a5 5 0 0 1-5-5 5 5 0 0 1 1.385-3.44 5 5 0 0 1 .51-.5c1.14-1.15 2.705-1.595 2.695-4.63 0-1.56-1.01-2.98-1.975-5.742-.91-2.68-.25-7.16 1.915-9.805-3.5 1.35-5.657 4.705-6.757 7.715-1.16 3.7-.15 5.831-1.74 8.906-.97 1.99-2.125 2.815-3.22 4.475-1.295 1.81-2.815 6.043-2.815 8.008a25 25 0 0 0 50 0c0-1.965-1.5-6.198-2.795-8.008-1.095-1.66-2.27-2.485-3.24-4.475-1.57-3.075-.56-5.206-1.72-8.906-1.1-3.01-3.26-6.364-6.758-7.715 2.165 2.645 2.825 7.125 1.915 9.805-.97 2.76-1.99 4.18-1.99 5.742 0 3.035 1.555 3.48 2.695 4.63a5 5 0 0 1 .51.5 5 5 0 0 1 1.385 3.44 5 5 0 0 1-5 5c-2.765-.35-4.75-1.64-5-5 0-9.626 4.12-10.24 4.12-17.363 0-10.171-9.121-14.986-9.121-22.422 0-2.52.59-6.815 4.16-10.2275zM90 270h50v240H90zm170 0h50v240h-50zm-110 0h100l-50 30zm0 40h100v20H150zm0 140h100v20H150zm0 30h100l-50 30z" />
            <circle cx="200" cy="390" r="50" mask={`url(#${soyomboMaskId})`} />
          </g>
        </svg>
        <span className="text-[5px] font-sans font-black text-slate-500 scale-75 leading-none select-none">
          MNG
        </span>
      </div>
      {/* License Text */}
      <div className="flex items-center gap-1 leading-none text-slate-950 font-black">
        <span className="text-[14px] tracking-tight font-black">{digits}</span>
        {letters && (
          <span className="text-[12px] tracking-normal text-slate-800 font-extrabold">
            {letters}
          </span>
        )}
      </div>
    </div>
  );
}
