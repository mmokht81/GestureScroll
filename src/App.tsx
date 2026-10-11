
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  GestureRecognizer,
} from "@mediapipe/tasks-vision";
import "./App.css";

const slides = [
  {
    title: "Ideas That Move Us",
    subtitle: "A simple presentation controlled by hand gestures.",
    image: "/images/slide-1.svg",
    label: "01 / INTRODUCTION",
  },
  {
    title: "Explore New Horizons",
    subtitle: "Move forward naturally with one simple gesture.",
    image: "/images/slide-2.svg",
    label: "02 / EXPLORATION",
  },
  {
    title: "Create What's Next",
    subtitle: "Technology makes interaction feel effortless.",
    image: "/images/slide-3.svg",
    label: "03 / THE FUTURE",
  },
];

function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [status, setStatus] = useState("در حال آماده‌سازی دوربین...");
  const [gesture, setGesture] = useState("هنوز ژستی تشخیص داده نشده");

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    let animationId = 0;
    let stream: MediaStream | null = null;
    let recognizer: GestureRecognizer | null = null;    
    let lastVideoTime = -1;
    let armed = true;
    let lastLoggedGesture = "";
    let neutralFrames = 0;
    let pointingFrames = 0;
    let fistFrames = 0;

    const POINTING_FRAMES_REQUIRED = 2;
    const FIST_FRAMES_REQUIRED = 3;
    const NEUTRAL_FRAMES_REQUIRED = 6;


    async function start() {
      try {
        setStatus("در انتظار اجازه دسترسی به دوربین...");

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        const vision = await FilesetResolver.forVisionTasks(
          "/mediapipe/wasm",
        );

        recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/gesture_recognizer.task",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (cancelled) {
          recognizer.close();
          return;
        }

        setStatus("دوربین فعال است؛ ژست دستت را نشان بده.");

        function detectFrame() {
          if (cancelled || !video || !recognizer) return;

          if (
            video.readyState >= 2 &&
            video.currentTime !== lastVideoTime
          ) {
            lastVideoTime = video.currentTime;

            const result = recognizer.recognizeForVideo(
              video,
              performance.now(),
            );

            const category = result.gestures?.[0]?.[0];
            const name = category?.categoryName ?? "None";
            const confidence = category?.score ?? 0;

            if (name !== lastLoggedGesture) {
              console.log(
                "[Gesture Debug]",
                name,
                `${Math.round(confidence * 100)}%`,
              );

              lastLoggedGesture = name;
            }
            
            const isNeutral = name === "None" || confidence < 0.60;

            if (isNeutral) {
              neutralFrames++;
              pointingFrames = 0;
              fistFrames = 0;

              setGesture("دستت را برای ژست بعدی رها کن");

              if (neutralFrames >= NEUTRAL_FRAMES_REQUIRED) {
                armed = true;
                setGesture("آماده تشخیص ژست بعدی");
              }
            } else {
              neutralFrames = 0;

              if (name === "1" || name === "Pointing_Up") {
                pointingFrames = Math.min(
                  pointingFrames + 1,
                  POINTING_FRAMES_REQUIRED,
                );
                fistFrames = 0;

                setGesture("☝️ در حال تشخیص انگشت اشاره...");

                if (pointingFrames >= POINTING_FRAMES_REQUIRED && armed) {
                  setCurrentSlide((index) => (index + 1) % slides.length);
                  setGesture("☝️ انگشت اشاره — اسلاید بعدی");
                  armed = false;
                }
              } else if (name === "fist" || name === "Closed_Fist") {
                fistFrames = Math.min(
                  fistFrames + 1,
                  FIST_FRAMES_REQUIRED,
                );
                pointingFrames = 0;

                setGesture("✊ در حال تشخیص مشت بسته...");

                if (fistFrames >= FIST_FRAMES_REQUIRED && armed) {
                  setCurrentSlide(
                    (index) => (index - 1 + slides.length) % slides.length,
                  );
                  setGesture("✊ مشت بسته — اسلاید قبلی");
                  armed = false;
                }
              } else {
                pointingFrames = 0;
                fistFrames = 0;

                setGesture(`ژست شناسایی‌شده: ${name}`);
              }
            }

          }

          animationId = requestAnimationFrame(detectFrame);
        }
        

        detectFrame();
      } catch (error) {
        console.error("Camera or MediaPipe error:", error);

        if (!cancelled) {
          setStatus(
            "راه‌اندازی ناموفق بود؛ دسترسی دوربین و اتصال اینترنت را بررسی کن.",
          );
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationId);
      stream?.getTracks().forEach((track) => track.stop());
      recognizer?.close();
    };
  }, []);

  const slide = slides[currentSlide];

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">G</span>
          <span>GESTURE<span className="muted">SLIDES</span></span>
        </div>
        <span className="live-status">
          <span className="live-dot" />
          LIVE DEMO
        </span>
      </header>

      <section className="intro">
        <p className="eyebrow">A NEW WAY TO PRESENT</p>
        <h1>Present with a <span>gesture.</span></h1>
        <p className="intro-copy">
          Move through your presentation without touching a button.
        </p>
      </section>

      <section className="presentation">
        <div
          className="slide"
          style={{ backgroundImage: `url("${slide.image}")` }}
        >
          <div className="slide-overlay" />
          <div className="slide-content" key={currentSlide}>
            <span className="slide-label">{slide.label}</span>
            <h2>{slide.title}</h2>
            <p>{slide.subtitle}</p>
          </div>

          <div className="slide-count">
            {String(currentSlide + 1).padStart(2, "0")}
            <span> / {String(slides.length).padStart(2, "0")}</span>
          </div>
        </div>

        <div className="slide-controls">
          <button
            className="nav-button"
            onClick={() =>
              setCurrentSlide(
                (index) => (index - 1 + slides.length) % slides.length,
              )
            }
            aria-label="Previous slide"
          >
            ←
          </button>

          <div className="slide-dots">
            {slides.map((item, index) => (
              <button
                key={item.label}
                className={`dot ${index === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            className="nav-button"
            onClick={() =>
              setCurrentSlide((index) => (index + 1) % slides.length)
            }
            aria-label="Next slide"
          >
            →
          </button>
        </div>
      </section>

      <section className="gesture-panel">
        <div className="gesture-info">
          <div className="camera-preview">
            <video ref={videoRef} autoPlay muted playsInline />
          </div>
          <div>
            <p className="panel-label">CAMERA STATUS</p>
            <p className="panel-value">{status}</p>
            <p className="gesture-reading">{gesture}</p>
          </div>
        </div>

        <div className="gesture-guide">
          <div className="guide-item">
            <span className="guide-icon">☝️</span>
            <span>اشاره به بالا</span>
            <strong>اسلاید بعدی</strong>
          </div>
          <div className="guide-item">
            <span className="guide-icon">✊</span>
            <span>مشت بسته</span>
            <strong>اسلاید قبلی</strong>
          </div>
        </div>
      </section>

      <footer>
        <span>GESTURE SLIDES · PROTOTYPE</span>
        <span>DESIGNED FOR A NATURAL PRESENTATION</span>
      </footer>
    </main>
  );
}

export default App;
