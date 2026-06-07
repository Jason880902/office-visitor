// 生成tabBar占位图标脚本
// 运行: node generate-icons.js

const fs = require('fs');
const path = require('path');

// 1x1像素PNG的最小有效数据 (81x81 纯色方块)
// 这是一个最小的有效PNG文件
function createSimplePNG(r, g, b, size = 81) {
    // PNG签名
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(size, 0);  // width
    ihdrData.writeUInt32BE(size, 4);  // height
    ihdrData[8] = 8;   // bit depth
    ihdrData[9] = 2;   // color type (RGB)
    ihdrData[10] = 0;  // compression
    ihdrData[11] = 0;  // filter
    ihdrData[12] = 0;  // interlace

    const ihdrChunk = createChunk('IHDR', ihdrData);

    // IDAT chunk - 图像数据
    // 每行: filter byte(0) + RGB * width
    const rowSize = 1 + size * 3;
    const rawData = Buffer.alloc(rowSize * size);

    for (let y = 0; y < size; y++) {
        const offset = y * rowSize;
        rawData[offset] = 0; // filter: none
        for (let x = 0; x < size; x++) {
            const pixelOffset = offset + 1 + x * 3;
            rawData[pixelOffset] = r;
            rawData[pixelOffset + 1] = g;
            rawData[pixelOffset + 2] = b;
        }
    }

    // 使用zlib压缩
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(rawData);
    const idatChunk = createChunk('IDAT', compressed);

    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);

    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);

    return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
}

const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[i] = c;
}

// 生成图标
const iconDir = path.join(__dirname, 'miniprogram/images/tab');

const icons = [
    { name: 'home.png', color: [153, 153, 153] },           // 灰色
    { name: 'home-active.png', color: [24, 144, 255] },     // 蓝色
    { name: 'visitor.png', color: [153, 153, 153] },
    { name: 'visitor-active.png', color: [24, 144, 255] },
    { name: 'my.png', color: [153, 153, 153] },
    { name: 'my-active.png', color: [24, 144, 255] }
];

icons.forEach(icon => {
    const png = createSimplePNG(...icon.color);
    const filePath = path.join(iconDir, icon.name);
    fs.writeFileSync(filePath, png);
    console.log(`Created: ${icon.name}`);
});

console.log('All icons generated!');
