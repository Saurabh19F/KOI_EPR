import styles from "./login.module.css";

// Lightweight vector artwork keeps every vehicle independently animated and sharp.
export function LogisticsScene() {
  return (
    <svg
      className={styles.scene}
      viewBox="45 0 735 520"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="hub-sun">
          <stop stopColor="#ffe995" />
          <stop offset="1" stopColor="#ffbc39" />
        </radialGradient>
        <clipPath id="hub-rain-area">
          <rect x="632" y="153" width="134" height="81" />
        </clipPath>
        <g id="hub-tree">
          <ellipse cy="2" rx="12" ry="5" fill="#4c9860" opacity=".15" />
          <path d="M0 0V-22" stroke="#ae8452" strokeWidth="3" />
          <ellipse cx="-6" cy="-23" rx="10" ry="12" fill="#6bc77a" />
          <ellipse cx="5" cy="-27" rx="11" ry="14" fill="#43ae70" />
          <ellipse cx="1" cy="-32" rx="8" ry="10" fill="#8bd58a" />
        </g>
        <g id="hub-cloud">
          <path
            d="M-43 10C-60 10-57-10-41-12C-44-32-11-41 1-23C16-39 43-24 38-9C61-8 62 13 42 14Z"
            fill="white"
            stroke="#d6e7f0"
          />
          <path
            d="M-43 10C-16 16 18 17 42 14"
            stroke="#e2eef5"
            strokeWidth="3"
          />
        </g>
        <linearGradient
          id="hub-land"
          x1="200"
          y1="150"
          x2="550"
          y2="420"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#daf2bf" />
          <stop offset="1" stopColor="#b2dfba" />
        </linearGradient>
        <linearGradient
          id="hub-water"
          x1="480"
          y1="320"
          x2="740"
          y2="510"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8ae4ef" stopOpacity=".8" />
          <stop offset="1" stopColor="#c8f2fa" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="hub-roof"
          x1="0"
          y1="-40"
          x2="150"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a59afa" />
          <stop offset="1" stopColor="#7772e2" />
        </linearGradient>
        <pattern
          id="hub-grid"
          width="54"
          height="30"
          patternUnits="userSpaceOnUse"
          patternTransform="matrix(1 .5 -1 .5 390 -130)"
        >
          <path d="M54 0H0V30" stroke="#71adc1" strokeOpacity=".14" />
        </pattern>
        <g id="hub-container">
          <path d="M0 0L25-13 70 10 45 23Z" fill="currentColor" />
          <path d="M0 0V21L45 44V23Z" fill="currentColor" />
          <path d="M0 0V21L45 44V23Z" fill="#17365a" opacity=".12" />
          <path d="M45 23L70 10V31L45 44Z" fill="currentColor" />
          <path d="M45 23L70 10V31L45 44Z" fill="#17365a" opacity=".28" />
          <path
            d="M6 5V22M13 8V26M20 12V30M27 15V33M34 19V37M41 22V40"
            stroke="white"
            strokeOpacity=".45"
          />
        </g>
        <g id="hub-truck">
          <ellipse cx="4" cy="17" rx="39" ry="9" fill="#17364b" opacity=".12" />
          <path d="M-34-7L-20-15 16 3 2 11Z" fill="currentColor" />
          <path d="M-34-7V8L2 26V11Z" fill="currentColor" />
          <path d="M2 11L16 3V18L2 26Z" fill="currentColor" />
          <path d="M2 11L16 3V18L2 26Z" fill="#16375d" opacity=".25" />
          <path
            d="M-28-2V9M-22 1V12M-16 4V15M-10 7V18M-4 10V21"
            stroke="#fff"
            opacity=".45"
          />
          <path d="M16 5L27 10 36 24 23 31 10 24V13Z" fill="#178ed2" />
          <path d="M16 5L27 10 20 14 10 9Z" fill="#95ddf6" />
          <path d="M27 12L32 22 23 26 22 16Z" fill="#163653" />
          <path d="M23 31L36 24V29L23 36 10 29V24Z" fill="#17639a" />
          {[-23, -4, 17].map((x, i) => (
            <ellipse
              key={x}
              cx={x}
              cy={[16, 26, 32][i]}
              rx="4"
              ry="5"
              fill="#173248"
            />
          ))}
          <path d="M30 29L34 27" stroke="#fff7cf" strokeWidth="3" />
        </g>
        <g id="hub-van">
          <ellipse cy="13" rx="23" ry="7" fill="#17364b" opacity=".12" />
          <path d="M-20-7L-7-14 15-3 22 10 8 18-20 4Z" fill="#b5ec6d" />
          <path d="M-20-7V4L8 18V5Z" fill="#78c744" />
          <path d="M8 5L15-3 22 10 8 18Z" fill="#439842" />
          <path d="M13 3L17 8 10 12V5Z" fill="#244958" />
          <ellipse cx="-13" cy="7" rx="3" ry="4" fill="#19334a" />
          <ellipse cx="4" cy="16" rx="3" ry="4" fill="#19334a" />
        </g>
        <g id="hub-pin">
          <ellipse cy="12" rx="19" ry="9" fill="currentColor" opacity=".1" />
          <ellipse
            cy="12"
            rx="12"
            ry="6"
            stroke="currentColor"
            strokeOpacity=".4"
          />
          <path
            d="M0 9S-12-6-12-14A12 12 0 0 1 12-14C12-6 0 9 0 9Z"
            fill="currentColor"
            stroke="white"
            strokeWidth="1.5"
          />
          <circle cy="-14" r="4" fill="white" />
        </g>
        <g id="hub-cargo-ship">
          <path
            d="M497 419L555 387 681 450 657 478 626 485 510 441Z"
            fill="currentColor"
            stroke="#486f88"
          />
          <path d="M497 419L555 387 681 450 636 471Z" fill="#2d9dbb" />
          <path d="M503 421L634 477 674 454" stroke="#ffd462" strokeWidth="3" />
          <g transform="translate(545 396) scale(.58)">
            <use href="#hub-container" color="#f7c244" />
            <use
              href="#hub-container"
              color="#8b85e7"
              transform="translate(55 28)"
            />
            <use
              href="#hub-container"
              color="#ed7fa1"
              transform="translate(110 56)"
            />
            <use
              href="#hub-container"
              color="#3db7cf"
              transform="translate(48 0)"
            />
          </g>
          <path d="M511 415V388L533 376 554 387V415L534 428Z" fill="#fbfaf3" />
          <path d="M511 388L534 401 554 387M534 401V428" stroke="#c7e5ec" />
          <path d="M515 392L529 400V406L515 399Z" fill="#285772" />
          <path d="M535 390V370" stroke="#b3d8df" strokeWidth="2" />
        </g>
        <g id="hub-small-boat">
          <path
            d="M-45-11L-62-19M-42-3L-63-10"
            stroke="#7ad5e6"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".6"
          />
          <path
            d="M-30-7L-11-17 33 5 28 16 15 20-25 3Z"
            fill="currentColor"
            stroke="#528b9f"
            strokeWidth=".8"
          />
          <path d="M-30-7L-11-17 33 5 16 14Z" fill="#e9fbff" />
          <path
            d="M-21-12V-24L-9-30 3-24V-10L-9-4Z"
            fill="#fffdf4"
            stroke="#bddce4"
            strokeWidth=".7"
          />
          <path d="M-17-21L-7-16V-10L-17-15Z" fill="#2b6786" />
          <path d="M-6-27V-38" stroke="#85afc1" strokeWidth="1.4" />
          <path d="M-3-10L16 0 8 5-11-5Z" fill="currentColor" />
          <path d="M-25 2L14 21 27 15" stroke="#fff3bc" strokeWidth="1.5" />
        </g>
      </defs>
      <path d="M16 268L398 62 807 272 414 494Z" fill="url(#hub-grid)" />
      <path
        d="M205 405L470 360 691 279 805 353 775 520 255 516Z"
        fill="url(#hub-water)"
      />
      <g transform="translate(117 57)">
        <circle
          className={styles.sunGlow}
          r="37"
          fill="#ffcc55"
          opacity=".13"
        />
        <g
          className={styles.sunRays}
          stroke="#f6bb42"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <path
              key={index}
              d="M0-29V-35"
              transform={`rotate(${index * 30})`}
            />
          ))}
        </g>
        <circle r="22" fill="url(#hub-sun)" />
      </g>
      <g className={styles.clouds} opacity=".92">
        <use href="#hub-cloud" transform="translate(223 77) scale(.65)" />
        <use href="#hub-cloud" transform="translate(537 40) scale(.5)" />
      </g>
      <g className={styles.birdFlock}>
        {[
          [305, 34, 1],
          [333, 46, 0.75],
          [360, 28, 0.85],
          [568, 92, 0.7],
        ].map(([x, y, scale], index) => (
          <g key={index} transform={`translate(${x} ${y}) scale(${scale})`}>
            <path
              className={styles.birdWings}
              style={{ animationDelay: `${-index * 0.23}s` }}
              d="M-10 0Q-5-9 0 0Q5-9 10 0"
              stroke="#5a83a2"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
      <g aria-label="Localized rain shower">
        <g clipPath="url(#hub-rain-area)">
          {Array.from({ length: 18 }, (_, index) => (
            <path
              key={index}
              className={styles.rainDrop}
              style={{
                animationDelay: `${-index * 0.13}s`,
                animationDuration: `${1 + (index % 3) * 0.2}s`,
              }}
              d={`M${646 + (index % 6) * 19} ${162 + Math.floor(index / 6) * 23}l-4 10`}
              stroke="#69acd5"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity=".65"
            />
          ))}
        </g>
        <path
          d="M646 153C630 151 630 133 646 130C643 111 672 101 685 118C703 100 727 116 723 130C749 127 757 151 735 156Z"
          fill="#c1d8e9"
          stroke="#a4c3dc"
        />
        <path
          d="M652 133Q665 127 678 131M705 129Q716 126 726 133"
          stroke="#d9e9f3"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <path
        d="M91 258L225 183 304 196 389 139 472 173 480 211 600 228 698 286 644 319 564 317 490 371 367 356 292 400 203 351 212 314Z"
        fill="#99d0c7"
        stroke="#77acae"
      />
      <path
        d="M91 248L225 173 304 186 389 129 472 163 480 201 600 218 698 276 644 309 564 307 490 361 367 346 292 390 203 341 212 304Z"
        fill="url(#hub-land)"
        stroke="#83b9bb"
      />
      <path
        d="M211 316L270 345 291 357 266 375 217 349Z"
        fill="#90ce8b"
        opacity=".65"
      />
      <path
        d="M465 179L541 217 506 229 464 207Z"
        fill="#8ac68c"
        opacity=".55"
      />
      <path
        d="M224 334l3-7 4 8M279 366l3-6 3 7M486 199l2-6 4 7"
        stroke="#5faa72"
        strokeWidth="1.4"
      />
      <path
        d="M121 252L292 337 438 253 602 337M219 191L510 336M311 198L567 329M350 163L612 294M229 306L435 189M302 342L514 223M384 346L572 247"
        stroke="#83b3b8"
        strokeOpacity=".45"
      />
      <path
        d="M129 253L293 335 469 239 625 316"
        stroke="#97becb"
        strokeWidth="27"
        strokeLinejoin="round"
      />
      <path
        d="M129 253L293 335 469 239 625 316"
        stroke="#f2fbff"
        strokeWidth="23"
        strokeLinejoin="round"
      />
      <path
        d="M129 253L293 335 469 239 625 316"
        stroke="#8bb7c9"
        strokeDasharray="8 9"
      />
      <path d="M237 190L531 337" stroke="#9dbdc9" strokeWidth="20" />
      <path d="M237 190L531 337" stroke="#f3fbff" strokeWidth="17" />
      <path d="M237 190L531 337" stroke="#85aabd" strokeDasharray="7 8" />
      <path
        d="M131 239L292 320 469 224 636 306"
        stroke="#40c8ce"
        strokeOpacity=".4"
        strokeWidth="2"
      />
      <path
        className={styles.routeFlow}
        d="M131 239L292 320 469 224 636 306"
        stroke="#08b4c7"
        strokeWidth="2.5"
        strokeDasharray="24 70"
      />
      {[0, 1, 2].map((index) => (
        <g
          key={`van-${index}`}
          className={styles.deliveryVan}
          style={{ animationDelay: `${-index * 2.3 - 1}s` }}
        >
          <use href="#hub-van" transform="scale(.72)" />
        </g>
      ))}
      <g transform="translate(315 184)">
        <path d="M0 0L76-39 155 1 79 42Z" fill="#7576d9" />
        <path d="M0 0V48L79 88V42Z" fill="#279fb9" />
        <path d="M79 42L155 1V50L79 88Z" fill="#167f9f" />
        <path d="M7-4L77-40 148-4 78 33Z" fill="url(#hub-roof)" />
        <path
          d="M18-7L78-37 135-8M33 1L91-29M50 9L109-20M68 18L126-12"
          stroke="#d3ceff"
          strokeWidth="2"
        />
        <path
          d="M90 48L108 38V71L90 81ZM118 33L137 23V56L118 66Z"
          fill="#14617f"
          stroke="#69c8db"
        />
        <path
          d="M91 51L106 43M91 57L106 49M91 63L106 55M119 38L135 29M119 44L135 35M119 50L135 41"
          stroke="#4dabc2"
        />
        <path d="M8 19L65 48V56L8 27Z" fill="#ffda67" />
        <text
          x="12"
          y="39"
          fill="white"
          fontSize="12"
          fontWeight="700"
          transform="skewY(27)"
        >
          KOI
        </text>
      </g>
      <use href="#hub-tree" transform="translate(240 343) scale(.65)" />
      <use href="#hub-tree" transform="translate(265 359) scale(.55)" />
      <use href="#hub-tree" transform="translate(493 209) scale(.55)" />
      <g transform="translate(201 229) scale(.7)">
        <use href="#hub-container" color="#f5a04c" />
        <use
          href="#hub-container"
          color="#2cbca6"
          transform="translate(-32 20)"
        />
        <use
          href="#hub-container"
          color="#8481ef"
          transform="translate(-5 -24)"
        />
      </g>
      <g transform="translate(517 267) scale(.62)">
        <use href="#hub-container" color="#ee7f9c" />
        <use
          href="#hub-container"
          color="#f2c449"
          transform="translate(50 26)"
        />
        <use
          href="#hub-container"
          color="#4da9e7"
          transform="translate(0 -23)"
        />
      </g>
      {["#ffb34e", "#ee859b", "#46c9b0"].map((color, index) => (
        <g
          key={color}
          className={styles.truckOne}
          style={{ animationDelay: `${-index * 2.7 - 0.8}s` }}
        >
          <use href="#hub-truck" color={color} transform="scale(.68)" />
        </g>
      ))}
      {["#a48aee", "#56b7e5", "#f7ca51"].map((color, index) => (
        <g
          key={color}
          className={styles.truckTwo}
          style={{ animationDelay: `${-index * 3.3 - 1.4}s` }}
        >
          <use href="#hub-truck" color={color} transform="scale(-.6 .6)" />
        </g>
      ))}
      <path
        d="M470 373L649 281 726 320 547 417Z"
        fill="#62cddd"
        stroke="#47acc4"
      />
      <path d="M547 417V428L726 332V320" fill="#289dbb" />
      <g transform="translate(609 332) scale(.65)">
        <use href="#hub-container" color="#a18bea" />
        <use
          href="#hub-container"
          color="#f7a254"
          transform="translate(-40 23)"
        />
        <use
          href="#hub-container"
          color="#29bfa6"
          transform="translate(-40 0)"
        />
      </g>
      <g stroke="#eeaf2b" strokeWidth="5">
        <path d="M676 340V229L628 204V302M626 206L699 168 746 192 675 230M699 169V227" />
        <path d="M700 202V282" strokeWidth="1" />
      </g>
      <path
        className={styles.water}
        d="M489 433L631 504M522 425L669 497M558 423L701 495"
        stroke="#48c5db"
        strokeOpacity=".35"
        strokeDasharray="24 18"
      />
      <g className={styles.ship}>
        <use href="#hub-cargo-ship" color="#f27754" />
      </g>
      <g transform="translate(80 220) scale(.56)">
        <g className={styles.feederShip}>
          <use href="#hub-cargo-ship" color="#7283df" />
        </g>
      </g>
      <g transform="translate(292 442)">
        <g className={styles.harborBoat}>
          <use href="#hub-small-boat" color="#f8bd44" />
        </g>
      </g>
      <g transform="translate(718 432) scale(.85)">
        <g className={styles.harborBoatReturn}>
          <use href="#hub-small-boat" color="#1bb8a6" />
        </g>
      </g>
      <path
        d="M155 201C160 21 560-7 664 195"
        stroke="#ac93e2"
        strokeOpacity=".45"
        strokeDasharray="3 7"
      />
      <path
        className={styles.routeFlow}
        d="M155 201C160 21 560-7 664 195"
        stroke="#9673e4"
        strokeWidth="2.5"
        strokeDasharray="35 140"
      />
      {["#f69550", "#579ee5"].map((color, index) => (
        <g
          key={color}
          className={styles.plane}
          style={{ animationDelay: `${-index * 7 - 3}s` }}
        >
          <path
            d="M-33 0L-8-5 5-30 13-32 7-5 31-1Q42 3 31 7L7 8 13 31 5 29-8 9-29 5-38 13-42 11-37 2-42-8-38-10Z"
            fill={color}
            stroke="#dc793c"
            strokeWidth=".7"
          />
          <path d="M-27 2L27 3" stroke="#ffe6b8" />
          <path d="M-7-5L4-25M-7 9L4 24" stroke="#ffc778" strokeWidth="2" />
        </g>
      ))}
      {[
        [151, 238, "#f7855c"],
        [473, 204, "#9a77e6"],
        [638, 302, "#16b4af"],
      ].map(([x, y, color]) => (
        <g
          key={String(color)}
          transform={`translate(${x} ${y})`}
          color={String(color)}
        >
          <use href="#hub-pin" />
          <ellipse
            className={styles.beacon}
            cy="12"
            rx="22"
            ry="11"
            stroke="currentColor"
          />
        </g>
      ))}
      <g fontFamily="inherit" fontSize="9" letterSpacing="2" fill="#578098">
        <text x="105" y="286">
          ORIGIN
        </text>
        <text x="359" y="136">
          DISTRIBUTION HUB
        </text>
        <text x="680" y="376">
          SEAPORT
        </text>
      </g>
      <g className={styles.particles} fill="#61b8cd">
        <circle cx="121" cy="132" r="1.5" />
        <circle cx="730" cy="250" r="2" />
        <circle cx="322" cy="70" r="1" />
        <circle cx="454" cy="422" r="1.5" />
      </g>
    </svg>
  );
}
