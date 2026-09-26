/**
 * Central config for all social/contact links.
 * Update here and changes propagate everywhere.
 */
export const SOCIALS = {
  discord:  "https://discord.gg/JxACGrMAMK",
  facebook: "https://www.facebook.com/awsccpnc",
  email:    "awssbguc.pnc@gmail.com",
} as const;

export const MAILTO = `mailto:${SOCIALS.email}`;
