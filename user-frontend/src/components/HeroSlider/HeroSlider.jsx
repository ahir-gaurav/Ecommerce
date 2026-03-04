import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { heroAPI } from '../../api';
import './HeroSlider.css';

const BASE_SLIDES = [
    { bg: '#D6F2FF', badgeText: 'SPF 50 | PA++++', headline: 'Shield Your Skin\nThis Summer', cta: 'Shop Now →', image: '' },
    { bg: '#FFF3EC', badgeText: 'FREE Kit on orders above ₹599', headline: 'Your Routine,\nAnywhere', cta: 'Shop Now →', image: '' },
    { bg: '#F5F5F0', badgeText: 'FREE Face Towel on orders above ₹899', headline: 'Cleanse.\nTreat. Glow.', cta: 'Shop Now →', image: '' },
];

const DURATION = 4000;

export default function HeroSlider() {
    const navigate = useNavigate();
    const [slides, setSlides] = useState(BASE_SLIDES);
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    // fillKey increments every time the bar animation should restart from 0
    const [fillKey, setFillKey] = useState(0);

    /* ── Fetch slides from API (runs once) ───────────────────── */
    useEffect(() => {
        heroAPI.getSlides()
            .then(res => {
                const api = res.data.slides || [];
                setSlides(BASE_SLIDES.map((def, i) => {
                    const s = api[i];
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
            .catch(() => { /* keep defaults */ });
    }, []);

    /* ── Auto-advance timer ──────────────────────────────────────
     *  A plain setTimeout is the only reliable primitive here.
     *  - Re-created every time `current` or `paused` changes.
     *  - When `paused` is true we simply never schedule it.
     *  - No dependency on CSS animation events whatsoever.
     * ────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (paused) return;                          // hover → do nothing
        const id = setTimeout(() => {
            setCurrent(c => (c + 1) % BASE_SLIDES.length);
        }, DURATION);
        return () => clearTimeout(id);              // cleanup on every re-run
    }, [current, paused]);                           // reset timer on slide change too

    /* ── Reset fill bar whenever slide changes ───────────────── */
    useEffect(() => {
        setFillKey(k => k + 1);
    }, [current]);

    /* ── Navigation helpers ──────────────────────────────────── */
    const goTo = useCallback((i) => { setCurrent(i); }, []);

    // On mouse-leave we also bump fillKey so the bar resets in
    // sync with the freshly-restarted 4-second timer.
    const handleMouseLeave = useCallback(() => {
        setPaused(false);
        setFillKey(k => k + 1);
    }, []);

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <section
            className="hs2-root"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={handleMouseLeave}
        >
            {/* Slides */}
            <div className="hs2-track">
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        className={`hs2-slide${i === current ? ' hs2-slide--active' : ''}`}
                        style={{ '--slide-bg': slide.bg }}
                    >
                        <div className="hs2-slide__img-col">
                            {slide.image ? (
                                <img
                                    src={slide.image}
                                    alt={slide.headline.replace('\n', ' ')}
                                    className={`hs2-img${i === current ? ' hs2-img--active' : ''}`}
                                />
                            ) : (
                                <div className={`hs2-img-placeholder${i === current ? ' hs2-img--active' : ''}`} />
                            )}
                        </div>

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

            {/* Dash-bar progress indicator */}
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
                                    key={fillKey}
                                    /**
                                     * NO onAnimationEnd — the timer (setTimeout) drives
                                     * slide advancement, not the CSS animation.
                                     * The fill span is pure visual decoration.
                                     * paused class freezes it in place while hovered.
                                     */
                                    className={`hs2-bar__fill${paused ? ' hs2-bar__fill--paused' : ''}`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
