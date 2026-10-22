import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  GestureRecognizer,
} from "@mediapipe/tasks-vision";
import "./App.css";

type Point = {
  x: number;
  y: number;
  z?: number;
};
// SCROLL_SENSITIVITY


function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getPinchDistance(landmarks: Point[]): number | null {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  if (!thumbTip || !indexTip) {
    return null;
  }

  return distance(thumbTip, indexTip);
}

function App() {
  const [status, setStatus] = useState("Preparing camera...");
  const [gesture, setGesture] = useState(
    "Place your hand in front of the camera",
  );

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    let animationId = 0;
    let stream: MediaStream | null = null;
    let recognizer: GestureRecognizer | null = null;
    let lastVideoTime = -1;
    let lastUiMessage = "";

    const PINCH_START_DISTANCE = 0.055;
    const PINCH_RELEASE_DISTANCE = 0.075;
    const SCROLL_SENSITIVITY = 1300;

    let isPinching = false;
    let previousHandY: number | null = null;

    function updateGesture(message: string) {
      if (message !== lastUiMessage) {
        lastUiMessage = message;
        setGesture(message);
      }
    }

    async function start() {
      try {
        setStatus("Waiting for camera permission...");

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

        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

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

        setStatus("Camera is active. Point your index finger up or down.");

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

            const landmarks = result.landmarks?.[0];

            if (!landmarks) {
              isPinching = false;
              previousHandY = null;

              updateGesture("Hand not detected — show your hand to the camera");
            } else {
              const pinchDistance = getPinchDistance(landmarks);
              const indexTip = landmarks[8];

              if (pinchDistance === null || !indexTip) {
                isPinching = false;
                previousHandY = null;
                updateGesture("Keep your thumb and index finger visible");
              } else {
                // شروع گرفتن صفحه
                if (!isPinching && pinchDistance < PINCH_START_DISTANCE) {
                  isPinching = true;

                  // فقط موقعیت شروع را ذخیره می‌کنیم؛
                  // در همان لحظه صفحه حرکت نمی‌کند.
                  previousHandY = indexTip.y;

                  updateGesture("Pinch active — move your hand up or down");
                }

                // رها کردن صفحه
                else if (isPinching && pinchDistance > PINCH_RELEASE_DISTANCE) {
                  isPinching = false;
                  previousHandY = null;

                  updateGesture("Pinch released — scrolling stopped");
                }

                // حرکت دست درحالی‌که انگشت‌ها به هم چسبیده‌اند
                else if (isPinching) {
                  if (previousHandY !== null) {
                    const deltaY = indexTip.y - previousHandY;

                    // حرکت خیلی کوچک نادیده گرفته می‌شود تا لرزش کمتر شود.
                    if (Math.abs(deltaY) > 0.0015) {
                      window.scrollBy({
                        top: deltaY * SCROLL_SENSITIVITY,
                        left: 0,
                        behavior: "auto",
                      });
                    }
                  }

                  previousHandY = indexTip.y;

                  updateGesture("Pinch active — move your hand up or down");
                } else {
                  updateGesture("Pinch your thumb and index finger to grab the page");
                }
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
            "Setup failed. Check camera permissions and MediaPipe files.",
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


return (
  <main className="app">
    <header className="page-header">
      <div className="header-copy">
        <p className="eyebrow">OPENAI · GPT-6 ASTRA</p>
        <h1>Intelligence for complex work.</h1>
        <p className="header-description">
          Meet GPT-6 Astra, OpenAI's flagship AI model for
          advanced reasoning, software engineering, computer
          use, and demanding professional tasks.
        </p>
        <p>
          <a
            href="https://openai.com/index/gpt-6-astra/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#d8ff67" }}
          >
            Explore the official announcement ↗
          </a>
        </p>
      </div>
    </header>

    <aside className="camera-widget" aria-label="Live camera controls">
      <div className="camera-heading">
        <span className="camera-live-dot" />
        <span>LIVE CAMERA</span>
      </div>

      <div className="camera-preview">
        <video ref={videoRef} autoPlay muted playsInline />
      </div>

      <p className="camera-status">{status}</p>
      <p className="gesture-reading">{gesture}</p>

      <div className="camera-hint">
        🤏 Pinch: Grab page
        <br />
        ↕️ Move hand: Scroll
        <br />
        ✋ Release: Stop
      </div>
    </aside>

    <section className="content-section section-one">
      <p className="section-number">01 — INTRODUCTION</p>
      <h2>A model built for demanding work.</h2>

      <p>
        GPT-6 Astra is an advanced AI model developed by OpenAI.
        According to OpenAI's official announcement, it combines
        research in pre-training, reinforcement learning, and
        alignment to support complex tasks that require reasoning
        and careful execution.
      </p>

      <p>
        Rather than focusing only on generating text, Astra is
        designed to help with multi-step work, from investigating
        information and writing software to interacting with
        computer interfaces.
      </p>

      <p>
        <strong>Important distinction:</strong> AI-generated
        answers can still contain errors. Important conclusions
        should be checked against reliable evidence.
      </p>
    </section>

    <section className="content-section section-two">
      <p className="section-number">02 — CORE CAPABILITIES</p>
      <h2>From reasoning to real-world workflows.</h2>

      <div className="feature-grid">
        <article className="feature-card">
          <span className="feature-number">01</span>
          <h3>Advanced Reasoning</h3>
          <p>
            Work through complex questions, evaluate alternatives,
            and organize information to support analytical tasks.
          </p>
        </article>

        <article className="feature-card">
          <span className="feature-number">02</span>
          <h3>Software Engineering</h3>
          <p>
            Assist with understanding code, investigating bugs,
            developing solutions, and working through software
            engineering tasks.
          </p>
        </article>

        <article className="feature-card">
          <span className="feature-number">03</span>
          <h3>Computer Use</h3>
          <p>
            With the appropriate tools and permissions, interact
            with computer interfaces and help carry out multi-step
            digital workflows.
          </p>
        </article>
      </div>

      <p>
        These capabilities are described in OpenAI's model
        documentation. Actual results depend on the task,
        available tools, permissions, and evaluation method.
      </p>

      <p>
        <a
          href="https://developers.openai.com/api/docs/models"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#d8ff67" }}
        >
          Read the official model documentation ↗
        </a>
      </p>
    </section>

    <section className="content-section section-three">
      <p className="section-number">03 — EVALUATION & EVIDENCE</p>
      <h2>How do we measure AI performance?</h2>

      <p>
        AI benchmarks evaluate specific abilities under defined
        conditions. They help researchers compare systems, but
        a benchmark score does not guarantee the same level of
        performance in every real-world situation.
      </p>

      <p>
        In its GPT-6 Astra announcement, OpenAI reported results
        including 98% on FrontierMath Tier 4, 99.9% on ARC-AGI-3,
        and 100% on ExploitBench. These are company-reported
        benchmark results, not universal measures of intelligence.
      </p>

      <p>
        To interpret such numbers responsibly, readers should
        consider the benchmark's design, evaluation conditions,
        scoring method, and limitations.
      </p>

      <div className="instruction-list">
        <div>
          <span>01</span>
          <p>
            <strong>Check the source</strong>
            <br />
            Prefer original technical documentation over
            unsourced summaries.
          </p>
        </div>

        <div>
          <span>02</span>
          <p>
            <strong>Understand the benchmark</strong>
            <br />
            A score only describes performance on a particular
            evaluation under specific conditions.
          </p>
        </div>

        <div>
          <span>03</span>
          <p>
            <strong>Verify real-world results</strong>
            <br />
            Test important outputs before relying on them.
          </p>
        </div>
      </div>

      <p>
        <a
          href="https://openai.com/index/gpt-6-astra/"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#d8ff67" }}
        >
          Source: OpenAI — GPT-6 Astra announcement ↗
        </a>
      </p>
    </section>

    <section className="content-section section-four">
      <p className="section-number">04 — SAFETY & RESPONSIBILITY</p>
      <h2>Capability must go hand in hand with safety.</h2>

      <p>
        More capable AI systems can provide substantial benefits,
        but they also introduce risks. Systems that can use
        software tools or interact with computers require careful
        permission management, monitoring, and evaluation.
      </p>

      <p>
        OpenAI describes its work on alignment and safeguards
        alongside the capabilities of GPT-6 Astra. Responsible
        deployment also requires clear limits on what a system
        can access and which actions it is allowed to perform.
      </p>

      <p>
        AI should support human judgment, not eliminate the need
        for oversight. For sensitive or high-impact decisions,
        outputs should be independently verified.
      </p>

      <p>
        <a
          href="https://openai.com/index/path-to-astra/"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#d8ff67" }}
        >
          Read OpenAI's safety and security assessment ↗
        </a>
      </p>
    </section>

    <section className="content-section">
      <p className="section-number">05 — INTERACTIVE DEMONSTRATION</p>
      <h2>Explore the page with a gesture.</h2>

      <p>
        This project demonstrates a different way to interact
        with a web page. MediaPipe detects hand landmarks through
        your camera, while a simple gesture rule identifies the
        direction of your index finger.
      </p>

      <p>
        Point your index finger upward to scroll toward the top,
        or downward to move through the content. The camera stays
        fixed in the corner while the page itself scrolls.
      </p>

      <p>
        This gesture interface is a separate demonstration; it
        does not use GPT-6 Astra to recognize your hand. Gesture
        recognition is handled locally in the browser by
        MediaPipe.
      </p>
    </section>

    <footer className="page-footer">
      <p>GPT-6 ASTRA · AI RESEARCH & TECHNOLOGY</p>
      <p>
        Exploring reasoning, computer use, and responsible AI.
      </p>
      <p>
        Sources:{" "}
        <a
          href="https://openai.com/index/gpt-6-astra/"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#d8ff67" }}
        >
          OpenAI announcement
        </a>
        {" · "}
        <a
          href="https://developers.openai.com/api/docs/models"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#d8ff67" }}
        >
          Model documentation
        </a>
        {" · "}
        <a
          href="https://openai.com/index/path-to-astra/"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#d8ff67" }}
        >
          Safety assessment
        </a>
      </p>
    </footer>
  </main>
);

}

export default App;