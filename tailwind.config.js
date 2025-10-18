/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // TAMBAHKAN BARIS INI JIKA KAMU PAKAI LIBRARY KOMPONEN
    // Ganti 'nama-library' dengan nama library yang relevan jika kamu tahu
    "./node_modules/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}