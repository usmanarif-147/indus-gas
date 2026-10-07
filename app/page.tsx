import Link from "next/link";

export default function Home() {
  return <main>
    <header className="nav">
      <Link href="/" className="brand">INDUS<span>GAS</span></Link>
      <nav><Link href="#services">Services</Link><Link href="#contact">Contact</Link><Link href="/field">Employee App</Link></nav>
    </header>
    <section className="hero">
      <p className="eyebrow">B2B LPG DISTRIBUTION</p>
      <h1>Energy that keeps your business moving.</h1>
      <p>Indus Gas supplies reliable LPG cylinder delivery for businesses, with clear service and dependable support.</p>
      <a className="button" href="#contact">Contact us</a>
    </section>
    <section id="services" className="section">
      <p className="eyebrow">OUR SERVICES</p><h2>Simple, reliable gas supply.</h2>
      <div className="cards"><article><h3>Business supply</h3><p>Regular LPG cylinder supply designed for business operations.</p></article><article><h3>Delivery support</h3><p>Coordinated cylinder delivery and empty-cylinder returns.</p></article><article><h3>Customer service</h3><p>A team ready to support your account and supply requirements.</p></article></div>
    </section>
    <section id="contact" className="contact"><p className="eyebrow">GET IN TOUCH</p><h2>Let’s discuss your gas supply needs.</h2><p>Add your phone number, WhatsApp number, address, and email here before launch.</p><a className="button light" href="mailto:hello@example.com">Email us</a></section>
  </main>;
}
