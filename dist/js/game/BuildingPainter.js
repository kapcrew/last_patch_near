/** Procedural pixel-art fallback. Completely independent from contract/wallet/game state. */
export function paintBuilding(ctx, id, x, y, w, h, variant, time) {
    const repaired = variant === 'restored', working = variant === 'progress';
    const C = { edge: '#292b47', shadow: '#242445', stone: repaired ? '#e7cbb7' : working ? '#a1a0ae' : '#80849e', stoneHi: repaired ? '#f4e2cb' : working ? '#c3b4c5' : '#a49faf', stoneLow: repaired ? '#a88e91' : working ? '#73738d' : '#54566f', roof: repaired ? '#bd6b81' : working ? '#886b8c' : '#5c5578', roofHi: repaired ? '#de889b' : working ? '#b192ab' : '#8276a0', roofLow: repaired ? '#713e65' : working ? '#5b4e70' : '#353652', window: repaired ? '#ffdfa0' : working ? '#cba8a3' : '#242a46', wood: repaired ? '#ab7458' : '#76657b', light: '#ffdf9b' };
    const p = (a, b, c, d, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(a), Math.round(b), Math.round(c), Math.round(d)); };
    const line = (a, b, c, d, color) => { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); };
    const brick = (bx, by, bw, bh) => { p(bx, by, bw, bh, C.stone); for (let r = 0; r < Math.floor(bh / 9); r++) {
        let yy = by + 5 + r * 9;
        p(bx, yy, bw, 1, C.stoneLow);
        const shift = (r % 2) * 7;
        for (let xx = bx + shift; xx < bx + bw; xx += 14)
            p(xx, by + r * 9, 1, 8, C.stoneLow);
    } p(bx, by, bw, 3, C.stoneHi); };
    // Buildings cast contact shadows on the photo backdrop, not on UI or contract state.
    p(x + 3, y + h - 8, w - 6, 9, '#1118369a');
    if (id === 'bridge') {
        // Dramatically broken span over the actual river. The river never becomes financially authoritative.
        p(x + 1, y + 30, 30, 11, C.edge);
        p(x + 4, y + 33, 28, 7, C.stone);
        p(x + w - 32, y + 30, 31, 11, C.edge);
        p(x + w - 28, y + 33, 25, 7, C.stone);
        for (let k = 0; k < 2; k++) {
            const bx = k ? x + w - 23 : x + 7;
            brick(bx, y + 24, 15, 25);
            p(bx - 5, y + 19, 25, 6, C.stoneHi);
            p(bx + 6, y + 9, 5, 12, C.edge);
            p(bx + 7, y + 11, 3, 9, repaired ? '#f3cd8f' : '#866c8d');
        }
        if (repaired) {
            p(x + 13, y + 25, w - 26, 19, C.edge);
            p(x + 13, y + 27, w - 26, 11, C.wood);
            p(x + 14, y + 35, w - 28, 5, '#d9ad83');
            for (let i = 0; i < 7; i++) {
                const ax = x + 17 + i * 11;
                p(ax, y + 28, 2, 11, '#674858');
            }
            p(x + 15, y + 14, w - 30, 5, C.roofHi);
            for (let i = 0; i < 8; i++) {
                const ax = x + 16 + i * 9;
                p(ax, y + 16, 3, 11, C.roofLow);
                p(ax, y + 13, 5, 3, C.stoneHi);
            }
            for (const bx of [x + 10, x + w - 13]) {
                p(bx, y + 11, 3, 13, C.wood);
                p(bx - 2, y + 6, 7, 7, C.light);
                p(bx - 2, y + 4, 7, 2, '#f9f0cd');
            }
        }
        else {
            p(x + 6, y + 29, 29, 12, C.stoneLow);
            p(x + 6, y + 27, 29, 4, C.stoneHi);
            p(x + 35, y + 33, 10, 5, C.stoneLow);
            p(x + w - 41, y + 39, 8, 6, C.stoneLow);
            p(x + w - 34, y + 28, 28, 13, C.stoneLow);
            p(x + w - 34, y + 27, 28, 3, C.stoneHi);
            line(x + 26, y + 30, x + 33, y + 39, '#29273e');
            line(x + w - 28, y + 27, x + w - 23, y + 36, '#29273e');
            if (working) {
                p(x + 35, y + 17, w - 70, 4, '#b79a77');
                p(x + 40, y + 14, 4, 30, '#ccb285');
                p(x + w - 44, y + 14, 4, 30, '#ccb285');
                for (let i = 0; i < 4; i++)
                    p(x + 36 + i * 11, y + 13, 3, 4, '#ffdb9b');
            }
        }
        p(x + 27, y + h - 7, 10, 3, '#557c95');
        p(x + w - 36, y + h - 8, 11, 3, '#557c95');
        return;
    }
    if (id === 'well') {
        // Roof canopy and a stone well with visibly different water state.
        p(x + 10, y + 40, w - 20, h - 42, C.edge);
        brick(x + 12, y + 38, w - 24, h - 42);
        p(x + 18, y + 38, w - 36, 13, repaired ? '#4d9bb6' : '#242941');
        p(x + 21, y + 42, w - 42, 6, repaired ? '#88d5df' : '#313957');
        p(x + 16, y + 18, 7, 32, C.wood);
        p(x + w - 23, y + 18, 7, 32, C.wood);
        p(x + 8, y + 16, w - 16, 7, C.roofLow);
        p(x + 12, y + 11, w - 24, 6, C.roof);
        p(x + 18, y + 6, w - 36, 6, C.roofHi);
        for (let i = 0; i < 5; i++)
            p(x + 15 + i * 10, y + 16, 5, 4, C.roofHi);
        p(x + 9, y + 34, w - 18, 6, C.stoneHi);
        p(x + 12, y + 30, w - 24, 4, C.stoneLow);
        p(x + w / 2 - 2, y + 24, 4, 7, '#b7a3a8');
        p(x + w / 2 - 8, y + 28, 13, 3, '#9886a0');
        if (repaired) {
            for (let i = 0; i < 6; i++)
                p(x + 18 + i * 8, y + 40 + (i % 2) * 3, 4, 1, '#e9f8e3');
            p(x + 7, y + h - 9, 7, 6, '#8ab983');
            p(x + w - 13, y + h - 9, 7, 6, '#8ab983');
        }
        if (working)
            p(x + w - 19, y + 4, 9, 4, '#ebd09e');
        return;
    }
    // Library and forge share foundation, but different skylines and decorative affordances.
    const by = y + 27, bh = h - 34, bx = x + 6, bw = w - 12;
    p(bx - 3, by - 3, bw + 6, bh + 7, C.edge);
    brick(bx, by, bw, bh);
    if (id === 'library') {
        // High-gabled archive with buttresses and tower window.
        p(x + 13, y + 17, w - 26, 12, C.roofLow);
        p(x + 19, y + 12, w - 38, 9, C.roof);
        p(x + 27, y + 6, w - 54, 9, C.roofHi);
        p(x + w / 2 - 8, y + 5, 16, 4, C.roofLow);
        p(x + w / 2 - 3, y - 2, 6, 10, C.edge);
        for (let i = 0; i < 6; i++)
            p(x + 19 + i * 12, y + 19, 6, 4, C.roofHi);
        for (const wx of [x + 17, x + w - 29]) {
            p(wx - 2, y + 44, 19, 23, C.edge);
            p(wx, y + 46, 15, 18, C.window);
            p(wx + 7, y + 46, 2, 18, C.roofLow);
            p(wx, y + 55, 15, 2, C.roofLow);
            p(wx - 2, y + 42, 19, 4, C.stoneHi);
        }
        p(x + w / 2 - 14, y + h - 35, 28, 32, C.edge);
        p(x + w / 2 - 11, y + h - 32, 22, 29, C.wood);
        p(x + w / 2 + 6, y + h - 18, 3, 3, C.light);
        p(x + 11, y + h - 9, 13, 11, C.stoneLow);
        p(x + w - 25, y + h - 9, 13, 11, C.stoneLow);
        if (repaired) {
            p(x + 7, y + 25, 7, 5, '#d9b796');
            p(x + w - 13, y + 25, 7, 5, '#d9b796');
            p(x + w / 2 - 5, y - 11, 9, 10, '#e3a1b3');
        }
    }
    else {
        // Forge with smoldering chimney and iron gate.
        p(x + 15, y + 17, w - 30, 12, C.roofLow);
        p(x + 23, y + 11, w - 46, 9, C.roof);
        p(x + 33, y + 5, w - 66, 9, C.roofHi);
        p(x + w - 30, y - 5, 19, 30, C.edge);
        brick(x + w - 27, y - 2, 13, 25);
        p(x + w - 32, y - 7, 22, 6, C.stoneHi);
        if (repaired) {
            p(x + w - 25, y - 15, 7, 8, '#f5a97b');
            p(x + w - 24, y - 19, 4, 5, '#f4d093');
        }
        else {
            p(x + w - 29, y - 17, 13, 8, '#64617e');
            p(x + w - 25, y - 24, 9, 7, '#5c5673');
        }
        for (const wx of [x + 12, x + w - 28]) {
            p(wx, y + 45, 17, 18, C.edge);
            p(wx + 3, y + 48, 11, 13, C.window);
            p(wx + 7, y + 48, 2, 13, C.roofLow);
        }
        p(x + w / 2 - 14, y + h - 31, 29, 28, C.edge);
        p(x + w / 2 - 11, y + h - 28, 23, 25, repaired ? '#894d5c' : '#3a3853');
        p(x + w / 2 - 6, y + h - 20, 13, 9, repaired ? '#ffa76c' : '#272640');
        if (repaired) {
            p(x + 4, y + h - 10, 8, 6, '#9bbc91');
            p(x + w - 15, y + h - 11, 8, 7, '#9bbc91');
        }
    }
    // In-progress repairs get visible scaffolding; broken states show cracks.
    if (working) {
        p(x + 3, y + 30, 4, h - 35, '#cead84');
        p(x + w - 7, y + 30, 4, h - 35, '#cead84');
        p(x + 1, y + 48, w - 2, 4, '#aa9475');
        p(x + 3, y + 26, w - 6, 3, '#aa9475');
        p(x + w / 2 - 3, y + 37, 7, 7, '#edcf94');
    }
    if (!repaired && !working) {
        line(x + 35, y + 48, x + 42, y + 59, '#45435b');
        line(x + 42, y + 59, x + 35, y + 67, '#45435b');
        p(x + 18, y + h - 12, 8, 3, '#668a6a');
    }
    if (repaired) {
        for (let i = 0; i < 5; i++) {
            let a = x + 7 + i * 16;
            p(a, y + h - 8 - (i % 2) * 2, 4, 3, '#9dbb83');
            p(a + 2, y + h - 11 - (i % 2) * 2, 2, 3, '#f3c5aa');
        }
        if (Math.sin(time * 2) > 0)
            p(x + w / 2 - 2, y + 8, 3, 3, '#fff0ba');
    }
}
