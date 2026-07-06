import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Button
} from "@/components/ui/button";
import {
    ArrowRight
} from "lucide-react";
import logoUrl from "@/assets/agritrust-logo.png";
import { Github, Mail, Globe, ExternalLink } from "lucide-react";
import heroImage from "@/assets/Petani_padi.jpg";


export default function Landing() {
    
    const [activeSection, setActiveSection] = useState("hero");

    const sections = [
        { id: "hero", label: "Home" },
        { id: "problem", label: "Problem" },
        { id: "solution", label: "Solution" },
        { id: "how", label: "Process" },
        { id: "ai-risk", label: "AI Risk" },
        { id: "impact", label: "Impact" },
        { id: "cta", label: "Join" },
    ];

    /* ================= SCROLL DETECTION ================= */
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY + window.innerHeight;
            const height = document.body.scrollHeight;
            setIsBottom(scrollY >= height - 80);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    /* ================= SECTION SPY ================= */
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            { threshold: 0.5 }
        );

        sections.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="bg-background text-foreground">

            {/* ================= NAVBAR ================= */}
            <div className="fixed top-0 left-0 w-full z-[999] backdrop-blur-md bg-black/80 border-b border-zinc-800/60">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">

                    {/* Logo dot */}
                    <div className="flex items-center gap-2 font-semibold text-sm text-white">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        AgroDex
                    </div>

                    <div className="flex gap-6 text-sm font-medium">
                        {sections.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => scrollTo(s.id)}
                                className={`transition ${activeSection === s.id
                                    ? "text-emerald-400 font-semibold"
                                    : "text-gray-400 hover:text-gray-200"
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <button className="text-sm font-semibold text-gray-400 hover:text-gray-200">
              Login
            </button>
          </Link>

          <Link to="/register">
            <Button
              className={`text-sm font-semibold text-black transition-all duration-300 ${
                activeSection === "join"
                  ? "bg-emerald-400 shadow-[0_0_20px_#10b981] animate-pulse"
                  : "bg-emerald-500 hover:bg-emerald-400"
              }`}
            >
              Sign Up <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
            </div>
            {/* ================= HERO ================= */}

            <section id="hero" className="pt-28 min-h-screen container mx-auto px-4 flex items-center">
                <div className="grid md:grid-cols-2 gap-10 items-center">

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <img src={logoUrl} className="h-14 w-14" />
                            <div>
                                <h1 className="text-3xl font-extrabold">AgroDex</h1>
                                <p className="text-emerald-600 font-medium">
                                    AI + Blockchain Food Traceability
                                </p>
                            </div>
                        </div>

                        <h2 className="text-5xl font-extrabold leading-tight">
                            Stop Food Fraud with <span className="text-emerald-600">Hedera + AI</span>
                        </h2>

                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                            AgroDex creates a transparent agricultural supply chain using blockchain,
                            AI auditing, and NFT-based batch identity.
                        </p>

                        <div className="flex items-center gap-4">
                            <Link to="/register">
                                <Button size="lg" className="bg-emerald-600 text-white">
                                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>

                            <Link to="/verify">
                                <Button size="lg" className="bg-white text-emerald-700 border border-emerald-200 dark:border-neutral-700">
                                    Live Demo <Globe className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <img
                        src={heroImage}
                        alt="Farmer in Indonesia"
                        className="rounded-2xl shadow-xl"
                    />
                </div>
            </section>

            {/* ================= PROBLEM ================= */}
            <section
                id="problem"
                className="py-24 bg-gray-50 dark:bg-black/20 container mx-auto px-4"
            >
                <h2 className="text-4xl font-bold text-center mb-6">
                    The Problem
                </h2>

                <p className="text-center max-w-3xl mx-auto text-gray-600 mb-12">
                    Food fraud in agricultural supply chains destroys trust between farmers,
                    distributors, and consumers, resulting in billions in losses and making
                    product quality difficult to verify.
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-green-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 17v-6h13M9 17l-4-4m4 4l-4 4M5 5h14"
                                    />
                                </svg>
                            ),
                            title: "Lack of Traceability",
                            desc: "Agricultural products pass through multiple intermediaries with little to no reliable record of their origin or journey.",
                        },
                        {
                            icon: (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-green-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 8c-1.657 0-3 1.343-3 3v2m3-5a3 3 0 013 3v2m-6 0h6m-8 6h10a2 2 0 002-2v-4H4v4a2 2 0 002 2z"
                                    />
                                </svg>
                            ),
                            title: "Farmer Disadvantage",
                            desc: "Authentic farmers struggle to prove premium quality, making it difficult to earn fair value for certified produce.",
                        },
                        {
                            icon: (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-green-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 9v2m0 4h.01M10.29 3.86l-7 12.14A2 2 0 005.03 19h13.94a2 2 0 001.74-3l-7-12.14a2 2 0 00-3.48 0z"
                                    />
                                </svg>
                            ),
                            title: "Consumer Distrust",
                            desc: "Buyers cannot independently verify authenticity, certifications, or whether products have been tampered with.",
                        },
                    ].map((card) => (
                        <div
                            key={card.title}
                            className="p-6 border border-zinc-800 hover:border-green-900 rounded-xl bg-zinc-950 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-9 h-9 rounded-lg bg-green-950/40 flex items-center justify-center mb-4">
                                {card.icon}
                            </div>

                            <h3 className="font-semibold text-white mb-2">
                                {card.title}
                            </h3>

                            <p className="text-sm text-gray-500 leading-relaxed">
                                {card.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= SOLUTION ================= */}
            <section id="solution" className="py-24 bg-gray-50 dark:bg-black/20 container mx-auto px-4">

                <h2 className="text-4xl font-bold text-center mb-6">
                    Hedera + AI Powered Solution
                </h2>

                <p className="text-center max-w-3xl mx-auto text-gray-600 mb-12">
                    AgroDex builds a verifiable digital twin for every agricultural batch using blockchain immutability and AI auditing.
                </p>

                <div className="grid md:grid-cols-3 gap-6">

                    {[
                        {
                            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
                            title: "Hedera HCS",
                            desc: "Every farming event is permanently committed to an immutable consensus log, tamper-proof from origin."
                        },
                        {
                            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
                            title: "HTS NFTs",
                            desc: "Each batch becomes a certifiable token tied to its origin history and quality data on-chain."
                        },
                        {
                            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>,
                            title: "Mirror Node Verification",
                            desc: "Real-time replay of supply chain history for remote auditors, regulators, and buyers."
                        },
                    ].map((card) => (
                        <div key={card.title} className="p-6 border border-zinc-800 hover:border-emerald-900 rounded-xl bg-zinc-950 transition-colors">
                            <div className="w-9 h-9 rounded-lg bg-emerald-950/60 flex items-center justify-center mb-4">
                                {card.icon}
                            </div>
                            <h3 className="font-semibold text-white mb-2">{card.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= HOW ================= */}

            <section id="how" className="py-24 container mx-auto px-4 text-center">

                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mb-3">
                    How It Works
                </p>

                <h2 className="text-4xl font-bold mb-3">
                    From farm to verified in 3 steps
                </h2>

                <p className="text-gray-500 max-w-2xl mx-auto mb-14">
                    A simple, deterministic system that turns agricultural products into
                    verifiable digital assets.
                </p>

                <div className="relative">

                    {/* Left connector */}
                    <div className="hidden md:block absolute top-7 left-[19%] w-[24%] h-px bg-gradient-to-r from-emerald-900 via-emerald-500 to-emerald-900"></div>

                    {/* Right connector */}
                    <div className="hidden md:block absolute top-7 right-[19%] w-[24%] h-px bg-gradient-to-r from-emerald-900 via-emerald-500 to-emerald-900"></div>

                    <div className="grid md:grid-cols-3 gap-8">

                        {[
                            {
                                num: "01",
                                title: "Register Batch",
                                desc: "Farmer logs crop data, images, and provenance details into the AgroDex platform.",
                            },
                            {
                                num: "02",
                                title: "Mint NFT",
                                desc: "A unique HTS NFT is minted on Hedera, anchoring the batch to an immutable identity.",
                            },
                            {
                                num: "03",
                                title: "Verify via QR",
                                desc: "Any buyer or auditor scans the QR code to instantly validate the full provenance chain.",
                            },
                        ].map((step) => (
                            <div
                                key={step.num}
                                className="relative flex flex-col items-center"
                            >
                                <div className="relative z-10 w-14 h-14 rounded-full border border-emerald-700 bg-emerald-950/50 flex items-center justify-center text-xl font-bold text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                                    {step.num}
                                </div>

                                <h3 className="font-semibold text-white mt-5 mb-2">
                                    {step.title}
                                </h3>

                                <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                                    {step.desc}
                                </p>
                            </div>
                        ))}

                    </div>

                </div>

            </section>

            {/* ================= FRAUD ================= */}
            <section id="ai-risk" className="py-24 container mx-auto px-4">

                <h2 className="text-4xl font-bold text-center mb-4">
                    AI Risk Intelligence Engine
                </h2>

                <p className="text-center max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mb-12">
                    A deterministic fraud detection system powered by structured signals + AI explanation layer.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Core Engine */}
                    <div className="p-6 border rounded-xl">
                        <h3 className="font-bold mb-2">Deterministic Scoring</h3>
                        <p className="text-sm text-gray-500">
                            7 rule-based fraud detectors generate a transparent 0–100 risk score.
                        </p>
                    </div>

                    {/* AI Layer */}
                    <div className="p-6 border rounded-xl">
                        <h3 className="font-bold mb-2">Gemini Explanation Layer</h3>
                        <p className="text-sm text-gray-500">
                            AI explains fraud signals in human-readable audit-ready reports.
                        </p>
                    </div>

                    {/* Risk Levels */}
                    <div className="p-6 border rounded-xl">
                        <h3 className="font-bold mb-2">Risk Classification</h3>
                        <p className="text-sm text-gray-500">
                            SAFE → CRITICAL grading system for instant decision making.
                        </p>
                    </div>

                    {/* Signals */}
                    <div className="p-6 border rounded-xl md:col-span-2 lg:col-span-3">
                        <h3 className="font-bold mb-3">Fraud Signal Detectors</h3>

                        <div className="flex flex-wrap gap-2">
                            {[
                                "Yield anomaly (±2σ)",
                                "Missing lifecycle events",
                                "Duplicate metadata",
                                "High batch frequency",
                                "Multiple NFT mint attempts",
                                "Regional outliers",
                                "Suspicious farmer history",
                            ].map((item, i) => (
                                <span
                                    key={i}
                                    className="text-xs px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            {/* ================= CTA ================= */}
            <section id="cta" className="py-24 container mx-auto px-4">

                <div className="max-w-3xl mx-auto text-center p-14 rounded-2xl border border-emerald-900/60 bg-emerald-950/30">
                    <h2 className="text-4xl font-bold mb-4 text-white">
                        Start building trust in food systems
                    </h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Join AgroDex and make every agricultural product verifiable, transparent, and fraud-resistant.
                    </p>
                    <Link to="/register">
                        <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8">
                            Create Account
                        </Button>
                    </Link>
                </div>

            </section>
            <footer className="border-t bg-white dark:bg-black/40 mt-20">
                <div className="container mx-auto px-4 py-14">

                    <div className="grid md:grid-cols-4 gap-10">

                        {/* ================= BRAND ================= */}
                        <div>
                            <h2 className="text-xl font-extrabold text-emerald-600">AgroDex</h2>
                            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                                AI + Blockchain powered agricultural traceability platform
                                built on Hedera Hashgraph.
                            </p>
                        </div>

                        {/* ================= PROJECT ================= */}
                        <div>
                            <h3 className="font-bold mb-3">Project</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li>
                                    <a href="#hero" className="hover:text-emerald-600">Home</a>
                                </li>
                                <li>
                                    <a href="#solution" className="hover:text-emerald-600">Solution</a>
                                </li>
                                <li>
                                    <a href="#fraud" className="hover:text-emerald-600">AI Engine</a>
                                </li>
                                <li>
                                    <a href="#impact" className="hover:text-emerald-600">Impact</a>
                                </li>
                            </ul>
                        </div>

                        {/* ================= LINKS ================= */}
                        <div>
                            <h3 className="font-bold mb-3">Links</h3>

                            <div className="space-y-3 text-sm">

                                {/* GitHub */}
                                <a
                                    href="https://github.com/daviddprtma/AgroDex"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-gray-600 hover:text-emerald-600"
                                >
                                    <Github className="h-4 w-4" />
                                    GitHub Repository
                                    <ExternalLink className="h-3 w-3" />
                                </a>

                                {/* Docs / Demo */}
                                <a
                                    href="/verify"
                                    className="flex items-center gap-2 text-gray-600 hover:text-emerald-600"
                                >
                                    <Globe className="h-4 w-4" />
                                    Live Demo
                                </a>

                            </div>
                        </div>

                        {/* ================= CONTACT ================= */}
                        <div>
                            <h3 className="font-bold mb-3">Contact</h3>

                            <div className="space-y-3 text-sm text-gray-600">

                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>agrodex.team@gmail.com</span>
                                </div>

                                <div className="text-xs text-gray-400 mt-3">Built for Hedera Hackathon • SSOC 2026</div>

                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}