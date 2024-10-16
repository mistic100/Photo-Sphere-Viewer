import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        viewportWidth: 1280,
        viewportHeight: 900,
        baseUrl: 'http://127.0.0.1:8080',
        supportFile: false,
    },
});
