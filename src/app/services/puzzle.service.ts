import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config';
import { Puzzle } from '../models/puzzle.model';

@Injectable({ providedIn: 'root' })
export class PuzzleService {
  private db = getFirestore(initializeApp(firebaseConfig));

  /** Saves a puzzle and returns its ID. */
  async savePuzzle(puzzle: Puzzle): Promise<string> {
    const ref = await addDoc(collection(this.db, 'puzzles'), {
      categories: puzzle.categories,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  /** Loads a puzzle by ID, or null if it doesn't exist. */
  async loadPuzzle(id: string): Promise<Puzzle | null> {
    const snap = await getDoc(doc(this.db, 'puzzles', id));
    return snap.exists() ? (snap.data() as Puzzle) : null;
  }

  /** Builds the link you send to your friend. Works on localhost and GitHub Pages. */
  buildShareLink(id: string): string {
    const base = window.location.href.split('#')[0];
    return `${base}#/play/${id}`;
  }
}
