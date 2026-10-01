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

  loading = signal(true);
  error = signal('');
  puzzle = signal<Puzzle | null>(null);

  tiles = signal<PlayTile[]>([]);            // tiles still on the board
  selected = signal<Set<string>>(new Set()); // ids of selected tiles
  solved = signal<number[]>([]);             // category indexes, in the order they were found
  guesses = signal(0);
  message = signal('');
  shaking = signal(false);

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
      const all = p.categories.flatMap((c, ci) =>
        c.tiles.map((t, ti) => ({ id: `${ci}-${ti}`, cat: ci, name: t.name, image: t.image })),
      );
      this.tiles.set(shuffle(all));
    } catch (e: any) {
      this.error.set('Could not load this connection. Check your internet and refresh the page.');
    } finally {
      this.loading.set(false);
    }
  }

  isSelected(tile: PlayTile) {
    return this.selected().has(tile.id);
  }

  toggle(tile: PlayTile) {
    const next = new Set(this.selected());
    if (next.has(tile.id)) {
      next.delete(tile.id);
    } else if (next.size < 4) {
      next.add(tile.id);
    }
    this.selected.set(next);
  }

  deselectAll() {
    this.selected.set(new Set());
  }

  shuffleTiles() {
    this.tiles.set(shuffle(this.tiles()));
  }

  submit() {
    const ids = [...this.selected()];
    if (ids.length !== 4) return;

    const key = [...ids].sort().join(',');
    if (this.pastGuesses.has(key)) {
      this.flash('You already tried that');
      return;
    }
    this.pastGuesses.add(key);
    this.guesses.update(n => n + 1);

    // Count how many of the selected tiles are in each category
    const picked = this.tiles().filter(t => this.selected().has(t.id));
    const counts = new Map<number, number>();
    for (const t of picked) counts.set(t.cat, (counts.get(t.cat) ?? 0) + 1);
    const best = Math.max(...counts.values());

    if (best === 4) {
      this.solveCategory(picked[0].cat);
      // Only one group left? Reveal it automatically.
      if (this.solved().length === 3) {
        this.solveCategory(this.tiles()[0].cat);
      }
    } else {
      this.shaking.set(true);
      setTimeout(() => this.shaking.set(false), 450);
      this.flash(best === 3 ? 'One away!' : 'Not quite');
    }
  }

  categoryOf(ci: number) {
    return this.puzzle()!.categories[ci];
  }

  namesOf(ci: number) {
    return this.categoryOf(ci).tiles.map(t => t.name).join(', ');
  }

  playAgain() {
    const p = this.puzzle();
    if (!p) return;
    this.pastGuesses.clear();
    this.solved.set([]);
    this.guesses.set(0);
    this.selected.set(new Set());
    this.tiles.set(
      shuffle(p.categories.flatMap((c, ci) =>
        c.tiles.map((t, ti) => ({ id: `${ci}-${ti}`, cat: ci, name: t.name, image: t.image })),
      )),
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
