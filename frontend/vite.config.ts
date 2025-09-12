import react from '@vitejs/plugin-react'

export default {
  plugins: [react()],
  server: { port: 5174, host: true }
}
