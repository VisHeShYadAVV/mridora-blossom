import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

import type { SocialLinks } from "@/lib/types";

export const SOCIALS: { key: keyof SocialLinks; label: string; Icon: typeof FaLinkedinIn }[] = [
  { key: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
  { key: "facebook", label: "Facebook", Icon: FaFacebookF },
  { key: "youtube", label: "YouTube", Icon: FaYoutube },
  { key: "pinterest", label: "Pinterest", Icon: FaPinterestP },
  { key: "x", label: "X (Twitter)", Icon: FaXTwitter },
];
