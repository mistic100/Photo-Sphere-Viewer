var vm = require('vm');
var fs = require('fs');
var assert = require('assert');

// Load PSVUtils (not a node module) in current context
global.PhotoSphereViewer = {};
vm.runInThisContext(fs.readFileSync('node_modules/three/build/three.js'));
vm.runInThisContext(fs.readFileSync('src/js/PSVError.js'));
vm.runInThisContext(fs.readFileSync('src/js/PSVUtils.js'));


describe('PSVUtils::parseAngle', function() {
  it('should parse radians angles', function() {
    var values = {
      '0': 0,
      '1.72': 1.72,
      '-2.56': PSVUtils.TwoPI - 2.56,
      '3.14rad': 3.14,
      '-3.14rad': PSVUtils.TwoPI - 3.14
    };

    for (var pos in values) {
      assert.equal(PSVUtils.parseAngle(pos).toFixed(16), values[pos].toFixed(16), pos);
    }
  });

  it('should parse degrees angles', function() {
    var values = {
      '0deg': 0,
      '30deg': 30 * Math.PI / 180,
      '-30deg': PSVUtils.TwoPI - 30 * Math.PI / 180,
      '85degs': 85 * Math.PI / 180,
      '360degs': 0
    };

    for (var pos in values) {
      assert.equal(PSVUtils.parseAngle(pos).toFixed(16), values[pos].toFixed(16), pos);
    }
  });

  it('should normalize angles between 0 and 2Pi', function() {
    var values = {
      '450deg': Math.PI / 2,
      '1440deg': 0,
      '8.15': 8.15 - PSVUtils.TwoPI,
      '-3.14': PSVUtils.TwoPI - 3.14,
      '-360deg': 0
    };

    for (var pos in values) {
      assert.equal(PSVUtils.parseAngle(pos).toFixed(16), values[pos].toFixed(16), pos);
    }
  });

  it('should normalize angles between -Pi/2 and Pi/2', function() {
    var values = {
      '45deg': Math.PI / 4,
      '-4': Math.PI / 2
    };

    for (var pos in values) {
      assert.equal(PSVUtils.parseAngle(pos, true).toFixed(16), values[pos].toFixed(16), pos);
    }
  });

  it('should throw exception on invalid values', function() {
    assert.throws(function() {
      PSVUtils.parseAngle('foobar');
    }, /unknown angle "foobar"/, 'foobar');

    assert.throws(function() {
      PSVUtils.parseAngle('200gr')
    }, /unknown angle unit "gr"/, '200gr');
  });
});


describe('PSVUtils::parsePosition', function() {
  it('should parse 2 keywords', function() {
    var values = {
      'top left': { left: 0, top: 0 },
      'top center': { left: 0.5, top: 0 },
      'top right': { left: 1, top: 0 },
      'center left': { left: 0, top: 0.5 },
      'center center': { left: 0.5, top: 0.5 },
      'center right': { left: 1, top: 0.5 },
      'bottom left': { left: 0, top: 1 },
      'bottom center': { left: 0.5, top: 1 },
      'bottom right': { left: 1, top: 1 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);

      var rev = pos.split(' ').reverse().join(' ');
      assert.deepEqual(PSVUtils.parsePosition(rev), values[pos], rev);
    }
  });

  it('should parse 1 keyword', function() {
    var values = {
      'top': { left: 0.5, top: 0 },
      'center': { left: 0.5, top: 0.5 },
      'bottom': { left: 0.5, top: 1 },
      'left': { left: 0, top: 0.5 },
      'right': { left: 1, top: 0.5 },
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should parse 2 percentages', function() {
    var values = {
      '0% 0%': { left: 0, top: 0 },
      '50% 50%': { left: 0.5, top: 0.5 },
      '100% 100%': { left: 1, top: 1 },
      '10% 80%': { left: 0.1, top: 0.8 },
      '80% 10%': { left: 0.8, top: 0.1 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should parse 1 percentage', function() {
    var values = {
      '0%': { left: 0, top: 0 },
      '50%': { left: 0.5, top: 0.5 },
      '100%': { left: 1, top: 1 },
      '80%': { left: 0.8, top: 0.8 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should parse mixed keyword & percentage', function() {
    var values = {
      'top 80%': { left: 0.8, top: 0 },
      '80% bottom': { left: 0.8, top: 1 },
      'left 40%': { left: 0, top: 0.4 },
      '40% right': { left: 1, top: 0.4 },
      'center 10%': { left: 0.5, top: 0.1 },
      '10% center': { left: 0.1, top: 0.5 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should fallback on parse fail', function() {
    var values = {
      '': { left: 0.5, top: 0.5 },
      'crap': { left: 0.5, top: 0.5 },
      'foo bar': { left: 0.5, top: 0.5 },
      'foo 50%': { left: 0.5, top: 0.5 },
      '%': { left: 0.5, top: 0.5 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should ignore extra tokens', function() {
    var values = {
      'top center bottom': { left: 0.5, top: 0 },
      '50% left 20%': { left: 0, top: 0.5 },
      '0% 0% okay this time it goes ridiculous': { left: 0, top: 0 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should ignore case', function() {
    var values = {
      'TOP CENTER': { left: 0.5, top: 0 },
      'cenTer LefT': { left: 0, top: 0.5 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });
});


describe('PSVUtils::parseSpeed', function() {
  it('should parse all units', function() {
    var values = {
      '360dpm': 360 * Math.PI / 180 / 60,
      '360degrees per minute': 360 * Math.PI / 180 / 60,
      '10dps': 10 * Math.PI / 180,
      '10degrees per second': 10 * Math.PI / 180,
      '2radians per minute': 2 / 60,
      '0.1radians per second': 0.1,
      '2rpm': 2 * 2 * Math.PI / 60,
      '2revolutions per minute': 2 * 2 * Math.PI / 60,
      '0.01rps': 0.01 * 2 * Math.PI,
      '0.01revolutions per second': 0.01 * 2 * Math.PI
    };

    for (var speed in values) {
      assert.equal(PSVUtils.parseSpeed(speed).toFixed(16), values[speed].toFixed(16), speed);
    }
  });

  it('should allow various forms', function() {
    var values = {
      '2rpm': 2 * 2 * Math.PI / 60,
      '2 rpm': 2 * 2 * Math.PI / 60,
      '2revolutions per minute': 2 * 2 * Math.PI / 60,
      '2 revolutions per minute': 2 * 2 * Math.PI / 60,
      '-2rpm': -2 * 2 * Math.PI / 60,
      '-2 rpm': -2 * 2 * Math.PI / 60,
      '-2revolutions per minute': -2 * 2 * Math.PI / 60,
      '-2 revolutions per minute': -2 * 2 * Math.PI / 60
    };

    for (var speed in values) {
      assert.equal(PSVUtils.parseSpeed(speed).toFixed(16), values[speed].toFixed(16), speed);
    }
  });

  it('should throw exception on invalid unit', function() {
    assert.throws(function() {
      PSVUtils.parseSpeed('10rpsec');
    }, /unknown speed unit "rpsec"/, '10rpsec');
  });

  it('should passthrough when number', function() {
    assert.equal(PSVUtils.parseSpeed(Math.PI), Math.PI, Math.PI);
  });
});

describe('PSVUtils::deepmerge', function() {
  it('should merge basic plain objects', function() {
    var one = { a: 'z', b: { c: { d: 'e' } } };
    var two = { b: { c: { f: 'g', j: 'i' } } };

    var result = PSVUtils.deepmerge(one, two);

    assert.deepEqual(one, { a: 'z', b: { c: { d: 'e', f: 'g', j: 'i' } } });
    assert.equal(result, one);
  });

  it('should merge arrays by replace', function() {
    var one = { a: [1, 2, 3] };
    var two = { a: [2, 4] };

    var result = PSVUtils.deepmerge(one, two);

    assert.deepEqual(one, { a: [2, 4] });
    assert.equal(result, one);
  });

  it('should clone object', function() {
    var one = { b: { c: { d: 'e' } } };

    var result = PSVUtils.deepmerge(null, one);

    assert.deepEqual(result, { b: { c: { d: 'e' } } });
    assert.notEqual(result, one);
    assert.notEqual(result.b.c, one.b.c);
  });

  it('should clone array', function() {
    var one = [{ a: 'b' }, { c: 'd' }];

    var result = PSVUtils.deepmerge(null, one);

    assert.deepEqual(result, [{ a: 'b' }, { c: 'd' }]);
    assert.notEqual(result[0], one[1]);
  });

  it('should accept primitives', function() {
    var one = 'foo';
    var two = 'bar';

    var result = PSVUtils.deepmerge(one, two);

    assert.equal(result, 'bar');
  });

  it('should stop on recursion', function() {
    var one = { a: 'foo' };
    one.b = one;

    var result = PSVUtils.deepmerge(null, one);

    assert.deepEqual(result, { a: 'foo' });
  });
});

describe('PSVUtils::getXMPValue', function() {
  it('should parse XMP data with children', function() {
    var data = '<rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">\
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

    assert.deepEqual([
      PSVUtils.getXMPValue(data, 'FullPanoWidthPixels'),
      PSVUtils.getXMPValue(data, 'FullPanoHeightPixels'),
      PSVUtils.getXMPValue(data, 'CroppedAreaImageWidthPixels'),
      PSVUtils.getXMPValue(data, 'CroppedAreaImageHeightPixels'),
      PSVUtils.getXMPValue(data, 'CroppedAreaLeftPixels'),
      PSVUtils.getXMPValue(data, 'CroppedAreaTopPixels')
    ], [
      '5376', '2688', '5376', '2688', '0', '0'
    ])
  });

  it('should parse XMP data with attributes', function() {
    var data = '<rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/"\
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

    assert.deepEqual([
      PSVUtils.getXMPValue(data, 'FullPanoWidthPixels'),
      PSVUtils.getXMPValue(data, 'FullPanoHeightPixels'),
      PSVUtils.getXMPValue(data, 'CroppedAreaImageWidthPixels'),
      PSVUtils.getXMPValue(data, 'CroppedAreaImageHeightPixels'),
      PSVUtils.getXMPValue(data, 'CroppedAreaLeftPixels'),
      PSVUtils.getXMPValue(data, 'CroppedAreaTopPixels')
    ], [
      '5376', '2688', '5376', '2688', '0', '0'
    ])
  });

});

describe('PSVUtils::dasherize', function() {
  it('should dasherize from camelCase', function() {
    assert.equal(PSVUtils.dasherize('strokeWidth'), 'stroke-width');
  });

  it('should not change existing dash-case', function() {
    assert.equal(PSVUtils.dasherize('stroke-width'), 'stroke-width');
  });
});
