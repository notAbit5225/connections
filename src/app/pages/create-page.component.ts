import { Component, computed, inject, signal } from '@angular/core';
import { CATEGORY_COLORS, Puzzle } from '../models/puzzle.model';
import { ImageService } from '../services/image.service';
import { PuzzleService } from '../services/puzzle.service';

const DRAFT_KEY = 'leconnect-draft';

function emptyPuzzle(): Puzzle {
  return {
    categories: CATEGORY_COLORS.map(color => ({
      name: '',
      color,
      tiles: Array.from({ length: 4 }, () => ({ name: '', image: '' })),
    })),
  };
}

@Component({
  selector: 'app-create-page',
  templateUrl: './create-page.component.html',
  styleUrl: './create-page.component.css',
})
export class CreatePageComponent {
  private images = inject(ImageService);
  private puzzles = inject(PuzzleService);
  private draftTimer: any;

  puzzle = signal<Puzzle>(this.loadDraft());
  busy = signal<Set<string>>(new Set());
  saving = signal(false);
  error = signal('');
  shareLink = signal('');
  copied = signal(false);
  showErrors = signal(false);
  canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  /** How many names / photos are still empty. */
  missing = computed(() => {
    let count = 0;
    for (const c of this.puzzle().categories) {
      if (!c.name.trim()) count++;
      for (const t of c.tiles) {
        if (!t.name.trim()) count++;
        if (!t.image) count++;
      }
    }
    return count;
  });

  setCategoryName(ci: number, value: string) {
    this.update(p => (p.categories[ci].name = value));
  }

  setTileName(ci: number, ti: number, value: string) {
    this.update(p => (p.categories[ci].tiles[ti].name = value));
  }

  async onFile(ci: number, ti: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // lets you pick the same file again later
    if (!file) return;

    const key = `${ci}-${ti}`;
    this.setBusy(key, true);
    this.error.set('');
    try {
      const data = await this.images.compressToTile(file);
      this.update(p => (p.categories[ci].tiles[ti].image = data));
    } catch (e: any) {
      this.error.set(e?.message ?? 'That picture could not be loaded.');
    } finally {
      this.setBusy(key, false);
    }
  }

  removeImage(ci: number, ti: number) {
    this.update(p => (p.categories[ci].tiles[ti].image = ''));
  }

  isBusy(ci: number, ti: number) {
    return this.busy().has(`${ci}-${ti}`);
  }

  async done() {
    this.showErrors.set(true);
    const missing = this.missing();
    if (missing > 0) {
      this.error.set(`${missing} ${missing === 1 ? 'thing is' : 'things are'} still empty. They're outlined in red.`);
      return;
    }
    if (this.busy().size > 0) {
      this.error.set('Wait for the photos to finish loading.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    try {
      const clean: Puzzle = {
        categories: this.puzzle().categories.map(c => ({
          name: c.name.trim(),
          color: c.color,
          tiles: c.tiles.map(t => ({ name: t.name.trim(), image: t.image })),
        })),
      };
      const id = await this.puzzles.savePuzzle(clean);
      this.shareLink.set(this.puzzles.buildShareLink(id));
      this.clearDraft();
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      this.error.set('Saving failed: ' + (e?.message ?? e) + '. Check your internet and try again.');
    } finally {
      this.saving.set(false);
    }
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(this.shareLink());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.error.set('Copying failed. Press and hold the link to copy it.');
    }
  }

  async share() {
    try {
      await navigator.share({ title: 'Can you solve my connection?', url: this.shareLink() });
    } catch {
      // user closed the share menu, nothing to do
    }
  }

  startOver() {
    this.puzzle.set(emptyPuzzle());
    this.shareLink.set('');
    this.showErrors.set(false);
    this.error.set('');
    window.scrollTo({ top: 0 });
  }

  clearAll() {
    if (confirm('Clear everything and start over?')) {
      this.clearDraft();
      this.startOver();
    }
  }

  // ---------- helpers ----------

  private update(change: (p: Puzzle) => void) {
    const p = this.puzzle();
    change(p);
    this.puzzle.set({ categories: [...p.categories] }); // new reference so Angular notices
    this.saveDraftSoon();
  }

  private setBusy(key: string, on: boolean) {
    const next = new Set(this.busy());
    on ? next.add(key) : next.delete(key);
    this.busy.set(next);
  }

  // The draft is kept in your browser, so nothing is lost if the page reloads
  // (phones sometimes reload the page after you open the gallery).
  private saveDraftSoon() {
    clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(this.puzzle()));
      } catch {
        // storage full or blocked, the app still works without it
      }
    }, 500);
  }

  private loadDraft(): Puzzle {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const p = JSON.parse(saved) as Puzzle;
        if (p?.categories?.length === 4) return p;
      }
    } catch {}
    return emptyPuzzle();
  }

  private clearDraft() {
    clearTimeout(this.draftTimer);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }
}
