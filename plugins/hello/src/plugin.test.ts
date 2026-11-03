import { helloPlugin } from './plugin';

describe('hello', () => {
  it('should export plugin', () => {
    expect(helloPlugin).toBeDefined();
  });
});
