import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { heroAPI } from '../../api';
import './HeroSlider.css';

/* ── Hardcoded defaults (shown instantly, overridden by API) ─ */
const SLIDE_DEFAULTS = [
    { bg: '#D6F2FF', badgeText: 'SPF 50 | PA++++', headline: 'Shield Your Skin\nThis Summer', cta: 'Shop Now →', image: '' },
    { bg: '#FFF3EC', badgeText: 'FREE Kit on orders above ₹599', headline: 'Your Routine,\nAnywhere', cta: 'Shop Now →', image: '' },
    { bg: '#F5F5F0', badgeText: 'FREE Face Towel on orders above ₹899', headline: 'Cleanse.\nTreat. Glow.', cta: 'Shop Now →', image: '' },
];

/* ── Component ─────────────────────────────────────────────── */
export default function HeroSlider() {
    const navigate = useNavigate();
    const [slides, setSlides] = useState(SLIDE_DEFAULTS);
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    /* ── Fetch slides from API, merge over defaults ─────────── */
    useEffect(() => {
        heroAPI.getSlides()
            .then(res => {
                const apiSlides = res.data.slides || [];
                setSlides(SLIDE_DEFAULTS.map((def, i) => {
                    const s = apiSlides[i];
                    if (!s) return def;
                    return {
                        bg: s.bg || def.bg,
                        badgeText: s.badgeText || def.badgeText,
                        headline: s.headline || def.headline,
                        cta: s.cta || def.cta,
                        image: s.image || def.image,
                    };
                }));
            })
            .catch(() => { /* fallback to defaults already set */ });
    }, []);

    const advance = useCallback(() => {
        setCurrent(prev => (prev + 1) % slides.length);
    }, [slides.length]);

    const goTo = useCallback(i => { setCurrent(i); }, []);

    return (
        <section
            className="hs2-root"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* ── Slides ─────────────────────────────────── */}
            <div className="hs2-track">
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        className={`hs2-slide${i === current ? ' hs2-slide--active' : ''}`}
                        style={{ '--slide-bg': slide.bg }}
                    >
                        {/* Image — left 60% */}
                        <div className="hs2-slide__img-col">
                            {slide.image ? (
                                <img
                                    src={slide.image}
                                    alt={slide.headline.replace('\n', ' ')}
                                    className={`hs2-img${i === current ? ' hs2-img--active' : ''}`}
                                />
                            ) : (
                                /* Placeholder when no image is configured */
                                <div className={`hs2-img-placeholder${i === current ? ' hs2-img--active' : ''}`} />
                            )}
                        </div>

                        {/* Content — right 40% */}
                        <div className="hs2-slide__content">
                            <span className="hs2-badge">{slide.badgeText}</span>
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

            {/* ── Dash-Bar Progress Indicator ────────────── */}
            <div className="hs2-bars">
                {slides.map((_, i) => {
                    const state = i < current ? 'past' : i === current ? 'active' : 'future';
                    return (
                        <button
                            key={i}
                            className={`hs2-bar hs2-bar--${state}`}
                            onClick={() => goTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                        >
                            {state === 'active' && (
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
