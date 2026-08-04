"use strict";
const week = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const clock = new Vue({
  el: "#dclock",
  data: {
    time: "",
    date: "",
  },
  mounted() {
    this.updateTime();
  },
  methods: {
    updateTime() {
      const currentDate = new Date();
      this.time = [
        this.zeroPadding(currentDate.getHours(), 2),
        this.zeroPadding(currentDate.getMinutes(), 2),
        // this.zeroPadding(currentDate.getSeconds(), 2),
      ].join(":");
      this.date =
        [
          this.zeroPadding(currentDate.getFullYear(), 4),
          this.zeroPadding(currentDate.getMonth() + 1, 2),
          this.zeroPadding(currentDate.getDate(), 2),
        ].join("-") +
        " " +
        week[currentDate.getDay()];
      const delay = 1000 - currentDate.getMilliseconds();
      window.setTimeout(() => this.updateTime(), delay);
    },
    zeroPadding(number, length) {
      return String(number).padStart(length, "0");
    },
  },
});

const smallClock = document.querySelector("#clock");
const bigClock = document.querySelector("#dclock");
const bigClockButton = document.querySelector("#bigClockButton");

if (smallClock && bigClock && bigClockButton) {
  bigClockButton.addEventListener("click", (event) => {
    event.preventDefault();

    const bigClockIsVisible = bigClock.classList.toggle("is-visible");

    smallClock.classList.toggle("is-hidden", bigClockIsVisible);

    bigClockButton.textContent = bigClockIsVisible ? "SMALL CLOCK" : "BIG CLOCK";
  });
}
