import assert from 'assert';

import { cleanPosition, getXMPValue, parseAngle, parsePosition, parseSpeed } from './psv';

describe('utils:psv:parseAngle', () => {
  it('should normalize number', () => {
    assert.strictEqual(parseAngle(0), 0, '0');
    assert.strictEqual(parseAngle(Math.PI), Math.PI, 'PI');
    assert.strictEqual(parseAngle(3 * Math.PI), Math.PI, '3xPI');

    assert.strictEqual(parseAngle(0, true), 0, '0 centered');
    assert.strictEqual(parseAngle(Math.PI * 3 / 4, true), Math.PI / 2, '3/4xPI centered');
    assert.strictEqual(parseAngle(-Math.PI * 3 / 4, true), -Math.PI / 2, '-3/4xPI centered');
  });

  it('should parse radians angles', () => {
    const values = {
      '0'       : 0,
      '1.72'    : 1.72,
      '-2.56'   : Math.PI * 2 - 2.56,
      '3.14rad' : 3.14,
      '-3.14rad': Math.PI * 2 - 3.14
    };

    for (const pos in values) {
      assert.strictEqual(parseAngle(pos).toFixed(16), values[pos].toFixed(16), pos);
    }
  });

  it('should parse degrees angles', () => {
    const values = {
      '0deg'   : 0,
      '30deg'  : 30 * Math.PI / 180,
      '-30deg' : Math.PI * 2 - 30 * Math.PI / 180,
      '85degs' : 85 * Math.PI / 180,
      '360degs': 0
    };

    for (const pos in values) {
      assert.strictEqual(parseAngle(pos).toFixed(16), values[pos].toFixed(16), pos);
    }
  });

  it('should normalize angles between 0 and 2Pi', () => {
    const values = {
      '450deg' : Math.PI / 2,
      '1440deg': 0,
      '8.15'   : 8.15 - Math.PI * 2,
      '-3.14'  : Math.PI * 2 - 3.14,
      '-360deg': 0
    };

    for (const pos in values) {
      assert.strictEqual(parseAngle(pos).toFixed(16), values[pos].toFixed(16), pos);
    }
  });

  it('should normalize angles between -Pi/2 and Pi/2', () => {
    const values = {
      '45deg': Math.PI / 4,
      '-4'   : Math.PI / 2
    };

    for (const pos in values) {
      assert.strictEqual(parseAngle(pos, true).toFixed(16), values[pos].toFixed(16), pos);
    }
  });

  it('should normalize angles between -Pi and Pi', function () {
    const values = {
      '45deg': Math.PI / 4,
      '4'    : -2 * Math.PI + 4
    };

    for (const pos in values) {
      assert.strictEqual(parseAngle(pos, true, false).toFixed(16), values[pos].toFixed(16), pos);
    }
  });

  it('should throw exception on invalid values', () => {
    assert.throws(() => {
      parseAngle('foobar');
    }, /Unknown angle "foobar"/, 'foobar');

    assert.throws(() => {
      parseAngle('200gr')
    }, /Unknown angle unit "gr"/, '200gr');
  });
});


describe('utils:psv:parsePosition', () => {
  it('should parse 2 keywords', () => {
    const values = {
      'top left'     : { x: 0, y: 0 },
      'top center'   : { x: 0.5, y: 0 },
      'top right'    : { x: 1, y: 0 },
      'center left'  : { x: 0, y: 0.5 },
      'center center': { x: 0.5, y: 0.5 },
      'center right' : { x: 1, y: 0.5 },
      'bottom left'  : { x: 0, y: 1 },
      'bottom center': { x: 0.5, y: 1 },
      'bottom right' : { x: 1, y: 1 }
    };

    for (const pos in values) {
      assert.deepStrictEqual(parsePosition(pos), values[pos], pos);

      const rev = pos.split(' ').reverse().join(' ');
      assert.deepStrictEqual(parsePosition(rev), values[pos], rev);
    }
  });

  it('should parse 1 keyword', () => {
    const values = {
      'top'   : { x: 0.5, y: 0 },
      'center': { x: 0.5, y: 0.5 },
      'bottom': { x: 0.5, y: 1 },
      'left'  : { x: 0, y: 0.5 },
      'right' : { x: 1, y: 0.5 },
    };

    for (const pos in values) {
      assert.deepStrictEqual(parsePosition(pos), values[pos], pos);
    }
  });

  it('should parse 2 percentages', () => {
    const values = {
      '0% 0%'    : { x: 0, y: 0 },
      '50% 50%'  : { x: 0.5, y: 0.5 },
      '100% 100%': { x: 1, y: 1 },
      '10% 80%'  : { x: 0.1, y: 0.8 },
      '80% 10%'  : { x: 0.8, y: 0.1 }
    };

    for (const pos in values) {
      assert.deepStrictEqual(parsePosition(pos), values[pos], pos);
    }
  });

  it('should parse 1 percentage', () => {
    const values = {
      '0%'  : { x: 0, y: 0 },
      '50%' : { x: 0.5, y: 0.5 },
      '100%': { x: 1, y: 1 },
      '80%' : { x: 0.8, y: 0.8 }
    };

    for (const pos in values) {
      assert.deepStrictEqual(parsePosition(pos), values[pos], pos);
    }
  });

  it('should parse mixed keyword & percentage', () => {
    const values = {
      'top 80%'   : { x: 0.8, y: 0 },
      '80% bottom': { x: 0.8, y: 1 },
      'left 40%'  : { x: 0, y: 0.4 },
      '40% right' : { x: 1, y: 0.4 },
      'center 10%': { x: 0.5, y: 0.1 },
      '10% center': { x: 0.1, y: 0.5 }
    };

    for (const pos in values) {
      assert.deepStrictEqual(parsePosition(pos), values[pos], pos);
    }
  });

  it('should fallback on parse fail', () => {
    const values = {
      ''       : { x: 0.5, y: 0.5 },
      'crap'   : { x: 0.5, y: 0.5 },
      'foo bar': { x: 0.5, y: 0.5 },
      'foo 50%': { x: 0.5, y: 0.5 },
      '%'      : { x: 0.5, y: 0.5 }
    };

    for (const pos in values) {
      assert.deepStrictEqual(parsePosition(pos), values[pos], pos);
    }
  });

  it('should ignore extra tokens', () => {
    const values = {
      'top center bottom'                      : { x: 0.5, y: 0 },
      '50% left 20%'                           : { x: 0, y: 0.5 },
      '0% 0% okay this time it goes ridiculous': { x: 0, y: 0 }
    };

    for (const pos in values) {
      assert.deepStrictEqual(parsePosition(pos), values[pos], pos);
    }
  });

  it('should ignore case', () => {
    const values = {
      'TOP CENTER' : { x: 0.5, y: 0 },
      'cenTer LefT': { x: 0, y: 0.5 }
    };

    for (const pos in values) {
      assert.deepStrictEqual(parsePosition(pos), values[pos], pos);
    }
  });
});


describe('utils:psv:parseSpeed', () => {
  it('should parse all units', () => {
    const values = {
      '360dpm'                    : 360 * Math.PI / 180 / 60,
      '360degrees per minute'     : 360 * Math.PI / 180 / 60,
      '10dps'                     : 10 * Math.PI / 180,
      '10degrees per second'      : 10 * Math.PI / 180,
      '2radians per minute'       : 2 / 60,
      '0.1radians per second'     : 0.1,
      '2rpm'                      : 2 * 2 * Math.PI / 60,
      '2revolutions per minute'   : 2 * 2 * Math.PI / 60,
      '0.01rps'                   : 0.01 * 2 * Math.PI,
      '0.01revolutions per second': 0.01 * 2 * Math.PI
    };

    for (const speed in values) {
      assert.strictEqual(parseSpeed(speed).toFixed(16), values[speed].toFixed(16), speed);
    }
  });

  it('should allow various forms', () => {
    const values = {
      '2rpm'                     : 2 * 2 * Math.PI / 60,
      '2 rpm'                    : 2 * 2 * Math.PI / 60,
      '2revolutions per minute'  : 2 * 2 * Math.PI / 60,
      '2 revolutions per minute' : 2 * 2 * Math.PI / 60,
      '-2rpm'                    : -2 * 2 * Math.PI / 60,
      '-2 rpm'                   : -2 * 2 * Math.PI / 60,
      '-2revolutions per minute' : -2 * 2 * Math.PI / 60,
      '-2 revolutions per minute': -2 * 2 * Math.PI / 60
    };

    for (const speed in values) {
      assert.strictEqual(parseSpeed(speed).toFixed(16), values[speed].toFixed(16), speed);
    }
  });

  it('should throw exception on invalid unit', () => {
    assert.throws(() => {
      parseSpeed('10rpsec');
    }, /Unknown speed unit "rpsec"/, '10rpsec');
  });

  it('should passthrough when number', () => {
    assert.strictEqual(parseSpeed(Math.PI), Math.PI);
  });
});

describe('utils:psv:getXMPValue', () => {
  it('should parse XMP data with children', () => {
    const data = '<rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">\
      <GPano:ProjectionType>equirectangular</GPano:ProjectionType>\
      <GPano:UsePanoramaViewer>True</GPano:UsePanoramaViewer>\
      <GPano:CroppedAreaImageWidthPixels>5376</GPano:CroppedAreaImageWidthPixels>\
      <GPano:CroppedAreaImageHeightPixels>2688</GPano:CroppedAreaImageHeightPixels>\
      <GPano:FullPanoWidthPixels>5376</GPano:FullPanoWidthPixels>\
      <GPano:FullPanoHeightPixels>2688</GPano:FullPanoHeightPixels>\
      <GPano:CroppedAreaLeftPixels>0</GPano:CroppedAreaLeftPixels>\
      <GPano:CroppedAreaTopPixels>0</GPano:CroppedAreaTopPixels>\
      <GPano:PoseHeadingDegrees>270.0</GPano:PoseHeadingDegrees>\
      <GPano:PosePitchDegrees>0</GPano:PosePitchDegrees>\
      <GPano:PoseRollDegrees>0.2</GPano:PoseRollDegrees>\
    </rdf:Description>';

    assert.deepStrictEqual([
      getXMPValue(data, 'FullPanoWidthPixels'),
      getXMPValue(data, 'FullPanoHeightPixels'),
      getXMPValue(data, 'CroppedAreaImageWidthPixels'),
      getXMPValue(data, 'CroppedAreaImageHeightPixels'),
      getXMPValue(data, 'CroppedAreaLeftPixels'),
      getXMPValue(data, 'CroppedAreaTopPixels'),
      getXMPValue(data, 'PoseHeadingDegrees'),
      getXMPValue(data, 'PosePitchDegrees'),
      getXMPValue(data, 'PoseRollDegrees'),
    ], [
      5376, 2688, 5376, 2688, 0, 0, 270, 0, 0
    ])
  });

  it('should parse XMP data with attributes', () => {
    const data = '<rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/"\
      GPano:ProjectionType="equirectangular"\
      GPano:UsePanoramaViewer="True"\
      GPano:CroppedAreaImageWidthPixels="5376"\
      GPano:CroppedAreaImageHeightPixels="2688"\
      GPano:FullPanoWidthPixels="5376"\
      GPano:FullPanoHeightPixels="2688"\
      GPano:CroppedAreaLeftPixels="0"\
      GPano:CroppedAreaTopPixels="0"\
      GPano:PoseHeadingDegrees="270"\
      GPano:PosePitchDegrees="0"\
      GPano:PoseRollDegrees="0"/>';

    assert.deepStrictEqual([
      getXMPValue(data, 'FullPanoWidthPixels'),
      getXMPValue(data, 'FullPanoHeightPixels'),
      getXMPValue(data, 'CroppedAreaImageWidthPixels'),
      getXMPValue(data, 'CroppedAreaImageHeightPixels'),
      getXMPValue(data, 'CroppedAreaLeftPixels'),
      getXMPValue(data, 'CroppedAreaTopPixels'),
      getXMPValue(data, 'PoseHeadingDegrees'),
      getXMPValue(data, 'PosePitchDegrees'),
      getXMPValue(data, 'PoseRollDegrees'),
    ], [
      5376, 2688, 5376, 2688, 0, 0, 270, 0, 0
    ])
  });

});

describe('utils:psv:cleanPosition', () => {
  it('should clean various formats', () => {
    assert.deepStrictEqual(cleanPosition('top right'), ['top', 'right']);
    assert.deepStrictEqual(cleanPosition('right top'), ['top', 'right']);
    assert.deepStrictEqual(cleanPosition(['top', 'right']), ['top', 'right']);
  });

  it('should add missing center', () => {
    assert.deepStrictEqual(cleanPosition('top'), ['top', 'center']);
    assert.deepStrictEqual(cleanPosition('left'), ['center', 'left']);
    assert.deepStrictEqual(cleanPosition('center'), ['center', 'center']);
  });

  it('should dissallow all center', () => {
    assert.strictEqual(cleanPosition('center center', { allowCenter: false }), null);
    assert.strictEqual(cleanPosition('center', { allowCenter: false }), null);
  });

  it('should return null on unparsable values', () => {
    assert.strictEqual(cleanPosition('foo bar'), null);
    assert.strictEqual(cleanPosition('TOP CENTER'), null);
    assert.strictEqual(cleanPosition(''), null);
    assert.strictEqual(cleanPosition(undefined), null);
  });

  it('should allow XY order', () => {
    assert.deepStrictEqual(cleanPosition('right top', { cssOrder: false }), ['right', 'top']);
    assert.deepStrictEqual(cleanPosition(['top', 'right'], { cssOrder: false }), ['top', 'right']);
  });

  it('should always order with center', () => {
    assert.deepStrictEqual(cleanPosition('center top'), ['top', 'center']);
    assert.deepStrictEqual(cleanPosition('left center'), ['center', 'left']);
  });
});
