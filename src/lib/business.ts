/**
 * Business details shown on the Contact, Terms and Refund pages. Razorpay checks that these
 * exist before it approves a live account. Set them in Vercel (all are public on purpose).
 */
export const BUSINESS = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || "Pratham Invitation",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS?.trim() || "",
};
