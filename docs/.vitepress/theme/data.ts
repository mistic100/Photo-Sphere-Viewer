import { inject, Ref } from 'vue';

export type PsvDocData = {
    latestVersion: Ref<string>;
};

export const DataSymbol = Symbol();

export function usePsvDocData(): PsvDocData {
    const data = inject(DataSymbol);
    if (!data) {
        throw new Error('usePsvDocData() is called without provider.');
    }
    return data as PsvDocData;
}
