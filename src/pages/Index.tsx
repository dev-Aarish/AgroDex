import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Coins,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Globe,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import logoUrl from "@/assets/agritrust-logo.svg";
import { DEMO_VERIFY_URL } from "@/lib/demo";

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Home | AgroDex</title>
      </Helmet>
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-white dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-background">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Logo + Brand Name */}
              <motion.div
                className="flex items-center gap-4 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <img
                  src={logoUrl}
                  alt="AgroDex logo"
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl shadow-lg object-cover bg-white dark:bg-slate-900 p-2"
                />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    AgroDex
                  </h2>
                  <p className="text-sm sm:text-base text-emerald-600 font-semibold mt-0.5">
                    AI-Powered Agricultural Traceability
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Powered by Hedera + AI
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight">
                Fighting <span className="text-emerald-600">Food Fraud</span> in
                Indonesia
              </h1>

              <p className="text-xl sm:text-2xl font-body text-gray-600 dark:text-slate-300 leading-relaxed">
                Blockchain traceability + Artificial Intelligence to guarantee
                the authenticity of Indonesian agricultural products.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to={DEMO_VERIFY_URL} className="w-full sm:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  ></motion.div>
                </Link>
                <Link to="/register" className="w-full sm:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/verify" className="w-full sm:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full border-2 border-gray-300 dark:border-slate-700 hover:border-emerald-600 font-bold text-lg px-8 py-6 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-700 dark:text-slate-300 transition-colors"
                    >
                      Verify Batch
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-3xl blur-2xl opacity-20" />
              <img
                src="https://assets-gen.codenut.dev/images/1761634617_bb2f7a28.png"
                alt="Producteur africain avec grains de café"
                className="relative w-full h-auto rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/10 dark:to-orange-950/10 dark:bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="text-center mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-5 py-2.5 rounded-full text-sm font-bold mb-6 shadow-sm">
                <AlertTriangle className="h-4 w-4" />
                The Problem
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
                Food Fraud Costs <span className="text-red-600">Billions</span>
              </h2>
              <p className="text-lg sm:text-xl font-body text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                In Africa, food fraud threatens consumer trust and penalizes
                honest producers
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  stat: "40%",
                  desc: "of agricultural products are mislabeled or fraudulent",
                  delay: 0.1,
                },
                {
                  stat: "$40B",
                  desc: "lost annually due to global food fraud",
                  delay: 0.2,
                },
                {
                  stat: "0%",
                  desc: "transparency in traditional supply chains",
                  delay: 0.3,
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="bg-card text-card-foreground p-8 rounded-2xl shadow-xl text-center border border-red-100 dark:border-red-950/20 hover:shadow-2xl transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item.delay, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="text-5xl sm:text-6xl font-extrabold text-red-600 mb-4">
                    {item.stat}
                  </div>
                  <p className="font-body text-base text-gray-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 lg:py-24 bg-background relative border-t border-b border-gray-100 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-5 py-2.5 rounded-full text-sm font-bold mb-6 shadow-sm">
                <CheckCircle2 className="h-4 w-4" />
                Our Solution
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
                AgroDex:{" "}
                <span className="text-emerald-600">Blockchain + AI</span>
              </h2>
              <p className="text-lg sm:text-xl font-body text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                A complete platform combining Hedera Hashgraph and Gemini AI for
                total traceability
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {[
                {
                  icon: ShieldCheck,
                  color: "emerald",
                  title: "Hedera Consensus Service (HCS)",
                  desc: "Immutable recording of every supply chain step on Hedera blockchain",
                  delay: 0.1,
                },
                {
                  icon: Coins,
                  color: "blue",
                  title: "Hedera Token Service (HTS)",
                  desc: "Unique NFT certificates for each batch, guaranteeing authenticity and ownership",
                  delay: 0.2,
                },
                {
                  icon: TrendingUp,
                  color: "purple",
                  title: "Gemini 2.5 Flash AI Analysis",
                  desc: "Automatic product quality validation through image analysis and provenance summary generation",
                  delay: 0.3,
                },
                {
                  icon: Globe,
                  color: "orange",
                  title: "Multilingual Support",
                  desc: "Automatic translation in English and Indonesian local languages for mass adoption",
                  delay: 0.4,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                const colorClasses = {
                  emerald: {
                    border: "border-emerald-100 dark:border-emerald-950/30",
                    bg: "bg-emerald-100 dark:bg-emerald-950/50",
                    text: "text-emerald-600 dark:text-emerald-400",
                  },
                  blue: {
                    border: "border-blue-100 dark:border-blue-950/30",
                    bg: "bg-blue-100 dark:bg-blue-950/50",
                    text: "text-blue-600 dark:text-blue-400",
                  },
                  purple: {
                    border: "border-purple-100 dark:border-purple-950/30",
                    bg: "bg-purple-100 dark:bg-purple-950/50",
                    text: "text-purple-600 dark:text-purple-400",
                  },
                  orange: {
                    border: "border-orange-100 dark:border-orange-950/30",
                    bg: "bg-orange-100 dark:bg-orange-950/50",
                    text: "text-orange-600 dark:text-orange-400",
                  },
                }[item.color as "emerald" | "blue" | "purple" | "orange"]!;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: item.delay, duration: 0.5 }}
                  >
                    <Card
                      className={`border-2 ${colorClasses.border} bg-card text-card-foreground hover:shadow-xl transition-shadow h-full`}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`${colorClasses.bg} p-3 rounded-lg`}>
                            <Icon className={`h-6 w-6 ${colorClasses.text}`} />
                          </div>
                          <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
                            {item.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="font-body text-sm sm:text-base text-gray-600 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white dark:from-slate-950 dark:to-background border-b border-gray-100 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                How It <span className="text-emerald-600">Works</span>
              </h2>
              <p className="text-lg sm:text-xl font-body text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                A simple 3-step process to guarantee the authenticity of your
                products
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "01",
                  icon: FileText,
                  title: "Register",
                  desc: "Producers register their batches with photos, GPS location and metadata",
                  delay: 0.1,
                },
                {
                  step: "02",
                  icon: Coins,
                  title: "Tokenize",
                  desc: "Automatic creation of Hedera NFTs with verifiable authenticity certificates",
                  delay: 0.2,
                },
                {
                  step: "03",
                  icon: ShieldCheck,
                  title: "Verify",
                  desc: "Consumers and buyers scan QR codes to verify origin instantly",
                  delay: 0.3,
                },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={idx}
                    className="relative"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: feature.delay, duration: 0.6 }}
                  >
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl shadow-lg">
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-6xl font-extrabold text-emerald-100 dark:text-emerald-950/20">
                        {feature.step}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="font-body text-gray-600 dark:text-slate-400 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                    {idx < 2 && (
                      <div className="hidden md:block absolute top-10 -right-6 w-12 h-0.5 bg-gradient-to-r from-emerald-300 to-blue-300 dark:from-emerald-900 dark:to-blue-900" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                Impact for <span className="text-emerald-600">Everyone</span>
              </h2>
              <p className="text-lg sm:text-xl font-body text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                A solution that benefits all actors in the agricultural value
                chain
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: "Producers",
                  benefits: [
                    "Protection against counterfeiting",
                    "Valorization of authentic products",
                    "Access to premium markets",
                  ],
                  color: "emerald",
                  delay: 0.1,
                },
                {
                  icon: ShieldCheck,
                  title: "Consumers",
                  benefits: [
                    "Authenticity guarantee",
                    "Complete traceability",
                    "Restored trust",
                  ],
                  color: "blue",
                  delay: 0.2,
                },
                {
                  icon: TrendingUp,
                  title: "Distributors",
                  benefits: [
                    "Risk reduction",
                    "ESG compliance",
                    "Market differentiation",
                  ],
                  color: "purple",
                  delay: 0.3,
                },
              ].map((stakeholder, idx) => {
                const Icon = stakeholder.icon;
                const colorClasses = {
                  emerald: {
                    from: "from-emerald-50 dark:from-emerald-950/20",
                    border: "border-emerald-100 dark:border-emerald-950/30",
                    bg: "bg-emerald-100 dark:bg-emerald-950/50",
                    text: "text-emerald-600 dark:text-emerald-400",
                  },
                  blue: {
                    from: "from-blue-50 dark:from-blue-950/20",
                    border: "border-blue-100 dark:border-blue-950/30",
                    bg: "bg-blue-100 dark:bg-blue-950/50",
                    text: "text-blue-600 dark:text-blue-400",
                  },
                  purple: {
                    from: "from-purple-50 dark:from-purple-950/20",
                    border: "border-purple-100 dark:border-purple-950/30",
                    bg: "bg-purple-100 dark:bg-purple-950/50",
                    text: "text-purple-600 dark:text-purple-400",
                  },
                }[stakeholder.color as "emerald" | "blue" | "purple"]!;

                return (
                  <motion.div
                    key={idx}
                    className={`bg-gradient-to-br ${colorClasses.from} to-white dark:to-slate-900/60 p-8 rounded-2xl border-2 ${colorClasses.border} hover:shadow-xl transition-shadow`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: stakeholder.delay, duration: 0.5 }}
                    whileHover={{ y: -5 }}
                  >
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 ${colorClasses.bg} rounded-xl mb-6`}
                    >
                      <Icon className={`h-8 w-8 ${colorClasses.text}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {stakeholder.title}
                    </h3>
                    <ul className="space-y-3">
                      {stakeholder.benefits.map((benefit, bidx) => (
                        <li key={bidx} className="flex items-start gap-2">
                          <CheckCircle2
                             className={`h-5 w-5 ${colorClasses.text} mt-0.5 flex-shrink-0`}
                          />
                          <span className="font-body text-gray-700 dark:text-slate-300">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-emerald-600 via-emerald-700 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Ready to Revolutionize Agricultural Traceability?
            </h2>
            <p className="text-xl sm:text-2xl text-emerald-50 leading-relaxed">
              Join Hedera blockchain and protect your products today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-gray-100 font-bold text-lg px-10 py-6 shadow-2xl"
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/verify">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="border-2 border-white text-white hover:bg-white/10 font-bold text-lg px-10 py-6"
                  >
                    Verify a Product
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
