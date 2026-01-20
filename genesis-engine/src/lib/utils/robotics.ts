// Copied and adapted from the Google Robotics Demo

export function parseRoboticsOutput(box2d: [number, number, number, number]) {
    // Gemini returns [ymin, xmin, ymax, xmax] in 0-1000 scale
    const [ymin, xmin, ymax, xmax] = box2d;

    return {
        // Convert to 0.0 - 1.0 float
        x: xmin / 1000,
        y: ymin / 1000,
        width: (xmax - xmin) / 1000,
        height: (ymax - ymin) / 1000,
        // Calculate Center Point for the Physics Vector
        centerX: (xmin + xmax) / 2000,
        centerY: (ymin + ymax) / 2000
    };
}

// THE ROBOTICS SWITCH
// Use the expensive model for Paid users, standard for Free.
export const ROBOTICS_MODEL = process.env.NEXT_PUBLIC_MODE === 'premium'
    ? 'gemini-robotics-er-1.5-preview' // The "Hidden Gem"
    : 'gemini-2.5-flash'; // The R0 Workhorse
