export type CategoryColor = 'yellow' | 'green' | 'blue' | 'purple';

export const CATEGORY_COLORS: CategoryColor[] = ['yellow', 'green', 'blue', 'purple'];

export interface Tile {
  name: string;   // shown under the picture
  image: string;  // compressed image as a data URL (added in Part 2)
}

export interface Category {
  name: string;          // revealed when the group is found
  color: CategoryColor;
  tiles: Tile[];         // exactly 4
}

export interface Puzzle {
  categories: Category[]; // exactly 4
}
