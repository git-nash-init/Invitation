/**
 * Business details shown on the Contact, Terms and Refund pages. The payment gateway checks that these
 * exist before it approves a live account. Set them in Vercel (all are public on purpose).
 */
export const BUSINESS = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || "Pratham Invitation",
  /** The person who owns and runs the business; shown in the site footer and the privacy policy. */
  owner: "AVINASH KR THAKUR",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS?.trim() || "",
};
