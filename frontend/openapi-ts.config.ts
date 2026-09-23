import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '../api/generated/@typespec/openapi3/openapi.yaml',
  output: 'src/api/generated',
  plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
})
