import { Navbar } from '@/components/Navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-invert">
          <h1>Terms of Service & Legal</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>

          <h2>1. Terms of Service</h2>
          <p>
            By accessing and using EquityEdgeai, you agree to be bound by these Terms of Service and all
            applicable laws and regulations. If you do not agree with any of these terms, you are prohibited
            from using this platform.
          </p>

          <h3>1.1 Account Registration</h3>
          <p>
            You must be at least 18 years old to create an account. You are responsible for maintaining
            the confidentiality of your account credentials and for all activities that occur under your
            account.
          </p>

          <h3>1.2 Trading Services</h3>
          <p>
            EquityEdgeai provides a platform for trading financial instruments. We act as an intermediary
            and do not provide investment advice. All trading decisions are made solely by you.
          </p>

          <h2>2. Risk Disclosure</h2>
          <p>
            Trading financial instruments involves substantial risk of loss and is not suitable for all
            investors. You should carefully consider whether trading is appropriate for you in light of
            your experience, objectives, financial resources, and other relevant circumstances.
          </p>

          <h3>2.1 Leverage Risk</h3>
          <p>
            Leveraged trading can magnify both profits and losses. You may lose more than your initial
            investment. Ensure you understand how leverage works before trading.
          </p>

          <h3>2.2 Market Risk</h3>
          <p>
            Market prices can be volatile and may move against your position. Past performance is not
            indicative of future results.
          </p>

          <h2>3. Privacy Policy</h2>
          <p>
            We are committed to protecting your privacy. We collect and use personal information only
            as described in this privacy policy.
          </p>

          <h3>3.1 Information Collection</h3>
          <p>
            We collect information you provide during registration, trading activities, and customer
            support interactions. This includes name, email, financial information, and transaction history.
          </p>

          <h3>3.2 Data Security</h3>
          <p>
            We implement industry-standard security measures to protect your personal information.
            However, no method of transmission over the Internet is 100% secure.
          </p>

          <h3>3.3 Third-Party Disclosure</h3>
          <p>
            We do not sell or share your personal information with third parties except as required
            by law or as necessary to provide our services (e.g., payment processors, banking partners).
          </p>

          <h2>4. Fees and Charges</h2>
          <p>
            Trading fees, spreads, and other charges are disclosed on our website. We reserve the right
            to modify fees with 30 days notice.
          </p>

          <h2>5. Deposits and Withdrawals</h2>
          <p>
            Deposits are subject to verification. Withdrawals may take 1-3 business days to process.
            We reserve the right to request additional documentation for security purposes.
          </p>

          <h2>6. Prohibited Activities</h2>
          <p>
            You agree not to engage in: market manipulation, fraudulent activities, money laundering,
            unauthorized access to other accounts, or any activity that violates applicable laws.
          </p>

          <h2>7. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any time for violation of
            these terms or suspicious activity. Upon termination, you may withdraw your remaining balance.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            EquityEdgeai is not liable for any indirect, incidental, special, consequential, or punitive
            damages arising from your use of the platform. Our total liability is limited to the amount
            of fees paid by you in the 12 months preceding the claim.
          </p>

          <h2>9. Dispute Resolution</h2>
          <p>
            Any disputes arising from these terms shall be resolved through binding arbitration in
            accordance with the rules of the American Arbitration Association.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the platform after
            changes constitutes acceptance of the modified terms.
          </p>

          <h2>11. Contact Information</h2>
          <p>
            For questions about these terms, contact us at legal@equityedgeai.com or through our
            support system.
          </p>

          <div className="bg-card p-6 rounded-lg mt-8">
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> These terms constitute a binding legal agreement. Please read
              them carefully. If you have questions, consult with a legal advisor before using the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
