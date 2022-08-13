import { JovoPlayFab } from './JovoPlayFab';

declare module '@jovotech/framework/dist/types/Jovo' {
  interface Jovo {
    $playfab: JovoPlayFab;
  }
}

export * from './PlayFabPlugin';
