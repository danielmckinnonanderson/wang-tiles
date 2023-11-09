type Color = 0 | 1;

type Tile = {
    top:   Color,
    bot:   Color,
    left:  Color,
    right: Color,
};

type Point = { x: number, y: number };

type TileIndex = 
    |  0 |  1 |  2 |  3 
    |  4 |  5 |  6 |  7 
    |  8 |  9 | 10 | 11
    | 12 | 13 | 14 | 15;

const TOP_FLAG:   TileIndex = 0b0001;
const RIGHT_FLAG: TileIndex = 0b0010;
const BOT_FLAG:   TileIndex = 0b0100;
const LEFT_FLAG:  TileIndex = 0b1000;

// Set of all available tiles, as map of their index to their value
type Tileset = Map<TileIndex, Tile>;
const TILESET = newTileset(2);

// An instance of a 2D grid of Wang tiles
type TileGrid = Map<Point, TileIndex | EmptyCell>;
type EmptyCell = null; // Within grid but not yet filled
type CellOutsideGrid = undefined; // Not within grid's bounds

type Size = { width: number, height: number };

// Get Tile value from TileIndex
function atIndex(i: TileIndex): Tile {
    return {
        left:  i & 8 ? 1 : 0,
        bot:   i & 4 ? 1 : 0,
        right: i & 2 ? 1 : 0,
        top:   i & 1 ? 1 : 0,
    };
}

// Get TileIndex from Tile value
function indexOf(t: Tile): TileIndex {
    let result = 0b0000;

    if (t.top != 0)   result |= TOP_FLAG;
    if (t.right != 0) result |= RIGHT_FLAG;
    if (t.bot != 0)   result |= BOT_FLAG;
    if (t.left != 0)  result |= LEFT_FLAG;

    return result as TileIndex;
}

// Create a Tileset of all unique tile combinations with `q` possible colors
// TODO - Support more than 2 colors
function newTileset(q: 2): Tileset {
    let result = new Map<TileIndex, Tile>();

    const combinations = 4 ** q; // four sides

    for (let i = 0; i < combinations; i++) {
        result.set(i as TileIndex, atIndex(i as TileIndex));
    }

    return result;
};

/**
 * @param placing what we want to place.
 * @param adjacentTo a tile that is already placed.
 * @param orientation which direction `placing` is from `nextTo`.
 * @returns whether or not the placement is valid
 */
function isValidAdjacency(placing: TileIndex, adjacentTo: TileIndex, orientation: keyof Tile): boolean {
    switch (orientation) {
        case "top":   return (placing & BOT_FLAG)   == (adjacentTo & TOP_FLAG);
        case "right": return (placing & RIGHT_FLAG) == (adjacentTo & LEFT_FLAG);
        case "bot":   return (placing & BOT_FLAG)   == (adjacentTo & BOT_FLAG);
        case "left":  return (placing & LEFT_FLAG)  == (adjacentTo & RIGHT_FLAG);
    }
}

// Initializes a Tilegrid of the given size (or default of 16 x 12)
// With its keys being every point within map, and values all set to `null`
function emptyGrid(size?: Size): TileGrid {
    const result = new Map<Point, TileIndex | EmptyCell>();

    const { width, height } = size ? size : { width: 16, height: 12 };

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            result.set({ x, y }, null as EmptyCell);
        }
    }

    return result;
}


// Function which will return a tile index to try placing.
type TileSelectionStrategy = ( seed?: number ) => TileIndex;

// Function which will return the new point to place at.
type PlacementStrategy = ( seed?: number ) => Point;

// Predicate which will return the input `trying` if true, and empty if not.
type PlacementValidator = (trying: { tile: TileIndex, at: Point }, within: TileGrid) => { tile: TileIndex, at: Point } | InvalidPlacement;

type InvalidPlacement = null;

// This is sicko shit and I'm not sorry.
class TryPlacing {

    private placing?: TileIndex;
    private at?: Point;
    private predicates?: PlacementValidator[];
    private on?: TileGrid;

    private constructor(placing: TileIndex) {
        this.placing = placing;
    }

    /**
     * @param t index we're looking to place
     * @returns incrementally building TryPlacing
     */
    public static this(t: TileIndex): TryPlacing {
        return new TryPlacing(t);
    }

    /**
     * 
     * @param p the point we want to place on
     * @returns incrementally building TryPlacing
     */
    public atThisSpot(p: Point): TryPlacing {
        this.at = p;
        return this;
    }

    /**
     * 
     * @param passes all the predicates we will use to validate the tile & placement.
     * @returns incrementally building TryPlacing
     */
    public ifIt(passes: PlacementValidator[]): TryPlacing {
        this.predicates = passes;
        return this;
    }

    /**
     * @param grid the TileGrid we're operating on
     * @returns incrementally building TryPlacing
     */
    public onThis(grid: TileGrid): TryPlacing {
        this.on = grid;
        return this;
    }

    /**
     * 🎶 Let me get what I want this time 🎶
     * @returns updated TileGrid if placement was valid, error if not.
     */
    public pleasePleasePlease(): TileGrid | { error: string } {
        if (!this.placing || !this.at || !this.on) {
            return { error: "You didn't follow the rules of my silly little semantic API." };
        }

        // If we have validation predicates to check, check 'em
        if (this.predicates) {
            for (const predicate of this.predicates) {
                if (predicate( { tile: this.placing, at: this.at }, this.on ) == null as InvalidPlacement) {
                    return { error: "Did not pass validation." };
                }
            }
        }

        // Placement of tile is valid, so update the map and return it.
        this.on!.set( this.at, this.placing );

        return this.on;
    }

    /**
     * Doesn't do anything different, but it can't hurt.
     * 
     * @returns updated TileGrid if placement was valid, error if not.
     */
    public prettyPlease(): TileGrid | { error: string } {
        return this.pleasePleasePlease();
    }
}


const randomTile: TileSelectionStrategy = ( seed?: number ): TileIndex => {
    return seed
        ? Math.round( seed * (TILESET.size - 1) ) as TileIndex
        : Math.round( Math.random() * (TILESET.size - 1) ) as TileIndex;
};


const randomPoint: PlacementStrategy = ( seed?: number ): Point => {
    return seed
        ? { 
            x: Math.round( seed * size.width  ),
            y: Math.round( seed * size.height ),
         } as Point
        : {
            x: Math.round( Math.random() * size.width  ),
            y: Math.round( Math.random() * size.height ),
        } as Point;
};


const isValid: PlacementValidator = 
    ( trying: { tile: TileIndex, at: Point }, on: TileGrid ): { tile: TileIndex, at: Point } | null => {

    const adjacent = [
        // top
        on.has({ ...trying.at, y: trying.at.y + 1 }) 
            ? on.get(trying.at) as TileIndex | EmptyCell
            : undefined as CellOutsideGrid,

        // right
        on.has({ ...trying.at, x: trying.at.x + 1 }) 
            ? on.get(trying.at) as TileIndex | EmptyCell
            : undefined as CellOutsideGrid,

        // bot
        on.has({ ...trying.at, y: trying.at.y - 1 })
            ? on.get(trying.at) as TileIndex | EmptyCell
            : undefined as CellOutsideGrid,

        // left
        on.has({ ...trying.at, x: trying.at.x - 1 })
            ? on.get(trying.at) as TileIndex | EmptyCell
            : undefined as CellOutsideGrid,
    ];

    const positions: (keyof Tile)[] = ["top", "right", "bot", "left"];

    let valid = true;

    for (let i = 0; i < adjacent.length; i++) {
        const cell = adjacent[i];

        if (cell == undefined as CellOutsideGrid) continue; // Outside of grid is always a valid neighbor
        if (cell == null as EmptyCell) continue; // Empty cell is always a valid neighbor
            
        const orientation = positions[i];
        if (!isValidAdjacency(trying.tile, cell, orientation)) valid = false;
    }

    return valid
        ? trying
        : null as InvalidPlacement;
};

function randomWangTileGrid( size: Size, tile: TileSelectionStrategy, here: PlacementStrategy ): TileGrid {

    let grid = emptyGrid();
    const capacity = size.height * size.width;
    
    let i = 0;
    const MAX_ITERATIONS = 1000; // Safety

    do {
        i++;

        const tried = TryPlacing.this(tile()).atThisSpot(here()).onThis(grid).ifIt([isValid]).prettyPlease();

        if ( ("error" in tried ) ) {
            // Aw shucks... Well let's move on and try again.
            continue;
        }

        // We did it! We placed a tile! Holy shit! Holy shit!!
        grid = tried;

    } while(grid.size != capacity && i <= MAX_ITERATIONS);

    return grid;
}

const size: Size = { width: 12, height: 18 };
const g: TileGrid = randomWangTileGrid( size, randomTile, randomPoint );

console.info(g);
