import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MarketingLayout({ children }) {
  return (
    <div className="marketing-theme">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
