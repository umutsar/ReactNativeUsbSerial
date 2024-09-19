const data = "0BFF16FF21";

// Ayırma ve decimal'e çevirme işlemi
const modifiedData = data.split("FF").filter(part => part.length > 0).map(part => parseInt(part, 16));

console.log(modifiedData);  // Çıktı: [ 11, 22, 33 ]