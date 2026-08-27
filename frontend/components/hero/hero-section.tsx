"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, BookOpen, Sparkles } from "lucide-react";

// Relatable images for learning and blogging
const HERO_IMAGES = [
    {
        url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
        alt: "Collaborative learning and coding"
    },
    {
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
        alt: "Web development and online learning"
    },
    {
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
        alt: "Coding environment and technical writing"
    },
    {
        url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
        alt: "Tech presentation and group learning"
    }
];

const HeroSection = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Auto-advance images every 4 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 4000);

        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative w-full overflow-hidden bg-background text-foreground py-10 sm:py-20 lg:py-28 transition-colors duration-300">

            {/* Background Grid Pattern & Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[280px] sm:w-[650px] h-[320px] bg-blue-500/15 dark:bg-blue-500/20 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-[220px] h-[220px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none hidden lg:block" />

            {/* Inner Content Container */}
            <div className="max-w-7xl relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">

                    {/* Left Content Column */}
                    <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 sm:space-y-8">

                        {/* Platform Badge */}
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-[11px] xs:text-xs sm:text-sm font-medium shadow-xs">
                            <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-blue-500 animate-pulse" />
                            <span>Learn Skills & Read Expert Insights</span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-3xl xs:text-3xl sm:text-3xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] sm:leading-[1.08]">
                            Master new skills &{" "}
                            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-400 dark:to-sky-400">
                                read insightful blogs
                                <svg className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-2.5 sm:h-3 text-blue-500/30" viewBox="0 0 100 20" preserveAspectRatio="none">
                                    <path d="M0,15 Q50,5 100,15" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                                </svg>
                            </span>
                        </h1>

                        {/* Platform Description */}
                        <p className="max-w-xl text-sm xs:text-base sm:text-lg text-muted-foreground leading-relaxed">
                            Mentora brings hands-on courses and rich developer articles together under one platform. Build real-world projects and stay updated with modern tech.
                        </p>

                        {/* Action CTAs */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <Link
                                href="/courses"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all duration-200 active:scale-95"
                            >
                                <GraduationCap className="h-4 sm:h-5 w-4 sm:w-5" />
                                <span>Browse Courses</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <Link
                                href="/blogs"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base font-semibold border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 backdrop-blur-md transition-all duration-200 active:scale-95"
                            >
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span>Read Articles</span>
                            </Link>
                        </div>

                        {/* Platform Stats Bar */}
                        <div className="pt-6 sm:pt-8 border-t border-border/60 w-full max-w-md sm:max-w-lg">
                            <div className="grid grid-cols-3 gap-2 sm:gap-6">
                                <div className="space-y-0.5 sm:space-y-1">
                                    <div className="text-xl sm:text-3xl font-extrabold text-foreground">30+</div>
                                    <div className="text-[10px] sm:text-sm font-medium text-muted-foreground">Active Courses</div>
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 border-l border-border/50 pl-2 sm:pl-6">
                                    <div className="text-xl sm:text-3xl font-extrabold text-foreground">500+</div>
                                    <div className="text-[10px] sm:text-sm font-medium text-muted-foreground">Tech Blogs</div>
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 border-l border-border/50 pl-2 sm:pl-6">
                                    <div className="text-xl sm:text-3xl font-extrabold text-foreground">15K+</div>
                                    <div className="text-[10px] sm:text-sm font-medium text-muted-foreground">Learners</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Image Column: Completely hidden on screens <1024px (hidden lg:flex) */}
                    <div className="hidden lg:flex lg:col-span-5 justify-end">
                        <div className="relative w-full max-w-[400px]">

                            {/* Outer Ambient Glow */}
                            <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 opacity-20 blur-xl dark:opacity-30" />

                            {/* Clean Auto-Sliding Card Wrapper */}
                            <div className="relative rounded-3xl border border-border/80 bg-card/80 p-3.5 shadow-2xl backdrop-blur-md">
                                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
                                    {HERO_IMAGES.map((img, index) => (
                                        <div
                                            key={img.url}
                                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                                                }`}
                                        >
                                            <Image
                                                src={img.url}
                                                alt={img.alt}
                                                fill
                                                className="object-cover"
                                                priority={index === 0}
                                                sizes="400px"
                                            />
                                            {/* Gradient Overlay for contrast */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                                        </div>
                                    ))}

                                    {/* Subtle Pagination Indicators */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                                        {HERO_IMAGES.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex
                                                        ? "w-6 bg-white"
                                                        : "w-1.5 bg-white/50 hover:bg-white/80"
                                                    }`}
                                                aria-label={`Go to image ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default HeroSection;