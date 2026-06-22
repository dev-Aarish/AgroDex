import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Trans, useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Coins,
  Eye,
  Globe2,
  Handshake,
  Leaf,
  Network,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Truck,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import logoUrl from "@/assets/agritrust-logo.png";

const processSteps = [
  { key: "register", step: "01", icon: Sprout },
  { key: "anchor", step: "02", icon: Network },
  { key: "verify", step: "03", icon: ScanSearch },
] as const;

const benefits = [
  { key: "producers", icon: Users },
  { key: "consumers", icon: ShieldCheck },
  { key: "distributors", icon: Truck },
] as const;

const technology = [
  { key: "hcs", icon: ShieldCheck },
  { key: "hts", icon: Coins },
  { key: "ai", icon: Brain },
] as const;

const heroSignals = [
  { key: "originRecords", icon: Globe2 },
  { key: "fraudSignals", icon: ShieldAlert },
  { key: "aiSummaries", icon: Brain },
  { key: "stakeholderTrust", icon: Handshake },
] as const;

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{t("about.meta.title")}</title>
        <meta name="description" content={t("about.meta.description")} />
      </Helmet>
      <Navbar />

      <main>
        <section className="bg-gradient-to-br from-emerald-50 via-blue-50 to-white dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-background border-b border-gray-100 dark:border-slate-800">
          <div className="container mx-auto px-4 py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
              <motion.div
                className="space-y-7"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-bold">
                  <Leaf className="h-4 w-4" />
                  {t("about.hero.badge")}
                </div>
                <div className="space-y-5">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    <Trans
                      i18nKey="about.hero.title"
                      components={{
                        highlight: <span className="text-emerald-600" />,
                      }}
                    />
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                    {t("about.hero.description")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7"
                    >
                      {t("about.hero.primaryCta")}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/verify" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full border-2 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold px-7"
                    >
                      {t("about.hero.secondaryCta")}
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                className="rounded-2xl border border-emerald-100 dark:border-emerald-950/30 bg-white/80 dark:bg-slate-900/70 p-6 sm:p-8 shadow-xl"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
              >
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                  <img
                    src={logoUrl}
                    alt={t("about.heroCard.logoAlt")}
                    className="h-16 w-16 rounded-xl bg-white dark:bg-slate-950 p-2 shadow-sm"
                  />
                  <div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {t("about.heroCard.kicker")}
                    </p>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                      {t("about.heroCard.title")}
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                  {heroSignals.map(({ key, icon: Icon }) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 p-4"
                    >
                      <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/50 p-2">
                        <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-slate-200">
                        {t(`about.heroCard.signals.${key}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-start">
              <div className="space-y-5">
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  {t("about.overview.eyebrow")}
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                  {t("about.overview.title")}
                </h2>
                <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                  {t("about.overview.description")}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { key: "mission", icon: Leaf },
                  { key: "goals", icon: Eye },
                ].map(({ key, icon: Icon }) => (
                  <Card key={key} className="h-full border-gray-100 dark:border-slate-800">
                    <CardHeader>
                      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                        <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-gray-900 dark:text-white">
                        {t(`about.overview.cards.${key}.title`)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                        {t(`about.overview.cards.${key}.text`)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/10 dark:to-orange-950/10 border-y border-red-100/70 dark:border-red-950/20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-4 py-2 rounded-full text-sm font-bold">
                <ShieldAlert className="h-4 w-4" />
                {t("about.problem.badge")}
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white">
                {t("about.problem.title")}
              </h2>
              <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
                {t("about.problem.description")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                  {t("about.howItWorks.title")}
                </h2>
                <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
                  {t("about.howItWorks.description")}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {processSteps.map(({ key, step, icon: Icon }) => (
                  <Card key={key} className="h-full border-gray-100 dark:border-slate-800">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-4xl font-extrabold text-emerald-100 dark:text-emerald-950/40">
                          {step}
                        </span>
                      </div>
                      <CardTitle className="text-gray-900 dark:text-white">
                        {t(`about.howItWorks.steps.${key}.title`)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                        {t(`about.howItWorks.steps.${key}.description`)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white dark:from-slate-950 dark:to-background border-y border-gray-100 dark:border-slate-800">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                  {t("about.technology.title")}
                </h2>
                <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
                  {t("about.technology.description")}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {technology.map(({ key, icon: Icon }) => (
                  <Card key={key} className="h-full border-gray-100 dark:border-slate-800">
                    <CardHeader>
                      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                        <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-gray-900 dark:text-white">
                        {t(`about.technology.cards.${key}.title`)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                        {t(`about.technology.cards.${key}.description`)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                  {t("about.benefits.title")}
                </h2>
                <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
                  {t("about.benefits.description")}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {benefits.map(({ key, icon: Icon }) => (
                  <Card key={key} className="h-full border-gray-100 dark:border-slate-800">
                    <CardHeader>
                      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-gray-900 dark:text-white">
                        {t(`about.benefits.cards.${key}.title`)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                        {t(`about.benefits.cards.${key}.description`)}
                      </p>
                      <ul className="space-y-3">
                        {[0, 1, 2].map((itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-gray-700 dark:text-slate-300">
                              {t(`about.benefits.cards.${key}.items.${itemIndex}`)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-gradient-to-br from-emerald-600 via-emerald-700 to-blue-700">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-7">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
                {t("about.missionVision.title")}
              </h2>
              <p className="text-lg sm:text-xl text-emerald-50 leading-relaxed">
                {t("about.missionVision.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-gray-100 font-bold px-8"
                  >
                    {t("about.missionVision.primaryCta")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 font-bold px-8"
                  >
                    {t("about.missionVision.secondaryCta")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
