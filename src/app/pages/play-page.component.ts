import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Puzzle } from '../models/puzzle.model';
import { PuzzleService } from '../services/puzzle.service';

interface PlayTile {
  id: string;     // e.g. "2-3" = category 2, tile 3
  cat: number;    // which category it belongs to
  name: string;
  image: string;
}

// Animation timings (milliseconds)
const POP_STEP = 120;      // delay between each tile popping
const POP_DURATION = 260;  // how long one pop takes
const SHAKE_DURATION = 450;

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

@Component({
  selector: 'app-play-page',
  templateUrl: './play-page.component.html',
  styleUrl: './play-page.component.css',
})
export class PlayPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private puzzles = inject(PuzzleService);
  private messageTimer: any;
  private pastGuesses = new Set<string>();
  private popOrder = new Map<string, number>();

  loading = signal(true);
  error = signal('');
  puzzle = signal<Puzzle | null>(null);

  tiles = signal<PlayTile[]>([]);            // tiles still on the board
  selected = signal<Set<string>>(new Set()); // ids of selected tiles
  solved = signal<number[]>([]);             // category indexes, in the order they were found
  guesses = signal(0);
  message = signal('');

  checking = signal(false); // tiles are popping one by one
  wrong = signal(false);    // tiles are shaking with a red border
  busy = computed(() => this.checking() || this.wrong());

  finished = computed(() => this.solved().length === 4);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    try {
      const p = await this.puzzles.loadPuzzle(id);
      if (!p) {
        this.error.set("This connection doesn't exist. Make sure you copied the whole link.");
        return;
      }
      this.puzzle.set(p);
      this.tiles.set(shuffle(this.allTiles(p)));
    } catch {
      this.error.set('Could not load this connection. Check your internet and refresh the page.');
    } finally {
      this.loading.set(false);
    }
  }

  isSelected(tile: PlayTile) {
    return this.selected().has(tile.id);
  }

  popDelay(tile: PlayTile) {
    return (this.popOrder.get(tile.id) ?? 0) * POP_STEP;
  }

  toggle(tile: PlayTile) {
    if (this.busy()) return;
    const next = new Set(this.selected());
    if (next.has(tile.id)) {
      next.delete(tile.id);
    } else if (next.size < 4) {
      next.add(tile.id);
    }
    this.selected.set(next);
  }

  deselectAll() {
    if (this.busy()) return;
    this.selected.set(new Set());
  }

  shuffleTiles() {
    if (this.busy()) return;
    this.tiles.set(shuffle(this.tiles()));
  }

  submit() {
    if (this.busy()) return;
    const ids = [...this.selected()];
    if (ids.length !== 4) return;

    const key = [...ids].sort().join(',');
    if (this.pastGuesses.has(key)) {
      this.flash('You already tried that');
      return;
    }
    this.pastGuesses.add(key);
    this.guesses.update(n => n + 1);

    // Selected tiles in the order they appear on the grid, so they pop left to right, top to bottom
    const picked = this.tiles().filter(t => this.selected().has(t.id));
    this.popOrder = new Map(picked.map((t, i) => [t.id, i]));
    this.checking.set(true);

    setTimeout(() => {
      this.checking.set(false);

      const counts = new Map<number, number>();
      for (const t of picked) counts.set(t.cat, (counts.get(t.cat) ?? 0) + 1);
      const best = Math.max(...counts.values());

      if (best === 4) {
        this.solveCategory(picked[0].cat);
      } else {
        this.wrong.set(true);
        this.flash(best === 3 ? 'One away!' : 'Not quite');
        setTimeout(() => this.wrong.set(false), SHAKE_DURATION);
      }
    }, POP_STEP * 3 + POP_DURATION + 120);
  }

  categoryOf(ci: number) {
    return this.puzzle()!.categories[ci];
  }

  playAgain() {
    const p = this.puzzle();
    if (!p) return;
    this.pastGuesses.clear();
    this.solved.set([]);
    this.guesses.set(0);
    this.selected.set(new Set());
    this.tiles.set(shuffle(this.allTiles(p)));
  }

  private allTiles(p: Puzzle): PlayTile[] {
    return p.categories.flatMap((c, ci) =>
      c.tiles.map((t, ti) => ({ id: `${ci}-${ti}`, cat: ci, name: t.name, image: t.image })),
    );
  }

  private solveCategory(ci: number) {
    this.solved.update(s => [...s, ci]);
    this.tiles.update(list => list.filter(t => t.cat !== ci));
    this.selected.set(new Set());
    this.message.set('');
  }

  private flash(text: string) {
    clearTimeout(this.messageTimer);
    this.message.set(text);
    this.messageTimer = setTimeout(() => this.message.set(''), 1800);
  }
}