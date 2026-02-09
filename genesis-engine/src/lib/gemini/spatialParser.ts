/**
 * EXACT LOGIC EXTRACTED FROM GOOGLE "ROBOTICS SPATIAL UNDERSTANDING" DEMO
 * 
 * Rules:
 * 1. Gemini coordinate system is always 0 to 1000.
 * 2. 2D Boxes are [ymin, xmin, ymax, xmax].
 * 3. Points are [y, x].
 * 4. 3D Boxes are [cx, cy, cz, w, h, d, r, p, y].
 */

// 1. PARSE 2D BOUNDING BOXES
// Use this for: "Where is the bridge in this photo?"
export function parseBoundingBoxes2D(parsedResponse: any[]) {
  return parsedResponse.map(
    (box: { box_2d: [number, number, number, number]; label: string }) => {
      // Source Logic: Destructure [ymin, xmin, ymax, xmax]
      const [ymin, xmin, ymax, xmax] = box.box_2d;

      return {
        // Source Logic: Divide by 1000 to normalize to 0-1 range
        x: xmin / 1000,           
        y: ymin / 1000,           
        width: (xmax - xmin) / 1000, 
        height: (ymax - ymin) / 1000, 
        label: box.label,
      };
    }
  );
}

// 2. PARSE POINTS
// Use this for: "Tap the fulcrum" or "Click the load"
export function parsePoints(parsedResponse: any[]) {
  return parsedResponse.map(
    (point: { point: [number, number]; label: string }) => {
      return {
        point: {
          // Source Logic: Array index 1 is X, index 0 is Y. Flip them.
          x: point.point[1] / 1000, 
          y: point.point[0] / 1000, 
        },
        label: point.label,
      };
    }
  );
}

// 3. PARSE 3D BOUNDING BOXES (The "Hidden Gem" Logic)
// Use this for: Spawning 3D objects (Cubes) into the simulation matching real photos.
export function parseBoundingBoxes3D(parsedResponse: any[]) {
  return parsedResponse.map(
    (box: { 
      box_3d: [number, number, number, number, number, number, number, number, number]; 
      label: string; 
    }) => {
      // Source Logic: 9-element array extraction
      const center = box.box_3d.slice(0, 3); // [x, y, z]
      const size = box.box_3d.slice(3, 6);   // [width, height, depth]
      
      // Convert Degrees to Radians for Three.js
      const rpy = box.box_3d
        .slice(6)
        .map((x: number) => (x * Math.PI) / 180); 

      return { 
        center, // Note: These are likely still in 1000 scale, need /1000 normalization in app
        size, 
        rotation: rpy, // [roll, pitch, yaw] in Radians
        label: box.label 
      };
    }
  );
}