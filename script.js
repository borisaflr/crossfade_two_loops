// Get video elements and button
const idleVideo = document.getElementById("idleVideo");
const responseVideo = document.getElementById("responseVideo");
const sendMessageBtn = document.getElementById("sendMessageBtn");

// Configuration
const SYNTHESIS_DELAY = 1000; // 1 second delay
const CROSSFADE_DURATION = 300; // 300ms (in milliseconds)
const CROSSFADE_START_BEFORE_END = 600; // Start crossfade this many ms before response video ends (CROSSFADE_DURATION * 2 to ensure completion)

// State management
let isProcessing = false;
let hasTriggeredIdleCrossfade = false;

// Initialize
function init() {
  // Set CSS transition duration dynamically
  const transitionDuration = `${CROSSFADE_DURATION / 1000}s`;
  idleVideo.style.transitionDuration = transitionDuration;
  responseVideo.style.transitionDuration = transitionDuration;

  // Ensure idle video plays on load
  idleVideo.play().catch((err) => {
    console.error("Error playing idle video:", err);
  });

  // Set up event listeners
  sendMessageBtn.addEventListener("click", handleSendMessage);
  responseVideo.addEventListener("timeupdate", handleResponseTimeUpdate);
}

// Handle send message button click
async function handleSendMessage() {
  if (isProcessing) return;

  isProcessing = true;
  hasTriggeredIdleCrossfade = false;
  sendMessageBtn.disabled = true;

  // Simulate synthesis delay while idle video continues
  await new Promise((resolve) => setTimeout(resolve, SYNTHESIS_DELAY));

  // Load and prepare response video
  await loadResponseVideo();

  // Start crossfade from idle to response
  crossfadeToResponse();
}

// Load response video
function loadResponseVideo() {
  return new Promise((resolve, reject) => {
    // Reset response video to beginning
    responseVideo.currentTime = 0;

    // Check if video is already loaded
    if (responseVideo.readyState >= 3) {
      resolve();
      return;
    }

    // Wait for video to be ready
    const onCanPlay = () => {
      responseVideo.removeEventListener("canplay", onCanPlay);
      responseVideo.removeEventListener("error", onError);
      resolve();
    };

    const onError = (err) => {
      responseVideo.removeEventListener("canplay", onCanPlay);
      responseVideo.removeEventListener("error", onError);
      reject(err);
    };

    responseVideo.addEventListener("canplay", onCanPlay);
    responseVideo.addEventListener("error", onError);

    // Force load
    responseVideo.load();
  });
}

// Crossfade from idle to response video
function crossfadeToResponse() {
  // Idle video stays at 100% opacity (remains active)
  // Start response video playback and fade it in over the idle video
  responseVideo.play().catch((err) => {
    console.error("Error playing response video:", err);
  });

  // Trigger fade in of response video (it will appear on top of idle)
  responseVideo.classList.add("fading-in");

  // After transition completes, clean up idle video state
  setTimeout(() => {
    idleVideo.classList.remove("active");
  }, CROSSFADE_DURATION);
}

// Handle response video time update
function handleResponseTimeUpdate() {
  // Check if we're approaching the end of the response video
  const timeRemaining =
    (responseVideo.duration - responseVideo.currentTime) * 1000; // Convert to ms

  // Start crossfade when we're CROSSFADE_START_BEFORE_END milliseconds before the end
  // Only trigger once per response cycle
  if (
    timeRemaining <= CROSSFADE_START_BEFORE_END &&
    timeRemaining > 0 &&
    isProcessing &&
    !hasTriggeredIdleCrossfade
  ) {
    hasTriggeredIdleCrossfade = true;
    crossfadeToIdle();
  }
}

// Crossfade from response to idle video
function crossfadeToIdle() {
  // Set idle video to random position for variety
  const randomTime = Math.random() * idleVideo.duration;
  idleVideo.currentTime = randomTime;

  // Response video stays at 100% opacity (remains as fading-in)
  // Start idle video and fade it in over the response video
  idleVideo.play().catch((err) => {
    console.error("Error playing idle video:", err);
  });

  // Trigger fade in of idle video (it will appear on top of response)
  idleVideo.classList.add("fading-in");

  // Wait for crossfade to complete before cleaning up and re-enabling button
  setTimeout(() => {
    // Clean up: response video goes back to hidden, idle becomes active
    responseVideo.classList.remove("fading-in");
    idleVideo.classList.remove("fading-in");
    idleVideo.classList.add("active");

    isProcessing = false;
    sendMessageBtn.disabled = false;
  }, CROSSFADE_DURATION);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
