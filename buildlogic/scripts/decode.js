const decoderform = document.getElementById('decoderform');
const output = document.getElementById('output');
const validTypes = ["speaker", "keypad", "legacykeypad"]

const base71 = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "!", "@", "$", "%", "?", "&", "<", "(", ")"];
let curVal = "";
let curIndex = 0;

function decodeBase71(value = "") {
  let out = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[value.length - 1 - i];
    const charValue = base71.indexOf(char);
    out += charValue * Math.pow(71, i);
  }
  return out;
}
function decodeNextChunk() {
  const lengthChar = curVal[curIndex];
  const length = base71.indexOf(lengthChar) + 1;
  curIndex += 1;
  const chunk = curVal.slice(curIndex, curIndex + length);
  curIndex += length;
  return chunk;
}
function decodeValue(value) {
  curVal = value || "";
  curIndex = 0;
  let out = [];

  while (curIndex < curVal.length) {
    const chunk = decodeNextChunk();
    out.push(chunk);
  };
  return out;
}

decoderform.addEventListener('submit', function (e) {
  e.preventDefault();
  const type = document.getElementById('blockType').value;
  const value = document.getElementById('blockValue').value;
  if (!validTypes.includes(type)) {
    output.textContent = "what";
    return;
  }

  const decodedValue = decodeValue(value);
  const result = {};
  result["Your Input"] = value
  if (type === "speaker") {
    result["Looped"] = decodedValue[0] == 1 ? "ON" : "OFF";
    result["Sound Id"] = decodeBase71(decodedValue[1]);
    result["Volume"] = decodedValue[2];
    result["Pitch"] = decodedValue[3];
  } else if (type === "keypad") {
    result["Unlock On Enter"] = decodedValue[0] == 1 ? "ON" : "OFF";
    result["Unlocked Time"] = decodedValue[1];
    const codeDigits = decodedValue[2] || "";
    const splitCodeDigits = codeDigits.split(":")
    const decodedCodeDigits = [];
    for (let i = 0; i < splitCodeDigits.length; i++) {
      const decodedVal = String(decodeBase71(splitCodeDigits[i]));
      decodedCodeDigits.push(decodedVal.substring(1, decodedVal.length));
    }
    const finalCodeDigits = decodedCodeDigits.join("");
    result["Code Digits"] = finalCodeDigits;
    result["Show Key Press"] = decodedValue[3] == 1 ? "ON" : "OFF";
    result["Button Hold Time"] = decodedValue[4];
  } else if (type === "legacykeypad") {
    result["Unlock On Enter"] = decodedValue[0] == 1 ? "ON" : "OFF";
    result["Unlocked Time"] = decodedValue[1];
    result["Code Digits"] = decodedValue[2];
    result["Show Key Press"] = decodedValue[3] == 1 ? "ON" : "OFF";
    result["Button Hold Time"] = decodedValue[4];
  }

  const resultFinal = Object.entries(result).map(([key, val]) => `${key.padEnd(24, ' ')}: ${val}`).join('\n');
  output.textContent = resultFinal;
});
