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
import { motion } from "framer-motion";

export default function Landing() {
    const [isBottom, setIsBottom] = useState(false);
    const [activeSection, setActiveSection] = useState("hero");

    const sections = [
        { id: "hero", label: "Home" },
        { id: "problem", label: "Problem" },
        { id: "solution", label: "Solution" },
        { id: "how", label: "Process" },
        { id: "fraud", label: "AI Risk" },
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
            <div className="fixed top-0 left-0 w-full z-[999] shadow-md backdrop-blur bg-white/70 dark:bg-black/50 border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                    {/* NAV LINKS */}
                    <div className="flex gap-6 text-sm font-medium">
                        {sections.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => scrollTo(s.id)}
                                className={`transition ${activeSection === s.id
                                    ? "text-emerald-600 font-bold"
                                    : "text-gray-700 dark:text-gray-300"
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* CTA */}
                    <Link to="/register">
                        <Button
                            className={`transition-all duration-300 text-white ${isBottom
                                ? "bg-emerald-500 shadow-[0_0_25px_#10b981] animate-pulse"
                                : "bg-emerald-600"
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
            <section id="problem" className="py-24 container mx-auto px-4">

                <h2 className="text-4xl font-bold text-center mb-6">
                    The Problem
                </h2>

                <p className="text-center max-w-3xl mx-auto text-gray-600 mb-12">
                    Food fraud in agricultural supply chains destroys trust between farmers, distributors, and consumers which
                    leads to billions in losses and unverifiable product quality.
                </p>

                <div className="grid md:grid-cols-3 gap-6">

                    <div className="p-6 border rounded-xl">
                        <h3 className="font-bold mb-2">Lack of Traceability</h3>
                        <p className="text-sm text-gray-500">
                            No reliable way to verify crop origin or production history.
                        </p>
                    </div>

                    <div className="p-6 border rounded-xl">
                        <h3 className="font-bold mb-2">Farmer Disadvantage</h3>
                        <p className="text-sm text-gray-500">
                            Farmers cannot prove premium quality like organic or fair trade.
                        </p>
                    </div>

                    <div className="p-6 border rounded-xl">
                        <h3 className="font-bold mb-2">Consumer Distrust</h3>
                        <p className="text-sm text-gray-500">
                            Buyers have no cryptographic proof of authenticity.
                        </p>
                    </div>

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

                    <div className="p-6 border rounded-xl">
                        <h3 className="font-bold">Hedera HCS</h3>
                        <p className="text-sm text-gray-500">
                            Every farming event is permanently recorded on an immutable consensus log.
                        </p>
                    </div>

                    <div className="p-6 border rounded-xl">
                        <h3 className="font-bold">HTS NFTs</h3>
                        <p className="text-sm text-gray-500">
                            Each batch becomes a verifiable token tied to its origin history.
                        </p>
                    </div>

                    <div className="p-6 border rounded-xl">
                        <h3 className="font-bold">Mirror Node Verification</h3>
                        <p className="text-sm text-gray-500">
                            Real-time replay of supply chain history for instant validation.
                        </p>
                    </div>

                </div>
            </section>

            {/* ================= HOW ================= */}
            <section id="how" className="py-24 container mx-auto px-4 text-center">
                <h2 className="text-4xl font-bold mb-4">How It Works</h2>
                <p className="text-gray-500 max-w-2xl mx-auto mb-10">
                    A simple 3-step system that turns agricultural products into verifiable digital assets.
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                    {["Register Batch", "Mint NFT", "Verify via QR"].map((step, i) => (
                        <div key={i} className="p-6 border rounded-xl">
                            <div className="text-4xl font-bold text-emerald-600 mb-3">
                                0{i + 1}
                            </div>
                            <h3 className="font-bold">{step}</h3>
                        </div>
                    ))}
                </div>
            </section>
            {/*animation*/}
            <section id="flow" className="py-24 container mx-auto px-4">

                <h2 className="text-4xl font-bold text-center mb-6">
                    How AgroDex Works
                </h2>

                <p className="text-center max-w-2xl mx-auto text-gray-600 mb-14">
                    A real-time traceability flow powered by Hedera Consensus Service and AI verification.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8">

                    {/* FARMER */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="p-6 border rounded-xl text-center w-64"
                    >
                        <div className="text-3xl mb-2">🌾</div>
                        <h3 className="font-bold">Farmer</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Registers crop batch with data & images
                        </p>
                    </motion.div>

                    {/* ARROW 1 */}
                    <motion.div
                        animate={{ x: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-emerald-600"
                    >
                        <ArrowRight size={28} />
                    </motion.div>

                    {/* BLOCKCHAIN */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="p-6 border rounded-xl text-center w-64 bg-emerald-50 dark:bg-emerald-950/20"
                    >
                        <div className="text-3xl mb-2">⛓️</div>
                        <h3 className="font-bold">Hedera Blockchain</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            HCS logs + HTS NFT minting for immutability
                        </p>
                    </motion.div>

                    {/* ARROW 2 */}
                    <motion.div
                        animate={{ x: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                        className="text-emerald-600"
                    >
                        <ArrowRight size={28} />
                    </motion.div>

                    {/* BUYER */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="p-6 border rounded-xl text-center w-64"
                    >
                        <div className="text-3xl mb-2">🛒</div>
                        <h3 className="font-bold">Buyer</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Verifies authenticity via QR + Mirror Node
                        </p>
                    </motion.div>

                </div>

            </section>

            {/* ================= FRAUD ================= */}
            <section id="fraud" className="py-24 container mx-auto px-4">

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
                                    className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600"
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

                <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl border bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background shadow-lg">

                    <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                        Start building trust in food systems
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Join AgroDex and make every agricultural product verifiable, transparent, and fraud-resistant.
                    </p>

                    <Link to="/register">
                        <Button size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700">
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