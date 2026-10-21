const carouselImages = Array.isArray(window.CAROUSEL_IMAGES) ? window.CAROUSEL_IMAGES : [];

const BUFFER_SLIDES = 2;
const PRELOAD_AHEAD_COUNT = 1;
const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";
const THUMBNAIL_TRANSFORMATION = "c_fill,w_480,h_280/f_auto/q_auto";

const rowConfigs = [
  {
    speed: 9,
    startRatio: 0,
    stepSeed: 7,
  },
  {
    speed: 11,
    startRatio: 1 / 5,
    stepSeed: 1,
  },
  {
    speed: 12,
    startRatio: 2 / 5,
    stepSeed: 5,
  },
  {
    speed: 10,
    startRatio: 3 / 5,
    stepSeed: 11,
  },
  {
    speed: 8,
    startRatio: 4 / 5,
    stepSeed: 17,
  },
];

const carousel = document.querySelector("#carousel");
const rowStates = [];
const preloadedUrls = new Set();

let slideWidth = 250;
let resizeFrameId = null;
let carouselIsVisible = true;

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    [x, y] = [y, x % y];
  }

  return x;
}

function findCoprimeStep(length, seed) {
  if (length <= 1) {
    return 1;
  }

  let step = Math.max(1, Math.floor(seed));

  while (gcd(step, length) !== 1) {
    step += 1;
  }

  return step;
}

function getCssNumber(variableName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName);

  return Number.parseFloat(value) || fallback;
}

function updateLayoutMetrics() {
  slideWidth = getCssNumber("--slide-width", 250);
}

function transformCloudinaryUrl(url, transformation) {
  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);

  if (markerIndex === -1) {
    return url;
  }

  const assetStart = markerIndex + CLOUDINARY_UPLOAD_MARKER.length;

  // Only insert transformations into original, versioned delivery URLs.
  if (!/^v\d+\//.test(url.slice(assetStart))) {
    return url;
  }

  return `${url.slice(0, assetStart)}${transformation}/${url.slice(assetStart)}`;
}

function getImageIndex(state, sequencePosition) {
  return (state.startIndex + sequencePosition * state.step) % carouselImages.length;
}

function getThumbnailUrl(imageIndex) {
  return transformCloudinaryUrl(carouselImages[imageIndex], THUMBNAIL_TRANSFORMATION);
}

function preloadImageByIndex(imageIndex) {
  const url = getThumbnailUrl(imageIndex);

  if (preloadedUrls.has(url)) {
    return;
  }

  const preloader = new Image();
  preloader.decoding = "async";
  preloader.src = url;

  preloadedUrls.add(url);
}

function preloadAhead(state, count = PRELOAD_AHEAD_COUNT) {
  for (let offset = 0; offset < count; offset += 1) {
    const imageIndex = getImageIndex(state, state.nextSequencePosition + offset);

    preloadImageByIndex(imageIndex);
  }
}

function setSlideImage(slide, imageIndex) {
  const image = slide.querySelector("img");
  image.src = getThumbnailUrl(imageIndex);
  image.alt = `Image ${imageIndex + 1}`;
  image.dataset.imageIndex = String(imageIndex);
}

function createSlide(imageIndex) {
  const slide = document.createElement("div");
  slide.className = "slide";

  const image = document.createElement("img");
  image.width = 240;
  image.height = 140;
  image.decoding = "async";
  image.loading = "eager";
  image.draggable = false;

  slide.appendChild(image);
  setSlideImage(slide, imageIndex);

  return slide;
}

function getRequiredSlideCount(row) {
  return Math.ceil(row.clientWidth / slideWidth) + BUFFER_SLIDES;
}

function getRowStepDuration(state) {
  return (slideWidth / state.speed) * 1000;
}

function appendNextSlide(state) {
  const imageIndex = getImageIndex(state, state.nextSequencePosition);

  state.track.appendChild(createSlide(imageIndex));
  state.nextSequencePosition += 1;
}

function fillTrack(state) {
  const requiredCount = getRequiredSlideCount(state.row);

  while (state.track.children.length < requiredCount) {
    appendNextSlide(state);
  }
}

function resizeTrack(state) {
  const requiredCount = getRequiredSlideCount(state.row);

  while (state.track.children.length > requiredCount) {
    state.track.lastElementChild.remove();
    state.nextSequencePosition -= 1;
  }

  fillTrack(state);
}

function recycleFirstSlide(state) {
  const firstSlide = state.track.firstElementChild;

  if (!firstSlide) {
    return;
  }

  const nextImageIndex = getImageIndex(state, state.nextSequencePosition);

  setSlideImage(firstSlide, nextImageIndex);
  state.nextSequencePosition += 1;
  state.track.appendChild(firstSlide);

  preloadAhead(state);
}

function startRowAnimation(state) {
  if (state.animation) {
    state.animation.cancel();
  }

  const animation = state.track.animate(
    [
      {
        transform: "translate3d(0, 0, 0)",
      },
      {
        transform: `translate3d(${-slideWidth}px, 0, 0)`,
      },
    ],
    {
      duration: getRowStepDuration(state),
      easing: "linear",
      fill: "forwards",
    },
  );

  state.animation = animation;

  animation.finished
    .then(() => {
      if (state.animation !== animation) {
        return;
      }

      animation.cancel();
      recycleFirstSlide(state);
      startRowAnimation(state);

      const shouldPause = document.hidden || !carouselIsVisible || state.isHovered;

      if (shouldPause) {
        state.animation.pause();
      }
    })
    .catch(() => {});
}

function createRowState(config) {
  const row = document.createElement("div");
  row.className = "carousel-row";

  const track = document.createElement("div");
  track.className = "slide-track";

  row.appendChild(track);
  carousel.appendChild(row);

  const state = {
    row,
    track,
    speed: config.speed,

    startIndex: Math.floor(carouselImages.length * config.startRatio),

    step: findCoprimeStep(carouselImages.length, config.stepSeed),

    nextSequencePosition: 0,
    animation: null,
    isHovered: false,
  };

  fillTrack(state);
  preloadAhead(state);
  startRowAnimation(state);

  row.addEventListener("mouseenter", () => {
    state.isHovered = true;
    state.animation?.pause();
  });

  row.addEventListener("mouseleave", () => {
    state.isHovered = false;
    applySystemPauseState();
  });

  return state;
}

function clearCarousel() {
  rowStates.forEach((state) => {
    state.animation?.cancel();
  });

  rowStates.length = 0;
  carousel.innerHTML = "";
}

function buildCarousel() {
  clearCarousel();

  if (!carousel) {
    console.error("Element not found #carousel.");
    return;
  }

  if (carouselImages.length === 0) {
    console.error("Array CAROUSEL_IMAGES is empty or file images.js not loaded.");
    return;
  }

  rowConfigs.forEach((config) => {
    rowStates.push(createRowState(config));
  });

  console.log("Images in rotation: ", carouselImages.length);
}

function applySystemPauseState() {
  if (!carousel) {
    return;
  }

  const shouldPause = document.hidden || !carouselIsVisible;

  carousel.classList.toggle("is-paused", shouldPause);

  rowStates.forEach((state) => {
    if (!state.animation) {
      return;
    }

    if (shouldPause || state.isHovered) {
      state.animation.pause();
    } else {
      state.animation.play();
    }
  });
}

function handleVisibilityChange() {
  applySystemPauseState();
}

function handleResize() {
  if (resizeFrameId !== null) {
    cancelAnimationFrame(resizeFrameId);
  }

  resizeFrameId = requestAnimationFrame(() => {
    const previousSlideWidth = slideWidth;
    updateLayoutMetrics();

    rowStates.forEach((state) => {
      resizeTrack(state);

      if (slideWidth !== previousSlideWidth) {
        const previousDuration = (previousSlideWidth / state.speed) * 1000;
        const progress = Math.min(1, (state.animation?.currentTime || 0) / previousDuration);

        startRowAnimation(state);
        state.animation.currentTime = progress * getRowStepDuration(state);
      }
    });

    updatePopupLayout();
    applySystemPauseState();
    resizeFrameId = null;
  });
}

const visibilityObserver = new IntersectionObserver(
  ([entry]) => {
    carouselIsVisible = entry.isIntersecting;
    applySystemPauseState();
  },
  {
    threshold: 0.01,
  },
);

updateLayoutMetrics();
buildCarousel();

if (carousel && rowStates.length > 0) {
  visibilityObserver.observe(carousel);
}

document.addEventListener("visibilitychange", handleVisibilityChange);

window.addEventListener("resize", handleResize, { passive: true });

applySystemPauseState();

// ====================================================================

let popupImage = null;
let popupDownloadLink = null;
let popupImageIndex = null;

function closePopupImage() {
  if (!popupImage) {
    return;
  }

  popupImage.style.opacity = "0";
  popupImage.style.transform = "translateY(20px) scale(0.9)";

  const imageToRemove = popupImage;
  popupImage = null;
  popupImageIndex = null;
  popupDownloadLink?.remove();
  popupDownloadLink = null;

  window.setTimeout(() => {
    imageToRemove.remove();
  }, 200);
}

function getPopupDimensions() {
  return window.matchMedia("(max-width: 600px)").matches
    ? { width: 640, height: 480 }
    : { width: 800, height: 600 };
}

function updatePopupLayout() {
  if (!popupImage || !carousel) {
    return;
  }

  const { width, height } = getPopupDimensions();
  const url = transformCloudinaryUrl(
    carouselImages[popupImageIndex],
    `c_fill,w_${width},h_${height}/f_auto/q_auto`,
  );

  if (popupImage.src !== url) {
    popupImage.src = url;
  }

  const scale = Math.min(
    1,
    (carousel.clientWidth - 20) / width,
    (carousel.clientHeight - 20) / height,
  );
  const targetWidth = width * scale;
  const targetHeight = height * scale;
  const targetLeft = (carousel.clientWidth - targetWidth) / 2;
  const targetTop = (carousel.clientHeight - targetHeight) / 2;

  popupImage.style.left = `${targetLeft}px`;
  popupImage.style.top = `${targetTop}px`;
  popupImage.style.width = `${targetWidth}px`;
  popupImage.style.height = `${targetHeight}px`;

  if (popupDownloadLink) {
    popupDownloadLink.style.left = `${targetLeft + targetWidth - 52}px`;
    popupDownloadLink.style.top = `${targetTop + 10}px`;
    popupDownloadLink.style.opacity = "1";
  }
}

function openPopupImage(sourceImage) {
  if (!carousel) {
    return;
  }

  const imageIndex = Number(sourceImage.dataset.imageIndex);

  if (!Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= carouselImages.length) {
    return;
  }

  if (popupImage) {
    closePopupImage();
  }

  const carouselRect = carousel.getBoundingClientRect();
  const imageRect = sourceImage.getBoundingClientRect();

  const startLeft = imageRect.left - carouselRect.left;
  const startTop = imageRect.top - carouselRect.top;

  const image = document.createElement("img");
  const { width, height } = getPopupDimensions();

  image.className = "carousel-popup-image";
  image.src = transformCloudinaryUrl(
    carouselImages[imageIndex],
    `c_fill,w_${width},h_${height}/f_auto/q_auto`,
  );
  image.alt = sourceImage.alt || "";

  image.style.left = `${startLeft}px`;
  image.style.top = `${startTop}px`;
  image.style.width = `${imageRect.width}px`;
  image.style.height = `${imageRect.height}px`;

  carousel.appendChild(image);
  popupImage = image;
  popupImageIndex = imageIndex;

  const downloadLink = document.createElement("a");
  const downloadIcon = document.createElement("span");

  downloadLink.className = "carousel-popup-download";
  downloadLink.href = transformCloudinaryUrl(carouselImages[imageIndex], "fl_attachment");
  downloadLink.setAttribute("aria-label", "Download original image");
  downloadLink.title = "Download original image";
  downloadIcon.className = "carousel-popup-download-icon";
  downloadIcon.setAttribute("aria-hidden", "true");
  downloadLink.appendChild(downloadIcon);

  carousel.appendChild(downloadLink);
  popupDownloadLink = downloadLink;

  requestAnimationFrame(() => {
    if (popupImage === image) {
      updatePopupLayout();
    }
  });

  image.addEventListener("click", closePopupImage, { once: true });
}

carousel?.addEventListener("click", (event) => {
  const clickedImage = event.target.closest(".slide img");

  if (!clickedImage) {
    return;
  }

  openPopupImage(clickedImage);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePopupImage();
  }
});
