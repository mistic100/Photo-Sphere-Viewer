import assert from 'assert';
import { PanoData } from '../model';
import { cleanCssPosition, getConfigParser, getXMPValue, isExtendedPosition, mergePanoData, parseAngle, parsePoint, parseSpeed, speedToDuration } from './psv';

describe('utils:psv:isExtendedPosition', () => {
    it('should pass', () => {
        assert.strictEqual(isExtendedPosition({ pitch: 0, yaw: 0 }), true);
        assert.strictEqual(isExtendedPosition({ textureX: 0, textureY: 0 }), true);
        assert.strictEqual(isExtendedPosition({ pitch: 0, yaw: 0, textureX: 0, textureY: 0 }), true);
        assert.strictEqual(isExtendedPosition({ textureX: 0, textureY: 0, textureFace: 'front' }), true);
        assert.strictEqual(isExtendedPosition({ pitch: 0, yaw: 0, foo: { bar: 'baz' } }), true);
    });

    it('should not pass', () => {
        assert.strictEqual(isExtendedPosition(null), false);
        assert.strictEqual(isExtendedPosition({}), false);
        assert.strictEqual(isExtendedPosition([]), false);
        assert.strictEqual(isExtendedPosition({ pitch: 0 }), false);
        assert.strictEqual(isExtendedPosition({ textureX: 0 }), false);
    });
});

describe('utils:psv:parseAngle', () => {
    it('should normalize number', () => {
        assert.strictEqual(parseAngle(0), 0, '0');
        assert.strictEqual(parseAngle(Math.PI), Math.PI, 'PI');
        assert.strictEqual(parseAngle(3 * Math.PI), Math.PI, '3xPI');

        assert.strictEqual(parseAngle(0, true), 0, '0 centered');
        assert.strictEqual(parseAngle((Math.PI * 3) / 4, true), Math.PI / 2, '3/4xPI centered');
        assert.strictEqual(parseAngle((-Math.PI * 3) / 4, true), -Math.PI / 2, '-3/4xPI centered');
    });

    it('should parse radians angles', () => {
        const values: Record<string, number> = {
            '0': 0,
            '1.72': 1.72,
            '-2.56': Math.PI * 2 - 2.56,
            '3.14rad': 3.14,
            '-3.14rad': Math.PI * 2 - 3.14,
        };

        for (const pos in values) {
            assert.strictEqual(parseAngle(pos).toFixed(16), values[pos].toFixed(16), pos);
        }
    });

    it('should parse degrees angles', () => {
        const values: Record<string, number> = {
            '0deg': 0,
            '30deg': (30 * Math.PI) / 180,
            '-30deg': Math.PI * 2 - (30 * Math.PI) / 180,
            '85degs': (85 * Math.PI) / 180,
            '360degs': 0,
        };

        for (const pos in values) {
            assert.strictEqual(parseAngle(pos).toFixed(16), values[pos].toFixed(16), pos);
        }
    });

    it('should normalize angles between 0 and 2Pi', () => {
        const values: Record<string, number> = {
            '450deg': Math.PI / 2,
            '1440deg': 0,
            '8.15': 8.15 - Math.PI * 2,
            '-3.14': Math.PI * 2 - 3.14,
            '-360deg': 0,
        };

        for (const pos in values) {
            assert.strictEqual(parseAngle(pos).toFixed(16), values[pos].toFixed(16), pos);
        }
    });

    it('should normalize angles between -Pi/2 and Pi/2', () => {
        const values: Record<string, number> = {
            '45deg': Math.PI / 4,
            '-4': Math.PI / 2,
        };

        for (const pos in values) {
            assert.strictEqual(parseAngle(pos, true).toFixed(16), values[pos].toFixed(16), pos);
        }
    });

    it('should normalize angles between -Pi and Pi', function () {
        const values: Record<string, number> = {
            '45deg': Math.PI / 4,
            '4': -2 * Math.PI + 4,
        };

        for (const pos in values) {
            assert.strictEqual(parseAngle(pos, true, false).toFixed(16), values[pos].toFixed(16), pos);
        }
    });

    it('should throw exception on invalid values', () => {
        assert.throws(
            () => {
                parseAngle('foobar');
            },
            /Unknown angle "foobar"/,
            'foobar',
        );

        assert.throws(
            () => {
                parseAngle('200gr');
            },
            /Unknown angle unit "gr"/,
            '200gr',
        );
    });
});

describe('utils:psv:parsePoint', () => {
    it('should parse 2 keywords', () => {
        const values: Record<string, { x: number; y: number }> = {
            'top left': { x: 0, y: 0 },
            'top center': { x: 0.5, y: 0 },
            'top right': { x: 1, y: 0 },
            'center left': { x: 0, y: 0.5 },
            'center center': { x: 0.5, y: 0.5 },
            'center right': { x: 1, y: 0.5 },
            'bottom left': { x: 0, y: 1 },
            'bottom center': { x: 0.5, y: 1 },
            'bottom right': { x: 1, y: 1 },
        };

        for (const pos in values) {
            assert.deepStrictEqual(parsePoint(pos), values[pos], pos);

            const rev = pos.split(' ').reverse().join(' ');
            assert.deepStrictEqual(parsePoint(rev), values[pos], rev);
        }
    });

    it('should parse 1 keyword', () => {
        const values: Record<string, { x: number; y: number }> = {
            top: { x: 0.5, y: 0 },
            center: { x: 0.5, y: 0.5 },
            bottom: { x: 0.5, y: 1 },
            left: { x: 0, y: 0.5 },
            right: { x: 1, y: 0.5 },
        };

        for (const pos in values) {
            assert.deepStrictEqual(parsePoint(pos), values[pos], pos);
        }
    });

    it('should parse 2 percentages', () => {
        const values: Record<string, { x: number; y: number }> = {
            '0% 0%': { x: 0, y: 0 },
            '50% 50%': { x: 0.5, y: 0.5 },
            '100% 100%': { x: 1, y: 1 },
            '10% 80%': { x: 0.1, y: 0.8 },
            '80% 10%': { x: 0.8, y: 0.1 },
        };

        for (const pos in values) {
            assert.deepStrictEqual(parsePoint(pos), values[pos], pos);
        }
    });

    it('should parse 1 percentage', () => {
        const values: Record<string, { x: number; y: number }> = {
            '0%': { x: 0, y: 0 },
            '50%': { x: 0.5, y: 0.5 },
            '100%': { x: 1, y: 1 },
            '80%': { x: 0.8, y: 0.8 },
        };

        for (const pos in values) {
            assert.deepStrictEqual(parsePoint(pos), values[pos], pos);
        }
    });

    it('should parse mixed keyword & percentage', () => {
        const values: Record<string, { x: number; y: number }> = {
            'top 80%': { x: 0.8, y: 0 },
            '80% bottom': { x: 0.8, y: 1 },
            'left 40%': { x: 0, y: 0.4 },
            '40% right': { x: 1, y: 0.4 },
            'center 10%': { x: 0.5, y: 0.1 },
            '10% center': { x: 0.1, y: 0.5 },
        };

        for (const pos in values) {
            assert.deepStrictEqual(parsePoint(pos), values[pos], pos);
        }
    });

    it('should fallback on parse fail', () => {
        const values: Record<string, { x: number; y: number }> = {
            '': { x: 0.5, y: 0.5 },
            'crap': { x: 0.5, y: 0.5 },
            'foo bar': { x: 0.5, y: 0.5 },
            'foo 50%': { x: 0.5, y: 0.5 },
            '%': { x: 0.5, y: 0.5 },
        };

        for (const pos in values) {
            assert.deepStrictEqual(parsePoint(pos), values[pos], pos);
        }
    });

    it('should ignore extra tokens', () => {
        const values: Record<string, { x: number; y: number }> = {
            'top center bottom': { x: 0.5, y: 0 },
            '50% left 20%': { x: 0, y: 0.5 },
            '0% 0% okay this time it goes ridiculous': { x: 0, y: 0 },
        };

        for (const pos in values) {
            assert.deepStrictEqual(parsePoint(pos), values[pos], pos);
        }
    });

    it('should ignore case', () => {
        const values: Record<string, { x: number; y: number }> = {
            'TOP CENTER': { x: 0.5, y: 0 },
            'cenTer LefT': { x: 0, y: 0.5 },
        };

        for (const pos in values) {
            assert.deepStrictEqual(parsePoint(pos), values[pos], pos);
        }
    });
});

describe('utils:psv:parseSpeed', () => {
    it('should parse all units', () => {
        const values: Record<string, number> = {
            '360dpm': (360 * Math.PI) / 180 / 60,
            '360degrees per minute': (360 * Math.PI) / 180 / 60,
            '10dps': (10 * Math.PI) / 180,
            '10degrees per second': (10 * Math.PI) / 180,
            '2radians per minute': 2 / 60,
            '0.1radians per second': 0.1,
            '2rpm': (2 * 2 * Math.PI) / 60,
            '2revolutions per minute': (2 * 2 * Math.PI) / 60,
            '0.01rps': 0.01 * 2 * Math.PI,
            '0.01revolutions per second': 0.01 * 2 * Math.PI,
        };

        for (const speed in values) {
            assert.strictEqual(parseSpeed(speed).toFixed(16), values[speed].toFixed(16), speed);
        }
    });

    it('should allow various forms', () => {
        const values: Record<string, number> = {
            '2rpm': (2 * 2 * Math.PI) / 60,
            '2 rpm': (2 * 2 * Math.PI) / 60,
            '2revolutions per minute': (2 * 2 * Math.PI) / 60,
            '2 revolutions per minute': (2 * 2 * Math.PI) / 60,
            '-2rpm': (-2 * 2 * Math.PI) / 60,
            '-2 rpm': (-2 * 2 * Math.PI) / 60,
            '-2revolutions per minute': (-2 * 2 * Math.PI) / 60,
            '-2 revolutions per minute': (-2 * 2 * Math.PI) / 60,
        };

        for (const speed in values) {
            assert.strictEqual(parseSpeed(speed).toFixed(16), values[speed].toFixed(16), speed);
        }
    });

    it('should throw exception on invalid unit', () => {
        assert.throws(
            () => {
                parseSpeed('10rpsec');
            },
            /Unknown speed unit "rpsec"/,
            '10rpsec',
        );
    });

    it('should passthrough when number', () => {
        assert.strictEqual(parseSpeed(Math.PI), Math.PI);
    });
});

describe('utils:psv:getXMPValue', () => {
    it('should parse XMP data with children', () => {
        const data = `
<rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">
      <GPano:ProjectionType>equirectangular</GPano:ProjectionType>
      <GPano:UsePanoramaViewer>True</GPano:UsePanoramaViewer>
      <GPano:CroppedAreaImageWidthPixels>5376</GPano:CroppedAreaImageWidthPixels>
      <GPano:CroppedAreaImageHeightPixels>2688</GPano:CroppedAreaImageHeightPixels>
      <GPano:FullPanoWidthPixels>5376</GPano:FullPanoWidthPixels>
      <GPano:FullPanoHeightPixels>2688</GPano:FullPanoHeightPixels>
      <GPano:CroppedAreaLeftPixels>0</GPano:CroppedAreaLeftPixels>
      <GPano:CroppedAreaTopPixels>0</GPano:CroppedAreaTopPixels>
      <GPano:PoseHeadingDegrees>270.0</GPano:PoseHeadingDegrees>
      <GPano:PosePitchDegrees>0</GPano:PosePitchDegrees>
      <GPano:PoseRollDegrees>0.2</GPano:PoseRollDegrees>
</rdf:Description>`;

        assert.deepStrictEqual(
            [
                getXMPValue(data, 'FullPanoWidthPixels'),
                getXMPValue(data, 'FullPanoHeightPixels'),
                getXMPValue(data, 'CroppedAreaImageWidthPixels'),
                getXMPValue(data, 'CroppedAreaImageHeightPixels'),
                getXMPValue(data, 'CroppedAreaLeftPixels'),
                getXMPValue(data, 'CroppedAreaTopPixels'),
                getXMPValue(data, 'PoseHeadingDegrees'),
                getXMPValue(data, 'PosePitchDegrees'),
                getXMPValue(data, 'PoseRollDegrees'),
            ],
            [5376, 2688, 5376, 2688, 0, 0, 270, 0, 0],
        );
    });

    it('should parse XMP data with attributes', () => {
        const data = `
<rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/"
    GPano:ProjectionType="equirectangular"
    GPano:UsePanoramaViewer="True"
    GPano:CroppedAreaImageWidthPixels="5376"
    GPano:CroppedAreaImageHeightPixels="2688"
    GPano:FullPanoWidthPixels="5376"
    GPano:FullPanoHeightPixels="2688"
    GPano:CroppedAreaLeftPixels="0"
    GPano:CroppedAreaTopPixels="0"
    GPano:PoseHeadingDegrees="270"
    GPano:PosePitchDegrees="0"
    GPano:PoseRollDegrees="0"/>`;

        assert.deepStrictEqual(
            [
                getXMPValue(data, 'FullPanoWidthPixels'),
                getXMPValue(data, 'FullPanoHeightPixels'),
                getXMPValue(data, 'CroppedAreaImageWidthPixels'),
                getXMPValue(data, 'CroppedAreaImageHeightPixels'),
                getXMPValue(data, 'CroppedAreaLeftPixels'),
                getXMPValue(data, 'CroppedAreaTopPixels'),
                getXMPValue(data, 'PoseHeadingDegrees'),
                getXMPValue(data, 'PosePitchDegrees'),
                getXMPValue(data, 'PoseRollDegrees'),
            ],
            [5376, 2688, 5376, 2688, 0, 0, 270, 0, 0],
        );
    });
});

describe('utils:psv:cleanPosition', () => {
    it('should clean various formats', () => {
        assert.deepStrictEqual(cleanCssPosition('top right'), ['top', 'right']);
        assert.deepStrictEqual(cleanCssPosition('right top'), ['top', 'right']);
        assert.deepStrictEqual(cleanCssPosition(['top', 'right']), ['top', 'right']);
    });

    it('should add missing center', () => {
        assert.deepStrictEqual(cleanCssPosition('top'), ['top', 'center']);
        assert.deepStrictEqual(cleanCssPosition('left'), ['center', 'left']);
        assert.deepStrictEqual(cleanCssPosition('center'), ['center', 'center']);
    });

    it('should disallow all center', () => {
        assert.strictEqual(cleanCssPosition('center center', { allowCenter: false, cssOrder: true }), null);
        assert.strictEqual(cleanCssPosition('center', { allowCenter: false, cssOrder: true }), null);
    });

    it('should return null on unparsable values', () => {
        assert.strictEqual(cleanCssPosition('foo bar'), null);
        assert.strictEqual(cleanCssPosition('TOP CENTER'), null);
        assert.strictEqual(cleanCssPosition(''), null);
        assert.strictEqual(cleanCssPosition(undefined as any), null);
    });

    it('should allow XY order', () => {
        assert.deepStrictEqual(cleanCssPosition('right top', { allowCenter: true, cssOrder: false }), ['right', 'top']);
        assert.deepStrictEqual(cleanCssPosition(['top', 'right'], { allowCenter: true, cssOrder: false }), ['top', 'right']);
    });

    it('should always order with center', () => {
        assert.deepStrictEqual(cleanCssPosition('center top'), ['top', 'center']);
        assert.deepStrictEqual(cleanCssPosition('left center'), ['center', 'left']);
    });
});

describe('utils:psv:speedToDuration', () => {
    it('should return numeric values as it', () => {
        assert.strictEqual(speedToDuration(1000, NaN), 1000);
        assert.strictEqual(speedToDuration(-1000, NaN), 1000);
    });

    it('should return valid speed', () => {
        assert.strictEqual(speedToDuration('1rpm', Math.PI * 2), 60000);
        assert.strictEqual(speedToDuration('-1rpm', Math.PI * 2), 60000);
        assert.strictEqual(speedToDuration('2rpm', Math.PI), 15000);
    });
});

describe('utils:psv:mergePanoData', () => {
    it('should generate default panoData for 2:1 image', () => {
        assertDeepEqualLenient(mergePanoData(2000, 1000), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 1000,
            croppedX: 0,
            croppedY: 0,
        } satisfies PanoData);
    });

    it('should generate default panoData for partial image (horizontal)', () => {
        assertDeepEqualLenient(mergePanoData(2000, 500), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: 250,
        } satisfies PanoData);
    });

    it('should generate default panoData for partial image (vertical)', () => {
        assertDeepEqualLenient(mergePanoData(1000, 1000), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 1000,
            croppedHeight: 1000,
            croppedX: 500,
            croppedY: 0,
        } satisfies PanoData);
    });

    it('should generate default panoData with pose', () => {
        assertDeepEqualLenient(mergePanoData(2000, 1000, {
            poseHeading: 90,
        } as PanoData), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 1000,
            croppedX: 0,
            croppedY: 0,
            poseHeading: 90,
        } satisfies PanoData);
    });

    it('should keep XMP data', () => {
        assertDeepEqualLenient(mergePanoData(2000, 500, undefined, {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: 500,
        }), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: 500,
        } satisfies PanoData);
    });

    it('should keep custom data over XMP', () => {
        assertDeepEqualLenient(mergePanoData(2000, 500, {
            fullWidth: 3000,
            fullHeight: 1500,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 500,
            croppedY: 1000,
        }, {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: 500,
        }), {
            fullWidth: 3000,
            fullHeight: 1500,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 500,
            croppedY: 1000,
        } satisfies PanoData);
    });

    it('should fix invalid fullWidth/fullHeight', () => {
        assertDeepEqualLenient(mergePanoData(2000, 500, {
            fullWidth: 2000,
            fullHeight: 990, // KO
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: 500,
        }), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: 500,
        } satisfies PanoData);
    });

    it('should fix invalid croppedY', () => {
        assertDeepEqualLenient(mergePanoData(2000, 500, {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: 1000, // KO
        }), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: 500,
        } satisfies PanoData);

        assertDeepEqualLenient(mergePanoData(2000, 500, {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: -500, // KO
        }), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 2000,
            croppedHeight: 500,
            croppedX: 0,
            croppedY: 0,
        } satisfies PanoData);
    });

    it('should fix invalid croppedX', () => {
        assertDeepEqualLenient(mergePanoData(1000, 1000, {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 1000,
            croppedHeight: 1000,
            croppedX: 1500, // KO
            croppedY: 0,
        }), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 1000,
            croppedHeight: 1000,
            croppedX: 1000,
            croppedY: 0,
        } satisfies PanoData);

        assertDeepEqualLenient(mergePanoData(1000, 1000, {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 1000,
            croppedHeight: 1000,
            croppedX: -500, // KO
            croppedY: 0,
        }), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 1000,
            croppedHeight: 1000,
            croppedX: 0,
            croppedY: 0,
        } satisfies PanoData);
    });

    it('should complete missing fullWidth', () => {
        assertDeepEqualLenient(mergePanoData(1000, 1000, {
            fullHeight: 1000,
            croppedX: 500,
            croppedY: 0,
        } as PanoData), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 1000,
            croppedHeight: 1000,
            croppedX: 500,
            croppedY: 0,
        });
    });

    it('should complete missing fullHeight', () => {
        assertDeepEqualLenient(mergePanoData(1000, 1000, {
            fullWidth: 2000,
            croppedX: 500,
            croppedY: 0,
        }), {
            fullWidth: 2000,
            fullHeight: 1000,
            croppedWidth: 1000,
            croppedHeight: 1000,
            croppedX: 500,
            croppedY: 0,
        });
    });

    it('should resize data if image is smaller', () => {
        assertDeepEqualLenient(mergePanoData(8192, 4096, {
            fullWidth: 10000,
            fullHeight: 5000,
            croppedWidth: 10000,
            croppedHeight: 4000,
            croppedX: 0,
            croppedY: 500,
        } satisfies PanoData), {
            fullWidth: 8192,
            fullHeight: 4096,
            croppedWidth: 8192,
            croppedHeight: 3277,
            croppedX: 0,
            croppedY: 410,
        });
    });
});

describe('utils:psv:getConfigParser', () => {
    type Myconfig = {
        field1?: string;
        field2?: number;
        field3?: boolean;
    };

    const parser = getConfigParser<Myconfig>({
        field1: 'default1',
        field2: 100,
        field3: true,
    });

    const parserWithParsers = getConfigParser<Myconfig>({
        field1: 'default1',
        field2: 100,
        field3: true,
    }, {
        field1(val, _) {
            return val.toUpperCase();
        },
        field2(val, opts) {
            return val + opts.defValue;
        },
        field3(_, opts) {
            return opts.rawConfig.field1 === 'foo';
        },
    });

    it('should expose defaults', () => {
        assert.deepStrictEqual(parser.defaults, {
            field1: 'default1',
            field2: 100,
            field3: true,
        });
    });

    it('should apply default values', () => {
        assert.deepStrictEqual(parser(null), {
            field1: 'default1',
            field2: 100,
            field3: true,
        });
    });

    it('should define values', () => {
        assert.deepStrictEqual(parser({
            field1: 'value1',
            field2: 0,
            field3: false,
        }), {
            field1: 'value1',
            field2: 0,
            field3: false,
        });
    });

    it('should define nulls', () => {
        assert.deepStrictEqual(parser({
            field1: null,
            field2: null,
            field3: null,
        }), {
            field1: null,
            field2: null,
            field3: null,
        });
    });

    it('should ignore unknown fields', () => {
        assert.deepStrictEqual(parser({
            // @ts-ignore
            newField: 'foobar',
        }), {
            field1: 'default1',
            field2: 100,
            field3: true,
        });
    });

    it('should apply parsers', () => {
        assert.deepStrictEqual(parserWithParsers({
            field1: 'foo',
            field2: 50,
            field3: false,
        }), {
            field1: 'FOO',
            field2: 150,
            field3: true,
        });
    });
});

function assertDeepEqualLenient(actual: any, expected: any) {
    const picked = {} as any;
    Object.keys(expected).forEach((key) => {
        picked[key] = actual[key];
    });
    assert.deepStrictEqual(picked, expected);
}
