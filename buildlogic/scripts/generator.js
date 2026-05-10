let randomSeed = 0;
function setSeed(seed) { randomSeed = seed; }
function random() {
    const x = Math.sin(randomSeed++) * 10000;
    return x - Math.floor(x);
}
const MATERIAL_ALPHABET = "0123456789abcdfghij";
function encodeMaterial(id) { return MATERIAL_ALPHABET[id]; }

const MATERIAL_IDS = { grass: 5, dirt: 16, water: 18, wood: 8, leaves: 9, stone: 13, snow: 7 };

const COLORS = {
    grassTop: [50, 205, 50], hillGrass: [70, 180, 70],
    stone: [150, 150, 150], snow: [255, 255, 255],
    water: [0, 120, 255], trunk: [139, 69, 19],
    leaves: [34, 139, 34], dirt: [101, 67, 33], default: [255, 255, 255]
};
const perm = new Uint8Array(512);
function initPerlin() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i & 255] = p[i & 255];
}

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }
function grad(hash, x, y) {
    const h = hash & 3;
    if (h === 0) return x + y;
    if (h === 1) return -x + y;
    if (h === 2) return x - y;
    return -x - y;
}
function perlin2(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = perm[X + perm[Y]], ab = perm[X + perm[Y + 1]],
          ba = perm[X + 1 + perm[Y]], bb = perm[X + 1 + perm[Y + 1]];
    return lerp(lerp(grad(aa, x, y), grad(ba, x - 1, y), u), lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u), v);
}
function isExposed(x, y, z, solid, w, h, d) {
    const ns = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    for (const [dx, dy, dz] of ns) {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (nx < 0 || ny < 0 || nz < 0 || nx >= w || ny >= h || nz >= d) return true;
        if (!solid[nx][ny][nz]) return true;
    }
    return false;
}
let currentSaveString = "";
function generateTerrain() {
    const seedVal = parseInt(document.getElementById("seedInput")?.value || 0);
    setSeed(seedVal);
    initPerlin();
    const w = Math.min(parseInt(document.getElementById("width").value), 256);
    const h = Math.min(parseInt(document.getElementById("height").value), 256);
    const d = Math.min(parseInt(document.getElementById("depth").value), 256);
    const useBeams = document.getElementById("beamToggle").checked;
    const isHollow = document.getElementById("hollowToggle").checked;
    const blockMap = {};
    const key = (x, y, z) => `${x},${y},${z}`;
    const solid = Array(w).fill(0).map(() => Array(h).fill(0).map(() => Array(d).fill(false)));
    const riverLevel = Math.floor(h * 0.15);
    for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
            const bNoise = (perlin2(x * 0.01, z * 0.01) + 1) / 2;
            const hNoise = (perlin2(x * 0.02, z * 0.02) + 1) / 2;
            const rivNoise = Math.abs(perlin2(x * 0.015, z * 0.015));

            const hillFactor = Math.max(0, Math.min(1, (bNoise - 0.3) * 2));
            let th = Math.floor(h * 0.1) + Math.floor(hNoise * (hillFactor > 0.5 ? h * 0.4 : h * 0.06));

            const isRiver = rivNoise < 0.035;
            if (isRiver) th = Math.min(th, riverLevel - 1);

            for (let y = 0; y <= Math.max(th, riverLevel); y++) {
                if (y <= th) solid[x][y][z] = true;
                if (isHollow && y < th && !isExposed(x, y, z, solid, w, h, d)) continue;
                let color, mat;
                if (y > th && y <= riverLevel) {
                    color = COLORS.water; mat = encodeMaterial(MATERIAL_IDS.water);
                } else if (y === th) {
                    color = (y >= h * 0.7) ? COLORS.snow : (hillFactor > 0.5 ? COLORS.hillGrass : COLORS.grassTop);
                    mat = (y >= h * 0.7) ? encodeMaterial(MATERIAL_IDS.snow) : encodeMaterial(MATERIAL_IDS.grass);
                } else {
                    color = COLORS.dirt; mat = encodeMaterial(MATERIAL_IDS.dirt);
                }
                if (y <= th || y <= riverLevel) {
                    blockMap[key(x, y, z)] = { code: "G", x, y, z, color, material: mat, isTree: false };
                }
            }
        }
    }
    const numTrees = Math.floor((w * d) / 120);
    for (let i = 0; i < numTrees; i++) {
        const tx = Math.floor(random() * w), tz = Math.floor(random() * d);
        const ty = (solid[tx] && solid[tx][0]) ? findTop(tx, tz, solid) : -1;
        if (ty > riverLevel && ty < h - 6) {
            for (let j = 1; j <= 3; j++) {
                blockMap[key(tx, ty + j, tz)] = { code: "B", x: tx, y: ty + j, z: tz, color: COLORS.trunk, material: encodeMaterial(MATERIAL_IDS.wood), isTree: true };
            }
            for (let lx = -1; lx <= 1; lx++) {
                for (let lz = -1; lz <= 1; lz++) {
                    for (let ly = 4; ly <= 5; ly++) {
                        const nk = key(tx + lx, ty + ly, tz + lz);
                        if (!blockMap[nk]) blockMap[nk] = { code: "C", x: tx + lx, y: ty + ly, z: tz + lz, color: COLORS.leaves, material: encodeMaterial(MATERIAL_IDS.leaves), isTree: true };
                    }
                }
            }
        }
    }
    let finalBlocks = Object.values(blockMap);
    if (useBeams) {
        finalBlocks = applyBeams(finalBlocks, blockMap);
    }
    currentSaveString = finalBlocks.map(b => {
        if (b.beamLen) {
            return Encoder.encodeBeam(b.beamLen, b.x, b.y, b.z, b.color, b.material, b.dirName);
        }
        return Encoder.encodeBlock(b.code, b.x, b.y, b.z, b.color, b.material);
    }).join(";");

    document.getElementById("saveStringOutput").value = currentSaveString;
}

function findTop(x, z, solid) {
    for (let y = solid[0].length - 1; y >= 0; y--) {
        if (solid[x][y][z]) return y;
    }
    return -1;
}
function applyBeams(blocks, map) {
    const used = new Set();
    const result = [];
    const key = (x, y, z) => `${x},${y},${z}`;

    const dirs = [
        { dx: 1, dy: 0, dz: 0, name: "PLUS_X" },
        { dx: 0, dy: 1, dz: 0, name: "PLUS_Y" },
        { dx: 0, dy: 0, dz: 1, name: "PLUS_Z" }
    ];

    for (const b of blocks) {
        const k = key(b.x, b.y, b.z);
        if (used.has(k)) continue;
        if (b.isTree || b.material === encodeMaterial(MATERIAL_IDS.water)) {
            used.add(k);
            result.push(b);
            continue;
        }

        let bestLen = 1, bestDir = null;

        for (const d of dirs) {
            let len = 1;
            while (len < 8) {
                const nx = b.x + d.dx * len, ny = b.y + d.dy * len, nz = b.z + d.dz * len;
                const target = map[key(nx, ny, nz)];
                if (!target || used.has(key(nx, ny, nz)) || target.isTree || target.color.join() !== b.color.join()) break;
                len++;
            }
            if (len > bestLen) { bestLen = len; bestDir = d; }
        }

        if (bestLen >= 2) {
            for (let i = 0; i < bestLen; i++) {
                used.add(key(b.x + bestDir.dx * i, b.y + bestDir.dy * i, b.z + bestDir.dz * i));
            }
            b.beamLen = bestLen;
            b.dirName = bestDir.name;
            result.push(b);
        } else {
            used.add(k);
            result.push(b);
        }
    }
    return result;
}

function downloadSaveString() {
    if (!currentSaveString) return alert("Generate terrain first");
    const blob = new Blob([currentSaveString], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "terrain_export.txt";
    a.click();
}
