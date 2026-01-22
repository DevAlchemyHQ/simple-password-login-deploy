export interface DonationTier {
  label: string;
  amount: string;
  description: string;
  stripeLink: string;
}

export const DONATION_TIERS: DonationTier[] = [
  {
    label: "Buy us a coffee",
    amount: "£9.99",
    description: "Thank you for supporting Exametry :)",
    stripeLink: "https://buy.stripe.com/dRm3cvbcUcfS8adfJD9AA02"
  },
  {
    label: "Support development",
    amount: "£15",
    description: "Your support goes a long way to motivate us :) :)",
    stripeLink: "https://buy.stripe.com/dRm7sL0ygbbOfCF2WR9AA03"
  },
  {
    label: "Premium supporter",
    amount: "£20",
    description: "You've been using Exametry from last year and can't live without it :)))))",
    stripeLink: "https://buy.stripe.com/aFa00j80I93Gdux0OJ9AA04"
  }
];
