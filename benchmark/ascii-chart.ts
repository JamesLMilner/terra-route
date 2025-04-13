type DataPoint = {
    label: string;
    value: number;
};

export function renderBarChart(data: DataPoint[]) {
    const maxLabelLength = Math.max(...data.map(d => d.label.length));
    const maxDuration = Math.max(...data.map(d => d.value));

    const chartWidth = 50; // characters wide for the longest bar

    console.log('');
    for (const point of data) {
        const barLength = Math.round((point.value / maxDuration) * chartWidth);
        const paddedLabel = point.label.padEnd(maxLabelLength, " ");
        const bar = "█".repeat(barLength);
        console.log(`${paddedLabel} | ${bar} ${point.value}ms`);
    }
    console.log('');
}

// // Example usage:
//  renderBarChart([
//     { label: "Operation A", durationMs: 120 },
//     { label: "Operation B", durationMs: 450 },
//     { label: "Operation C", durationMs: 300 },
// ]);