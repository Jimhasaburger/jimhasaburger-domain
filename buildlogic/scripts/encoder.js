const Encoder = (() => {
  const POS_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$";
  const DEFAULT_ROT = "A";
  const GRID_SIZE = 256;
  const BEAM_IDS = {
    2: "\x02", 3: "\x03", 4: "#b", 
    5: "\x04", 6: "\x05", 7: "#c", 8: "\x06"
  };
  const DIR_TO_ROT = {
    "PLUS_X":  "E",
    "MINUS_X": "M",
    "PLUS_Y":  "B",
    "MINUS_Y": "D",
    "PLUS_Z":  "A",
    "MINUS_Z": "o"
  };
  function encodeIndex(x, y, z) {
    const i = x + (y * GRID_SIZE) + (z * GRID_SIZE * GRID_SIZE);
    return POS_ALPHABET[(i >> 0) & 63] + 
           POS_ALPHABET[(i >> 6) & 63] + 
           POS_ALPHABET[(i >> 12) & 63] + 
           POS_ALPHABET[(i >> 18) & 63];
  }
  function encodeColor(r, g, b) {
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    const i = r + (g * 256) + (b * 256 * 256);
    return POS_ALPHABET[(i >> 0) & 63] + 
           POS_ALPHABET[(i >> 6) & 63] + 
           POS_ALPHABET[(i >> 12) & 63] + 
           POS_ALPHABET[(i >> 18) & 63];
  }
  function encodeBlock(code, x, y, z, color, material = "", rotation = DEFAULT_ROT) {
    const pos = encodeIndex(x, y, z);
    const col = encodeColor(...color);
    return code + pos + rotation + col + material;
  }
  function encodeBeam(length, x, y, z, color, material = "", dirName = "PLUS_X") {
    const beamID = BEAM_IDS[length] || "#b";
    const rotation = DIR_TO_ROT[dirName] || DEFAULT_ROT;
    return encodeBlock(beamID, x, y, z, color, material, rotation);
  }
  return {
    encodeIndex,
    encodeColor,
    encodeBlock,
    encodeBeam,
    getRotationFromDir: (dir) => DIR_TO_ROT[dir] || DEFAULT_ROT,
    DIR_TO_ROT
  };
})();
