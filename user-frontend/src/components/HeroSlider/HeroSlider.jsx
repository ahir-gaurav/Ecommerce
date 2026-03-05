import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { heroAPI } from '../../api';
import './HeroSlider.css';

const FALLBACK_SLIDE = { bg: '#D6F2FF', badgeText: 'Welcome', headline: 'Discover Our\nCollection', cta: 'Shop Now →', image: '' };

const DURATION = 4000;

export default function HeroSlider() {
    const navigate = useNavigate();
    const [slides, setSlides] = useState([FALLBACK_SLIDE]);
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const [fillKey, setFillKey] = useState(0);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    useEffect(() => {
        heroAPI.getSlides()
            .then(res => {
                const apiSlides = res?.data?.slides || [];
                if (apiSlides.length > 0) {
                    setSlides(apiSlides.map(s => ({
                        ...s,
                        headline: s.headline || '',
                        image: s.image ? (s.image.startsWith('http') ? s.image : `${API_BASE}${s.image}`) : ''
                    })));
                }
            })
            .catch(err => console.error('Failed to fetch hero slides:', err))
            .finally(() => setLoading(false));
    }, [API_BASE]);

    /* ── Auto-advance timer ──────────────────────────────────────
     *  A plain setTimeout is the only reliable primitive here.
     *  - Re-created every time `current` or `paused` changes.
     *  - When `paused` is true we simply never schedule it.
     *  - No dependency on CSS animation events whatsoever.
     * ────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (paused || slides.length <= 1) return;    // no timer if paused or only one slide
        const id = setTimeout(() => {
            setCurrent(c => (c + 1) % slides.length);
        }, DURATION);
        return () => clearTimeout(id);              // cleanup on every re-run
    }, [current, paused, slides.length]);           // reset timer on slide change too

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
                                    alt={(slide.headline || '').replace('\n', ' ')}
                                    className={`hs2-img${i === current ? ' hs2-img--active' : ''}`}
                                />
                            ) : (
                                <div className={`hs2-img-placeholder${i === current ? ' hs2-img--active' : ''}`} />
                            )}
                        </div>

                        <div className="hs2-slide__content">
                            <span className="hs2-badge">{slide.badgeText}</span>
                            <h1 className="hs2-headline">
                                {(slide.headline || '').split('\n').map((line, li, arr) => (
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
