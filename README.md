# Smooth Images Carousel

A full-screen animated image carousel with two clock modes, responsive styling, and a game with selectable quality.

## Live Demo

[https://ou85.github.io/image-carousel-js](https://ou85.github.io/image-carousel-js/)

## Features

- Smooth animated image carousel
- Low-quality and high-quality ride modes
- Compact clock displayed over the carousel
- Large digital clock with a 16:9 layout
- One-click switching between small and large clocks
- Responsive design for desktop and smaller screens
- Neon text, shadows, and gradient effects
- Local image configuration through `images.js`

## Technologies

- HTML5
- CSS3
- JavaScript
- Vue.js 2
- Google Fonts:
  - Oxanium
  - Share Tech Mono

## Project Structure

```text
.
├── index.html
├── styles.css
├── carousel.css
├── images.js
├── carousel.js
├── clock.js
├── clock_digi.js
├── vue.min.js
├── favicon.svg
└── ride.html
```

## Running Locally

Clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

Start a local web server.

Using Python:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

A local web server is recommended because some browser features and asset paths may not work correctly when the page is opened directly through `file://`.

## Ride Modes

The footer contains links for selecting the carousel quality:

```text
LOW RIDE ::: BIG CLOCK ::: HIGH RIDE
```

- **LOW RIDE** opens the lighter carousel mode.
- **BIG CLOCK** switches between the compact clock and the large digital clock.
- **HIGH RIDE** opens the higher-quality carousel mode.

## Image Configuration

Edit `images.js` to add, remove, or reorder carousel images.

Example:

```js
const images = [
  "images/image-01.jpg",
  "images/image-02.jpg",
  "images/image-03.jpg"
];
```

## Customization

The large clock size is controlled in CSS:

```css
.big-clock {
  width: min(900px, calc(100vw - 48px));
  aspect-ratio: 16 / 9;
}
```

The time and date font sizes are controlled here:

```css
.big-clock .time {
  font-size: clamp(70px, 11vw, 155px);
}

.big-clock .date {
  font-size: clamp(18px, 2.5vw, 34px);
}
```

## License

This project is available for personal and educational use.
