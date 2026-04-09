"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import "./globals.css";

const content = {
  ja: {
    name: "青野 大洋",
    aboutTitle: "自己紹介",
    aboutContent:
      '◎気軽に連絡ください！<br><br>・慶應義塾大学環境情報学部 <a href="https://met-lab.sfc.keio.ac.jp/wordpress/" target="_blank">気象学研究会（宮本研）</a>学部3年←神奈川県立湘南高校←横浜国大附属鎌倉小中<br>・<a href="https://life-is-tech.com" target="_blank">Life is Tech!（株）</a>で企業向けIT研修など<br>・<a href="https://ut-lab.toggle.co.jp" target="_blank">UT-Lab</a>メンバー<br>・理学的な環境や自然と、実学的な社会や経済活動、どちらにも強い関心があり、またそれらがテクノロジーで繋がっていくさまにもワクワクします。<br>・最近は気ままに天気の勉強、山登りやスキーなどをしています。<br><br>近況<br>・Sushi Tech Tokyo ITAMAEで4/29行きます<br>・革命的なレストラン検索アプリを４月にリリースします<br>・SFC内の環境系コミュニティを作っています（情報系：RGの環境版的なイメージ、ゼミ間の交流があるといいな）',
    thatskyCopy: "— あの日、あの場所、あの空に、もう一度会いに行く。",
    thatskyDesc:
      "過去の空を限りなくリアルに再現する空画像ジェネレーター。場所・日時・方角を指定すると、過去の気象データと太陽角度をもとにリアルな画像を生成。あなたが生まれたその時の空、今見てみたくありませんか。",
    worksTitle: "プロダクト",
    musicTitle: "好きな曲",
  },
  en: {
    name: "Taiyo Aono",
    aboutTitle: "About Me",
    aboutContent:
      'Feel free to reach out!<br><br>・Junior at Keio University SFC, <a href="https://met-lab.sfc.keio.ac.jp/wordpress/" target="_blank">Meteorology Lab (Miyamoto Lab)</a> ← Shonan High School ← Yokohama National Univ. Kamakura Elem/JHS<br>・Corporate IT training at <a href="https://life-is-tech.com" target="_blank">Life is Tech! Inc.</a><br>・<a href="https://ut-lab.toggle.co.jp" target="_blank">UT-Lab</a> member<br>・Passionate about both the natural sciences and business/economics, and excited by how technology bridges the two.<br>・Currently studying meteorology, hiking, and skiing.<br><br>Updates<br>・Attending Sushi Tech Tokyo ITAMAE on 4/29<br>・Launching a restaurant search app in April<br>・Building an environment-focused community at SFC',
    thatskyCopy: "— Revisit the sky of that day, that place, once more.",
    thatskyDesc:
      "A sky image generator that recreates past skies with stunning realism. Specify a location, date/time, and direction — it generates a realistic image based on historical weather data and solar angles. The sky the moment you were born — wouldn't you like to see it?",
    worksTitle: "Works",
    musicTitle: "My Playlist",
  },
} as const;

type Lang = "ja" | "en";

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("ja");
  const switcherRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const sliderStartLeftRef = useRef(3);
  const didDragRef = useRef(false);

  const c = content[lang];

  const updateSliderPos = useCallback(
    (targetLang: Lang, animate: boolean) => {
      const slider = sliderRef.current;
      const switcher = switcherRef.current;
      if (!slider || !switcher) return;

      if (!animate) slider.classList.add("dragging");
      else slider.classList.remove("dragging");

      const switcherRect = switcher.getBoundingClientRect();
      const pad = 3;
      const sliderW = (switcherRect.width - pad * 2) / 2;
      slider.style.left =
        targetLang === "ja" ? `${pad}px` : `${pad + sliderW}px`;
    },
    []
  );

  useEffect(() => {
    updateSliderPos("ja", false);
    requestAnimationFrame(() => {
      sliderRef.current?.classList.remove("dragging");
    });
  }, [updateSliderPos]);

  const switchLang = useCallback(
    (newLang: Lang) => {
      if (newLang === lang) return;
      setLang(newLang);
      updateSliderPos(newLang, true);
    },
    [lang, updateSliderPos]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      didDragRef.current = false;
      startXRef.current = e.clientX;
      sliderStartLeftRef.current =
        parseFloat(sliderRef.current?.style.left || "3") || 3;
      sliderRef.current?.classList.add("dragging");
      switcherRef.current?.setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) < 3) return;
    didDragRef.current = true;

    const switcher = switcherRef.current;
    const slider = sliderRef.current;
    if (!switcher || !slider) return;

    const switcherRect = switcher.getBoundingClientRect();
    const pad = 3;
    const sliderW = (switcherRect.width - pad * 2) / 2;
    const minLeft = pad;
    const maxLeft = pad + sliderW;
    const newLeft = Math.min(
      maxLeft,
      Math.max(minLeft, sliderStartLeftRef.current + dx)
    );
    slider.style.left = `${newLeft}px`;
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      sliderRef.current?.classList.remove("dragging");

      const switcher = switcherRef.current;
      if (!switcher) return;

      if (!didDragRef.current) {
        const rect = switcher.getBoundingClientRect();
        const tapX = e.clientX - rect.left;
        const newLang: Lang = tapX < rect.width / 2 ? "ja" : "en";
        updateSliderPos(newLang, true);
        if (newLang !== lang) setLang(newLang);
      } else {
        const switcherRect = switcher.getBoundingClientRect();
        const pad = 3;
        const sliderW = (switcherRect.width - pad * 2) / 2;
        const currentLeft = parseFloat(sliderRef.current?.style.left || "3");
        const midpoint = pad + sliderW / 2;
        const newLang: Lang = currentLeft < midpoint ? "ja" : "en";
        updateSliderPos(newLang, true);
        if (newLang !== lang) setLang(newLang);
      }
    },
    [lang, updateSliderPos]
  );

  const onPointerCancel = useCallback(() => {
    draggingRef.current = false;
    sliderRef.current?.classList.remove("dragging");
    updateSliderPos(lang, true);
  }, [lang, updateSliderPos]);

  return (
    <div className="container">
      <div
        className="lang-switcher"
        ref={switcherRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className="lang-slider" ref={sliderRef} />
        <button
          className={`lang-option ${lang === "ja" ? "active" : ""}`}
          style={{ paddingLeft: 13, paddingRight: 15 }}
        >
          JP
        </button>
        <button
          className={`lang-option ${lang === "en" ? "active" : ""}`}
        >
          EN
        </button>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/profile2.jpg" alt="Taiyo Aono" className="profile-image" />
      <h1
        className="profile-name"
        style={{
          fontFamily:
            lang === "ja"
              ? "'Yu Gothic', 'YuGothic', sans-serif"
              : "'Albert Sans', sans-serif",
          fontWeight: 600,
        }}
      >
        {c.name}
      </h1>

      <div className="social-icons">
        <a href="mailto:aonotaiyo@outlook.com" aria-label="Email">
          <svg viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </a>
        <a
          href="https://linkedin.com/in/taiyoaono"
          target="_blank"
          rel="noopener"
          aria-label="LinkedIn"
        >
          <svg viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        </a>
        <a
          href="https://instagram.com/taiyo.aono"
          target="_blank"
          rel="noopener"
          aria-label="Instagram"
        >
          <svg viewBox="0 0 24 24">
            <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
        </a>
        <a
          href="https://www.facebook.com/taiyoaono"
          target="_blank"
          rel="noopener"
          aria-label="Facebook"
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
          </svg>
        </a>
        <a
          href="https://x.com/taiyoaono"
          target="_blank"
          rel="noopener"
          aria-label="X"
        >
          <svg viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a
          href="https://youtrust.jp/users/taiyoaono"
          target="_blank"
          rel="noopener"
          aria-label="YOUTRUST"
        >
          <svg viewBox="1830 40 82 74">
            <path
              d="M1899.273 83.391l-14.69-3.67a24.541 24.541 0 00-40.837-10.2A15.285 15.285 0 011832.91 74c-.193 0-.385 0-.576-.012a39.302 39.302 0 00-.079 2.46 39.123 39.123 0 0011.083 27.334 24.537 24.537 0 0035.117.424z"
              opacity=".55"
            />
            <path
              d="M1899.685 49.113a24.538 24.538 0 00-35.112-.422L1844 69.267l-.086.083c-.07.072-.142.143-.213.213a15.311 15.311 0 01-7.06 3.982c.5.974 1.043 1.923 1.62 2.848.128.206.26.41.392.614l.029.045a39.258 39.258 0 0061.289 5.687 15.274 15.274 0 0110.15-3.841c.193 0 .384 0 .576.012.05-.814.079-1.633.079-2.46a39.124 39.124 0 00-11.091-27.337z"
              opacity=".75"
            />
          </svg>
        </a>
      </div>

      <div className="link-list">
        <div className="section-title">{c.aboutTitle}</div>
        <div className="link-card">
          <div
            className="link-card-content"
            dangerouslySetInnerHTML={{ __html: c.aboutContent }}
          />
        </div>
      </div>

      <div className="music-section">
        <div className="section-title">{c.musicTitle}</div>
        <a
          href="https://music.apple.com/jp/playlist/favorite-songs/pl.u-r0URLmKlRG?l=en"
          target="_blank"
          rel="noopener"
          className="music-card"
        >
          <div className="music-card-artwork">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favorite-star.png" alt="Favorite Songs" />
          </div>
          <div className="music-card-info">
            <div className="music-card-text">
              <div className="music-card-title">Favorite Songs</div>
              <div className="music-card-artist">taiyoaono</div>
              <div className="music-card-badge">
                <svg viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.2-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.28 2.13-9.54 3.24-12.8 3.35-4.93.21-9.84-1.96-14.75-6.52-3.13-2.73-7.05-7.41-11.76-14.04-5.05-7.11-9.2-15.36-12.46-24.76-3.5-10.17-5.25-20.01-5.25-29.54 0-10.92 2.36-20.34 7.07-28.24 3.71-6.33 8.64-11.33 14.83-15 6.19-3.67 12.87-5.54 20.07-5.66 3.92 0 9.06 1.21 15.43 3.59 6.35 2.39 10.43 3.6 12.22 3.6 1.34 0 5.87-1.42 13.56-4.24 7.27-2.62 13.41-3.7 18.44-3.27 13.63 1.1 23.87 6.47 30.68 16.15-12.19 7.39-18.22 17.73-18.1 31 .11 10.33 3.86 18.93 11.22 25.77 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.1-2.96 15.67-8.86 22.67-7.12 8.32-15.73 13.13-25.07 12.37a25.2 25.2 0 01-.19-3.07c0-7.78 3.39-16.1 9.4-22.9 3-3.44 6.82-6.31 11.45-8.6 4.62-2.26 8.99-3.51 13.1-3.71.12 1.08.17 2.16.17 3.24z" />
                </svg>
                <span>Music</span>
              </div>
            </div>
          </div>
        </a>
      </div>

      <div className="works-section">
        <div className="section-title">{c.worksTitle}</div>
        <a
          href="https://that-sky.com"
          target="_blank"
          rel="noopener"
          className="work-card"
        >
          <div className="work-card-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thatsky-preview.png" alt="That Sky preview" />
          </div>
          <div className="work-card-body">
            <div className="work-card-name">
              That Sky <span className="work-card-copy">{c.thatskyCopy}</span>
            </div>
            <div className="work-card-desc">{c.thatskyDesc}</div>
            <div className="work-card-tags">
              <span className="tag">Image generation AI</span>
              <span className="tag">Web</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
