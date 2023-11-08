type Color = 0 | 1;

const colors: Color[] = [0, 1];

type Tile = {
    top:   Color,
    bot:   Color,
    left:  Color,
    right: Color,
};

type Field = [
    [Tile, Tile, Tile, Tile],
    [Tile, Tile, Tile, Tile],
    [Tile, Tile, Tile, Tile],
    [Tile, Tile, Tile, Tile],
];

type TileIndex = 
    |  0 |  1 |  2 |  3 
    |  4 |  5 |  6 |  7 
    |  8 |  9 | 10 | 11
    | 12 | 13 | 14 | 15;

type Tileset = Map<TileIndex, Tile>;

function atIndex(i: TileIndex): Tile {
    return {
        left:  i & 8 ? 1 : 0,
        bot:   i & 4 ? 1 : 0,
        right: i & 2 ? 1 : 0,
        top:   i & 1 ? 1 : 0,
    };
}

function indexOf(t: Tile): TileIndex {
    let result = 0b0;

    if (t.top != 0)   result |= 0b0001;
    if (t.right != 0) result |= 0b0010;
    if (t.bot != 0)   result |= 0b0100;
    if (t.left != 0)  result |= 0b1000;

    return result as TileIndex;
}


function newTileset(q: number): Tileset {
    let result = new Map<TileIndex, Tile>();

    const combinations = 4 ** q; // four sides
    console.info(combinations);

    for (let i = 0; i < combinations; i++) {
        result.set(i as TileIndex, atIndex(i as TileIndex));
    }

    return result;
};

const set: Tileset = newTileset(2);

console.info(set);
