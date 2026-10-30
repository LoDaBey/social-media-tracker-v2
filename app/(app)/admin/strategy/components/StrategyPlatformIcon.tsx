import type { ReactNode } from "react";
import {
  FaBloggerB,
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaPinterestP,
  FaRedditAlien,
  FaTelegram,
  FaThreads,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { BookOpen, MessagesSquare } from "lucide-react";
import type { StrategyPlatformIconProps, StrategyPlatformKey } from "@/types/strategy";

const MARKS: Record<
  StrategyPlatformKey,
  { bg: string; fg: string; icon: ReactNode }
> = {
  twitter: { bg: "#111111", fg: "#FFFFFF", icon: <FaXTwitter /> },
  facebook: { bg: "#1877F2", fg: "#FFFFFF", icon: <FaFacebook /> },
  instagram: { bg: "#E4405F", fg: "#FFFFFF", icon: <FaInstagram /> },
  threads: { bg: "#111111", fg: "#FFFFFF", icon: <FaThreads /> },
  reddit: { bg: "#FF4500", fg: "#FFFFFF", icon: <FaRedditAlien /> },
  youtube: { bg: "#FF0000", fg: "#FFFFFF", icon: <FaYoutube /> },
  blogspot: { bg: "#FF8800", fg: "#FFFFFF", icon: <FaBloggerB /> },
  tiktok: { bg: "#111111", fg: "#FFFFFF", icon: <FaTiktok /> },
  telegram: { bg: "#2AABEE", fg: "#FFFFFF", icon: <FaTelegram /> },
  website: { bg: "#0E8A7A", fg: "#FFFFFF", icon: <FaGlobe /> },
  pinterest: { bg: "#E60023", fg: "#FFFFFF", icon: <FaPinterestP /> },
  turkkitap: {
    bg: "#6D4AFF",
    fg: "#FFFFFF",
    icon: <BookOpen className="h-[55%] w-[55%]" strokeWidth={2.25} />,
  },
  kizlarsoruyor: {
    bg: "#1A1A1A",
    fg: "#FFFFFF",
    icon: <MessagesSquare className="h-[55%] w-[55%]" strokeWidth={2.25} />,
  },
  balatarin: {
    bg: "#1B8A5A",
    fg: "#FFFFFF",
    icon: <span className="text-[11px] font-extrabold leading-none">H</span>,
  },
};

export function StrategyPlatformIcon({
  platform,
  className = "h-8 w-8",
}: StrategyPlatformIconProps) {
  const mark = MARKS[platform];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg [&_svg]:h-[55%] [&_svg]:w-[55%] ${className}`}
      style={{ backgroundColor: mark.bg, color: mark.fg }}
      aria-hidden="true"
    >
      {mark.icon}
    </span>
  );
}
