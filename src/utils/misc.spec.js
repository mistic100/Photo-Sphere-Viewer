import assert from 'assert';

import { deepmerge, dasherize } from './misc';

describe('utils:misc:deepmerge', () => {
  it('should merge basic plain objects', () => {
    const one = { a: 'z', b: { c: { d: 'e' } } };
    const two = { b: { c: { f: 'g', j: 'i' } } };

    const result = deepmerge(one, two);

    assert.deepStrictEqual(one, { a: 'z', b: { c: { d: 'e', f: 'g', j: 'i' } } });
    assert.strictEqual(result, one);
  });

  it('should merge arrays by replace', () => {
    const one = { a: [1, 2, 3] };
    const two = { a: [2, 4] };

    const result = deepmerge(one, two);

    assert.deepStrictEqual(one, { a: [2, 4] });
    assert.strictEqual(result, one);
  });

  it('should clone object', () => {
    const one = { b: { c: { d: 'e' } } };

    const result = deepmerge(null, one);

    assert.deepStrictEqual(result, { b: { c: { d: 'e' } } });
    assert.notStrictEqual(result, one);
    assert.notStrictEqual(result.b.c, one.b.c);
  });

  it('should clone array', () => {
    const one = [{ a: 'b' }, { c: 'd' }];

    const result = deepmerge(null, one);

    assert.deepStrictEqual(result, [{ a: 'b' }, { c: 'd' }]);
    assert.notStrictEqual(result[0], one[1]);
  });

  it('should accept primitives', () => {
    const one = 'foo';
    const two = 'bar';

    const result = deepmerge(one, two);

    assert.strictEqual(result, 'bar');
  });

  it('should stop on recursion', () => {
    const one = { a: 'foo' };
    one.b = one;

    const result = deepmerge(null, one);

    assert.deepStrictEqual(result, { a: 'foo' });
  });
});

describe('utils:misc:dasherize', () => {
  it('should dasherize from camelCase', () => {
    assert.strictEqual(dasherize('strokeWidth'), 'stroke-width');
  });

  it('should not change existing dash-case', () => {
    assert.strictEqual(dasherize('stroke-width'), 'stroke-width');
  });
});
