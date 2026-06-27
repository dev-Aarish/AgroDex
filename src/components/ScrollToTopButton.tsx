import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";

const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 300);
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <Button
            type="button"
            size="icon"
            aria-label="Scroll to top"
            title="Scroll to top"
            onClick={scrollToTop}
            className={`
        fixed bottom-24 right-6 z-50 rounded-full shadow-lg
        transition-all duration-300
        ${
                isVisible
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-4 pointer-events-none"
            }
      `}
        >
            <ChevronUp className="h-5 w-5" />
        </Button>
    );
};

export default ScrollToTopButton;
