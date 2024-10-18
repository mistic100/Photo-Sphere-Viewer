import assert from 'assert';
import { greatArcDistance } from './math';

describe('utils:math:greatArcDistance', () => {
    it('should compute the great-arc distance', () => {
        // easy
        assert.strictEqual(greatArcDistance([0, 0], [Math.PI, 0]), Math.PI);
        assert.strictEqual(greatArcDistance([Math.PI / 2, 0], [(3 * Math.PI) / 2, 0]), Math.PI);

        // crossing origin left to right
        assert.strictEqual(greatArcDistance([(7 * Math.PI) / 4, 0], [Math.PI / 4, 0]), Math.PI / 2);
        assert.strictEqual(greatArcDistance([-Math.PI / 4, 0], [Math.PI / 4, 0]), Math.PI / 2);

        // crossing origin right to left
        assert.strictEqual(greatArcDistance([Math.PI / 4, 0], [(7 * Math.PI) / 4, 0]), Math.PI / 2);
        assert.strictEqual(greatArcDistance([Math.PI / 4, 0], [-Math.PI / 4, 0]), Math.PI / 2);
    });
});
