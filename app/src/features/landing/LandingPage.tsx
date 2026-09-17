import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  FileText, 
  Receipt, 
  TrendingUp, 
  Truck, 
  Smartphone, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Zap,
  DollarSign
} from 'lucide-react';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

function AnimatedSection({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={sectionVariants}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <span className="text-sm font-bold text-white">m</span>
              </div>
              <span className="text-xl font-bold">mando</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium hover:text-foreground text-muted-foreground">
                Sign in
              </Link>
              <Link 
                to="/register" 
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-6">
              <Zap className="h-4 w-4" />
              <span>Built for Nigerian SMEs</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Sell, Invoice, Get Paid.
              <br />
              <span className="text-emerald-600">Know Your Numbers.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
              A lightweight operating system for Nigerian small businesses. Create invoices, 
              track expenses, manage deliveries, and see your business performance in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register" 
                className="w-full sm:w-auto rounded-lg bg-emerald-600 px-8 py-3 text-base font-medium text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto rounded-lg border px-8 py-3 text-base font-medium hover:bg-accent transition-colors flex items-center justify-center"
              >
                View demo
              </Link>
            </div>
            {/*<p className="mt-4 text-sm text-muted-foreground">No credit card required • Free forever for small businesses</p>*/}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <AnimatedSection className="border-t py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">Trusted by businesses across Nigeria</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50">
            {['Retail', 'Services', 'Manufacturing', 'Logistics', 'Consulting'].map((industry) => (
              <div key={industry} className="text-lg font-semibold text-muted-foreground">{industry}</div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Features Section */}
      <AnimatedSection className="py-20 sm:py-32" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to run your business</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From the first sale to monthly reports, mando handles it all without the complexity of full accounting software.
            </p>
          </div>
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {[
              {
                icon: Receipt,
                title: 'Professional Invoices',
                description: 'Create beautiful, tax-compliant invoices in seconds. Add line items, discounts, VAT, and delivery fees.'
              },
              {
                icon: FileText,
                title: 'Quotes & Estimates',
                description: 'Send professional quotes to customers. Convert approved estimates directly into invoices with one click.'
              },
              {
                icon: DollarSign,
                title: 'Payment Tracking',
                description: 'Record payments against invoices. Track outstanding balances and follow up on overdue payments.'
              },
              {
                icon: TrendingUp,
                title: 'Expense Management',
                description: 'Track every expense by category. See where your money goes and make smarter spending decisions.'
              },
              {
                icon: Truck,
                title: 'Delivery Tracking',
                description: 'Manage orders from sale to delivery. Track delivery status and keep customers informed.'
              },
              {
                icon: BarChart3,
                title: 'Business Reports',
                description: 'Get instant insights into your sales, expenses, and profits. Know your numbers at a glance.'
              }
            ].map((feature) => (
              <motion.div key={feature.title} variants={itemVariants} className="rounded-xl border bg-card p-6 shadow-3d-sm hover:shadow-3d transition-shadow">
                <div className="rounded-lg bg-emerald-100 p-3 w-fit mb-4 dark:bg-emerald-950">
                  <feature.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* How it Works */}
      <AnimatedSection id="how-it-works" className="py-20 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get started in minutes</h2>
            <p className="text-lg text-muted-foreground">No complex setup. Start invoicing right away.</p>
          </div>
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
          >
            {[
              {
                step: '1',
                title: 'Create',
                description: 'Add your business details and start creating invoices, quotes, or recording expenses.'
              },
              {
                step: '2',
                title: 'Send',
                description: 'Share invoices via email, WhatsApp, or download as PDF. Send payment reminders automatically.'
              },
              {
                step: '3',
                title: 'Track',
                description: 'Monitor payments, deliveries, and expenses. View your dashboard to see your business health.'
              }
            ].map((step) => (
              <motion.div key={step.step} variants={itemVariants} className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-600 text-white text-2xl font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Mobile-First Section */}
      <AnimatedSection className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Your business in your pocket</h2>
              <p className="text-lg text-muted-foreground mb-6">
                mando is a Progressive Web App designed for mobile-first. Install it on your phone 
                and manage your business from anywhere—offline-friendly and always ready.
              </p>
              <motion.ul 
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {[
                  'Works on any device—phone, tablet, or desktop',
                  'Install as an app for quick access',
                  'Offline support for critical features',
                  'Fast and lightweight'
                ].map((item) => (
                  <motion.li key={item} variants={itemVariants} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="rounded-2xl border bg-card p-8 shadow-3d">
                <Smartphone className="h-48 w-full text-muted-foreground" />
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Pricing Section */}
      <AnimatedSection id="pricing" className="py-20 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">Start free. Scale as you grow.</p>
          </div>
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
            {[
              {
                name: 'Free',
                price: '₦0',
                description: 'Perfect for startups and small businesses',
                features: [
                  'Unlimited products & services',
                  'Low-stock alerts',
                  'Unlimited customers',
                  '6 invoices per month',
                  'PDF invoices and WhatsApp sharing',
                  'Unlimited expense tracking',
                  'Unlimited delivery tracking',
                  'Unlimited reporting',
                  
                  'Email support'
                ],
                cta: 'Get started',
                popular: false
              },
              {
                name: 'Solopreneur',
                price: '₦2,000',
                period: '/month',
                description: 'For Solopreneurs',
                features: [
                  'Everything in Free',
                  'Unlimited invoices',
                  'Onboarding assistance',
                  'Priority support',
                  'API access'
                ],
                cta: 'Start trial',
                popular: true
              },
              {
                name: 'Entrepreneur',
                price: '₦4,000',
                period: '/month',
                description: 'For Entrepreneurs',
                features: [
                  'Everything in Solopreneur',
                  'Plus 2 staff accounts',
                ],
                cta: 'Contact sales',
                popular: true
              },
              {
                name: 'Business',
                price: '₦10,000',
                period: '/month',
                description: 'For Small Businesses',
                features: [
                  'Everything in Entrepreneur',
                  'Plus 20 staff accounts',
                  'Dedicated account manager'
                ],
                cta: 'Contact sales',
                popular: true
              },
            ].map((plan) => (
              <motion.div key={plan.name} variants={itemVariants} className={`rounded-xl border bg-card p-6 shadow-3d-sm hover:shadow-3d transition-shadow ${plan.popular ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''}`}>
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Very popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  to={plan.name === 'Free' ? '/register' : '#pricing'}
                  className={`block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                    plan.popular 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'border hover:bg-accent'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection id="faq" className="py-20 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently asked questions</h2>
          </div>
          <motion.div 
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {[
              {
                q: 'Do I need to install anything?',
                a: 'No. mando is a progressive web app that lives on your phone without downloading anything. Just open it in your browser the first time and you\'re ready to go!'
              },
              {
                q: 'Is my data secure?',
                a: 'Absolutely. We utilize industry-standard AES-256 and TLS encryption, and adhere to international security practices. Your data is backed up regularly and only accessible to you.'
              },
              {
                q: 'Can I use mando offline?',
                a: 'Yes! As a PWA, mando works offline for key features. Your data syncs automatically when you reconnect.'
              },
              {
                q: 'Does mando support Nigerian taxes?',
                a: 'Yes. mando is built for Nigerian businesses with support for VAT calculations and tax-compliant invoicing.'
              }
            ].map((faq) => (
              <motion.div key={faq.q} variants={itemVariants} className="border-b pb-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-20 sm:py-32 bg-emerald-600">
        <motion.div 
          className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to take control of your business?
          </h2>
          <p className="text-lg text-emerald-50 mb-10">
            Join thousands of Nigerian businesses using mando to sell, invoice, and grow.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-medium text-emerald-600 hover:bg-emerald-50 transition-colors gap-2"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                  <span className="text-sm font-bold text-white">m</span>
                </div>
                <span className="text-xl font-bold">mando</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A lightweight operating system for Nigerian SMEs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} mando. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
