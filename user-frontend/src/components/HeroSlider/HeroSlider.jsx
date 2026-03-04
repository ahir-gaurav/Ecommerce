import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroSlider.css';

/* ─── Slide data ─────────────────────────────────────────── */
const SLIDES = [
    {
        id: 0,
        bg: '#D6F2FF',
        image: 'https://placehold.co/700x540/D6F2FF/1A1A1A?text=Sunscreen+%26+Serum',
        badge: 'SPF 50 | PA++++',
        headline: 'Shield Your Skin\nThis Summer',
        cta: 'Shop Now →',
    },
    {
        id: 1,
        bg: '#FFF3EC',
        image: 'https://placehold.co/700x540/FFF3EC/1A1A1A?text=Travel+Skincare+Kit',
        badge: 'FREE Kit on orders above ₹599',
        headline: 'Your Routine,\nAnywhere',
        cta: 'Shop Now →',
    },
    {
        id: 2,
        bg: '#F5F5F0',
        image: 'https://placehold.co/700x540/F5F5F0/1A1A1A?text=Face+Towel+%26+Glow',
        badge: 'FREE Face Towel on orders above ₹899',
        headline: 'Cleanse.\nTreat. Glow.',
        cta: 'Shop Now →',
    },
];

/* ─── Component ─────────────────────────────────────────── */
export default function HeroSlider() {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    /* advance is stable — no closure issues */
    const advance = useCallback(() => {
        setCurrent(prev => (prev + 1) % SLIDES.length);
    }, []);

    const goTo = useCallback(i => {
        setCurrent(i);
    }, []);

    return (
        <section
            className="hs2-root"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* ── Slides ─────────────────────────────────────── */}
            <div className="hs2-track">
                {SLIDES.map((slide, i) => (
                    <div
                        key={slide.id}
                        className={`hs2-slide${i === current ? ' hs2-slide--active' : ''}`}
                        style={{ '--slide-bg': slide.bg }}
                    >
                        {/* Image — left 60% */}
                        <div className="hs2-slide__img-col">
                            <img
                                src={slide.image}
                                alt={slide.headline.replace('\n', ' ')}
                                className={`hs2-img${i === current ? ' hs2-img--active' : ''}`}
                            />
                        </div>

                        {/* Content — right 40% */}
                        <div className="hs2-slide__content">
                            <span className="hs2-badge">{slide.badge}</span>
                            <h1 className="hs2-headline">
                                {slide.headline.split('\n').map((line, li, arr) => (
                                    <span key={li}>
                                        {line}
                                        {li < arr.length - 1 && <br />}
                                    </span>
                                ))}
                            </h1>
                            <button className="hs2-cta" onClick={() => navigate('/shop')}>
                                {slide.cta}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Dash-Bar Progress Indicator ─────────────────── */}
            <div className="hs2-bars">
                {SLIDES.map((slide, i) => {
                    const state =
                        i < current ? 'past' : i === current ? 'active' : 'future';

                    return (
                        <button
                            key={slide.id}
                            className={`hs2-bar hs2-bar--${state}`}
                            onClick={() => goTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                        >
                            {state === 'active' && (
                                /*
                                 * key={current} forces a fresh mount each time this bar
                                 * becomes active → CSS animation always resets to 0%.
                                 * paused class flips animation-play-state without remounting
                                 * → CSS resumes from the exact paused position automatically.
                                 * onAnimationEnd fires when fill reaches 100% → advance.
                                 */
                                <span
                                    key={current}
                                    className={`hs2-bar__fill${paused ? ' hs2-bar__fill--paused' : ''}`}
                                    onAnimationEnd={advance}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
