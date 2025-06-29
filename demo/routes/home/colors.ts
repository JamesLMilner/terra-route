
export function getColorBlindSafeHex(): string {
    // Hues in degrees that are safer for colorblind users (approx. blues, oranges, purples, yellows)
    const safeHueRanges = [
        [30, 60],    // yellow-orange
        [190, 250],  // blue-turquoise
        [260, 290],  // purple
    ];

    // Pick a random range
    const [minHue, maxHue] = safeHueRanges[Math.floor(Math.random() * safeHueRanges.length)];
    const hue = Math.floor(Math.random() * (maxHue - minHue + 1)) + minHue;
    const saturation = 60 + Math.random() * 20; // 60–80% saturation
    const lightness = 50 + Math.random() * 10;  // 50–60% lightness

    return hslToHex(hue, saturation, lightness);
}

function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

    return `#${[f(0), f(8), f(4)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')}`;
}