import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        game: resolve(__dirname, 'game.html'),
        pets: resolve(__dirname, 'pets.html'),
        endangered: resolve(__dirname, 'endangered.html'),
        families: resolve(__dirname, 'families.html'),
        history: resolve(__dirname, 'history.html'),
        report: resolve(__dirname, 'report.html'),
      },
    },
  },
});
