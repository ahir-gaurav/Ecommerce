import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { heroAPI } from '../../api';
import './HeroSlider.css';

const FALLBACK_SLIDE = { bg: '#D6F2FF', badgeText: '', headline: 'Discover Our\nCollection', cta: 'Shop Now →', image: '' };
const DURATION = 4000;

export default function HeroSlider() {
    const navigate = useNavigate();
    const [slides, setSlides] = useState([FALLBACK_SLIDE]);
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const [fillKey, setFillKey] = useState(0);

    // Keep a ref to latest slides count so the timer never uses a stale closure
    const slidesLenRef = useRef(1);
    useEffect(() => { slidesLenRef.current = slides.length; }, [slides]);

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    // ── Fetch slides from API ──────────────────────────────────
    useEffect(() => {
        heroAPI.getSlides()
            .then(res => {
                const apiSlides = res?.data?.slides || [];
                if (apiSlides.length > 0) {
                    setSlides(apiSlides.map(s => ({
                        ...s,
                        headline: s.headline || s.title || '',
                        badgeText: s.badgeText || s.subtitle || '',
                        cta: s.cta || s.ctaText || 'Shop Now →',
                        image: s.image
                            ? (s.image.startsWith('http') ? s.image : `${API_BASE}${s.image}`)
                            : ''
                    })));
                }
            })
            .catch(err => console.error('Failed to fetch hero slides:', err));
    }, [API_BASE]);

    // ── Auto-advance timer ────────────────────────────────────
    //  - Uses setTimeout (not CSS animationEnd) — reliable across all browsers
    //  - Cleared and restarted on every slide change or pause toggle
    //  - Uses slidesLenRef to avoid stale-closure bugs
    useEffect(() => {
        if (paused || slides.length <= 1) return;

        const id = setTimeout(() => {
            setCurrent(c => (c + 1) % slidesLenRef.current);
        }, DURATION);

        return () => clearTimeout(id);
    }, [current, paused, slides.length]);   // deps reset the timer on every change

    // ── Reset fill bar on slide change ────────────────────────
    //  The CSS animation is purely cosmetic — it does NOT drive slide changes.
    //  Bumping fillKey mounts a fresh <span> so the animation restarts cleanly.
    useEffect(() => {
        setFillKey(k => k + 1);
    }, [current]);

    // ── Navigation helpers ────────────────────────────────────
    const goTo = useCallback((i) => { setCurrent(i); }, []);

    const handleMouseLeave = useCallback(() => {
        setPaused(false);
        setFillKey(k => k + 1);   // restart fill bar from 0 when hover ends
    }, []);

    // ── Render ────────────────────────────────────────────────
    return (
        <section
            className="hs2-root"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={handleMouseLeave}
        >
            <div className="hs2-track">
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        className={`hs2-slide${i === current ? ' hs2-slide--active' : ''}`}
                    >
                        {/* Left panel — image */}
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

                        {/* Right panel — text */}
                        <div className="hs2-slide__content" style={{ '--slide-bg': slide.bg }}>
                            {slide.badgeText && (
                                <span className="hs2-badge">{slide.badgeText}</span>
                            )}
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

            {/* Progress indicator — purely visual, NOT driving slide changes */}
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
                                    className={`hs2-bar__fill${paused ? ' hs2-bar__fill--paused' : ''}`}
                                /* NO onAnimationEnd here — setTimeout is the source of truth */
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
